package spring_swap.v2.controllers.chat;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;
import spring_swap.v2.document.chat.ChatDocument;
import spring_swap.v2.document.chat.MessageType;
import spring_swap.v2.dtos.chat.MessageResponse;
import spring_swap.v2.exceptions.ChatDomainException;
import spring_swap.v2.repository.chat.ChatRepository;
import spring_swap.v2.repository.chat.MessageRepository;
import spring_swap.v2.services.chat.MediaMessageService;
import spring_swap.v2.services.chat.MediaStorageService;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chats/{chatId}/media")
public class MediaController {

    private final MediaMessageService mediaMessageService;
    private final MediaStorageService mediaStorageService;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    /**
     * Upload a file and immediately create a message for it.
     * type = IMAGE | VIDEO | DOC (matches MessageType; TEXT is rejected downstream).
     */
    @PostMapping(consumes = "multipart/form-data")
    public MessageResponse upload(
            @PathVariable String chatId,
            @RequestParam("file") MultipartFile file,
            @RequestParam MessageType type,
            @RequestParam(required = false) Boolean temporary,
            @RequestParam(required = false) Long temporaryDurationMinutes,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return mediaMessageService.uploadAndSend(chatId, currentUserId, file, type, temporary, temporaryDurationMinutes);
    }

    /**
     * Serves a stored file back to the browser. Matches any path under this
     * chat's media root, e.g.:
     *   GET /api/v1/chats/{chatId}/media/images/{uuid}.jpg
     *   GET /api/v1/chats/{chatId}/media/docs/{uuid}.pdf
     *
     * By default this renders inline (so <img>/<video> tags work as-is in the
     * chat thread). Pass ?download=true to force a real file download instead
     * — used by the shared-files browser's download button — which also
     * restores the original uploaded filename instead of the on-disk UUID
     * name, since browsers name the saved file after Content-Disposition's
     * filename, not the URL.
     *
     * The "/**" wildcard is pulled out of the raw request path (Spring doesn't
     * support capturing multi-segment wildcards as a normal @PathVariable),
     * then resolved against disk with a chat-membership check first so files
     * aren't fetchable by anyone who merely guesses a UUID.
     */
    @GetMapping("/**")
    public ResponseEntity<Resource> serve(
            @PathVariable String chatId,
            @RequestParam(required = false, defaultValue = "false") boolean download,
            HttpServletRequest request,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatDomainException("Chat not found"));
        if (!chat.getParticipantIds().contains(currentUserId.toString())) {
            throw new ChatDomainException("You are not a participant in this chat");
        }

        String fullPath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String marker = "/media/";
        int idx = fullPath.indexOf(marker);
        if (idx < 0) {
            throw new ChatDomainException("Invalid media path");
        }
        String subpath = fullPath.substring(idx + marker.length());
        String relativePath = chatId + "/" + subpath;

        Path filePath = mediaStorageService.resolve(relativePath);
        if (!Files.exists(filePath)) {
            throw new ChatDomainException("File not found");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            MediaType mediaType = contentType != null
                    ? MediaType.parseMediaType(contentType)
                    : MediaType.APPLICATION_OCTET_STREAM;

            ResponseEntity.BodyBuilder response = ResponseEntity.ok().contentType(mediaType);

            if (download) {
                String downloadName = messageRepository.findByChatIdAndMediaUrlEndingWith(chatId, subpath)
                        .map(m -> m.getMediaFileName())
                        .filter(name -> name != null && !name.isBlank())
                        .orElse(filePath.getFileName().toString());

                response.header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(downloadName).build().toString());
            }

            return response.body(resource);
        } catch (MalformedURLException e) {
            throw new ChatDomainException("Invalid file path");
        } catch (IOException e) {
            throw new ChatDomainException("Could not determine file type");
        }
    }
}