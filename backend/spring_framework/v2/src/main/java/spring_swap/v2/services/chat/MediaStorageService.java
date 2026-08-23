package spring_swap.v2.services.chat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import spring_swap.v2.document.chat.MessageType;
import spring_swap.v2.exceptions.ChatDomainException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Saves uploaded chat media to local disk, organized as:
 *   {storage-root}/{chatId}/images/{uuid}.{ext}
 *   {storage-root}/{chatId}/videos/{uuid}.{ext}
 *   {storage-root}/{chatId}/docs/{uuid}.{ext}
 *
 * Files are served back via MediaController's GET endpoint (not directly
 * exposed as static resources), so access can be gated by chat membership.
 */
@Service
public class MediaStorageService {

    private static final long MAX_IMAGE_BYTES = 25L * 1024 * 1024;      // 25MB
    private static final long MAX_VIDEO_BYTES = 2000L * 1024 * 1024;    // 2000MB
    private static final long MAX_DOC_BYTES = 100L * 1024 * 1024;       // 100MB

    private final Path storageRoot;

    public MediaStorageService(@Value("${chat.media.storage-path:./chat-media-storage}") String storagePath) {
        this.storageRoot = Paths.get(storagePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(storageRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create media storage directory: " + storageRoot, e);
        }
    }

    public record StoredFile(String relativePath, String fileName, long sizeBytes) {}

    public StoredFile store(String chatId, MultipartFile file, MessageType type) {
        if (file == null || file.isEmpty()) {
            throw new ChatDomainException("No file provided");
        }

        long maxBytes = switch (type) {
            case IMAGE -> MAX_IMAGE_BYTES;
            case VIDEO -> MAX_VIDEO_BYTES;
            case DOC -> MAX_DOC_BYTES;
            case TEXT -> throw new ChatDomainException("TEXT is not a media type");
        };

        if (file.getSize() > maxBytes) {
            throw new ChatDomainException(
                    "File exceeds the " + (maxBytes / (1024 * 1024)) + "MB limit for " + type.name().toLowerCase());
        }

        String subfolder = switch (type) {
            case IMAGE -> "images";
            case VIDEO -> "videos";
            case DOC -> "docs";
            case TEXT -> throw new ChatDomainException("TEXT is not a media type");
        };

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = extractExtension(originalName);
        String storedName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

        Path chatDir = storageRoot.resolve(chatId).resolve(subfolder).normalize();
        if (!chatDir.startsWith(storageRoot)) {
            // Guards against a chatId containing "../" path traversal.
            throw new ChatDomainException("Invalid chat identifier");
        }

        try {
            Files.createDirectories(chatDir);
            Path target = chatDir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = chatId + "/" + subfolder + "/" + storedName;
            return new StoredFile(relativePath, originalName, file.getSize());
        } catch (IOException e) {
            throw new ChatDomainException("Failed to store file: " + e.getMessage());
        }
    }

    /** Resolves a relative path (as stored on MessageDocument.mediaUrl) back to a real file for serving/deletion. */
    public Path resolve(String relativePath) {
        Path resolved = storageRoot.resolve(relativePath).normalize();
        if (!resolved.startsWith(storageRoot)) {
            throw new ChatDomainException("Invalid media path");
        }
        return resolved;
    }

    /**
     * Deletes a single stored file, given the relative path saved on a
     * MessageDocument's mediaUrl (after stripping the "/api/v1/chats/{chatId}/media/"
     * prefix back down to "{chatId}/{subfolder}/{filename}"). Called when an
     * individual media message is soft-deleted, so its file doesn't linger on
     * disk forever with nothing referencing it.
     */
    public void deleteOne(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        try {
            Path resolved = resolve(relativePath);
            Files.deleteIfExists(resolved);
        } catch (Exception ignored) {
            // Best-effort — a missing/already-gone file shouldn't fail the message delete.
        }
    }

    /** Deletes all stored media for a chat — called from ChatService's cascade delete. */
    public void deleteAllForChat(String chatId) {
        Path chatDir = storageRoot.resolve(chatId).normalize();
        if (!chatDir.startsWith(storageRoot) || !Files.exists(chatDir)) return;

        try (var walk = Files.walk(chatDir)) {
            walk.sorted(java.util.Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {
                            // Best-effort cleanup — don't fail the whole chat deletion over a stray file.
                        }
                    });
        } catch (IOException ignored) {
            // Best-effort — chat deletion itself should still succeed even if disk cleanup partially fails.
        }
    }

    private String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) return "file";
        // Strip path separators so a crafted filename can't escape the target directory.
        return name.replaceAll("[\\\\/]", "_");
    }

    private String extractExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot >= 0 && dot < fileName.length() - 1 ? fileName.substring(dot + 1) : "";
    }
}