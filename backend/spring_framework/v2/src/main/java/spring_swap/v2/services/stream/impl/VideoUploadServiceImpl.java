package spring_swap.v2.services.stream.impl;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import spring_swap.v2.dtos.stream.*;
import spring_swap.v2.models.stream.VideoProcessingStatus;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.models.stream.Playlist;
import spring_swap.v2.models.stream.PlaylistVideo;
import spring_swap.v2.models.stream.Video;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.repo.stream.PlaylistRepository;
import spring_swap.v2.repo.stream.VideoRepository;
import spring_swap.v2.services.stream.VideoUploadService;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoUploadServiceImpl implements VideoUploadService {

    @Value("${app.video.raw-dir}")
    private String RAW_DIR;

    @Value("${app.video.hls-dir}")
    private String HLS_DIR;

    private final VideoRepository    videoRepository;
    private final PlaylistRepository playlistRepository;
    private final UserRepository     userRepository;

    // ── Init ────────────────────────────────────────────────────────────────

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(RAW_DIR));
            Files.createDirectories(Paths.get(HLS_DIR));
            log.info("Video storage initialised → raw: {}, hls: {}", RAW_DIR, HLS_DIR);
        } catch (IOException e) {
            throw new RuntimeException("Cannot initialise video storage directories", e);
        }
    }

    // ── Video ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public VideoResponseDTO upload(MultipartFile file, VideoUploadRequestDTO dto, UUID uploadedByUserId) {
        validateVideoFile(file);

        User uploader = userRepository.findById(uploadedByUserId)
                .orElseThrow(() -> new RuntimeException("Uploader not found: " + uploadedByUserId));

        // Unique filename prevents collisions from re-uploads
        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload"
        );
        String storedFilename = UUID.randomUUID() + "_" + originalFilename;
        Path rawFilePath = Paths.get(RAW_DIR, storedFilename);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, rawFilePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store raw video file", e);
        }

        Video video = Video.builder()
                .title(dto.title())
                .description(dto.description())
                .originalFilename(originalFilename)
                .contentType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .is18Plus(dto.is18Plus())
                .processingStatus(VideoProcessingStatus.PENDING)
                .rawFilePath(rawFilePath.toString())
                .uploadedBy(uploader)
                .build();

        video = videoRepository.save(video);
        log.info("Video record saved [id={}, uuid={}, uploader={}]",
                video.getId(), video.getVideoUuid(), uploadedByUserId);

        processHls(video, rawFilePath);

        return toResponseDTO(videoRepository.save(video));
    }


    private void processHls(Video video, Path rawFilePath) {
        Path outputDir = Paths.get(HLS_DIR, video.getVideoUuid().toString());
        try {
            Files.createDirectories(outputDir);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create HLS output directory", e);
        }

        video.setProcessingStatus(VideoProcessingStatus.PROCESSING);
        videoRepository.save(video);

        String ffmpegCmd = String.format(
                "ffmpeg -i \"%s\" " +
                        "-map 0:v -map 0:a? -filter:v:0 scale=1920:1080 -c:v:0 libx264 -b:v:0 5000k -c:a:0 aac " +
                        "-map 0:v -map 0:a? -filter:v:1 scale=1280:720  -c:v:1 libx264 -b:v:1 2800k -c:a:1 aac " +
                        "-map 0:v -map 0:a? -filter:v:2 scale=640:360   -c:v:2 libx264 -b:v:2 800k  -c:a:2 aac " +
                        "-preset fast " +
                        "-var_stream_map \"v:0,a:0 v:1,a:1 v:2,a:2\" " +
                        "-master_pl_name master.m3u8 " +
                        "-f hls -hls_time 10 -hls_list_size 0 " +
                        "-hls_segment_filename \"%s/v%%v/segment_%%03d.ts\" " +
                        "\"%s/v%%v/prog_index.m3u8\"",
                rawFilePath.toAbsolutePath(),
                outputDir.toAbsolutePath(),
                outputDir.toAbsolutePath()
        );
        log.info("Starting HLS processing [uuid={}]", video.getVideoUuid());
        log.debug("ffmpeg command: {}", ffmpegCmd);

        try {
            ProcessBuilder pb = new ProcessBuilder("/bin/bash", "-c", ffmpegCmd);
            pb.redirectErrorStream(true);

            Process process = pb.start();
            String logs = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();
            System.out.println(logs);


            if (exitCode != 0) {
                video.setProcessingStatus(VideoProcessingStatus.FAILED);
                videoRepository.save(video);
                throw new RuntimeException(
                        "ffmpeg exited with code " + exitCode + " for video " + video.getVideoUuid());
            }

            video.setHlsBasePath(outputDir.toString());
            generateThumbnail(video, rawFilePath, outputDir);
            video.setProcessingStatus(VideoProcessingStatus.READY);
            log.info("HLS processing complete [uuid={}]", video.getVideoUuid());

        } catch (IOException e) {
            video.setProcessingStatus(VideoProcessingStatus.FAILED);
            videoRepository.save(video);
            throw new RuntimeException("Failed to launch ffmpeg for video " + video.getVideoUuid(), e);
        } catch (InterruptedException e) {
            video.setProcessingStatus(VideoProcessingStatus.FAILED);
            videoRepository.save(video);
            Thread.currentThread().interrupt();
            throw new RuntimeException("ffmpeg interrupted for video " + video.getVideoUuid(), e);
        }
    }

    private void generateThumbnail(Video video, Path rawFilePath, Path outputDir) {
        Path thumbPath = outputDir.resolve("thumbnail.jpg");
        String cmd = String.format(
                "ffmpeg -y -i \"%s\" -ss 00:00:02 -vframes 1 -vf \"scale=640:-1\" \"%s\"",
                rawFilePath.toAbsolutePath(),
                thumbPath.toAbsolutePath()
        );
        try {
            ProcessBuilder pb = new ProcessBuilder("/bin/bash", "-c", cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String logs = new String(process.getInputStream().readAllBytes());
            int exitCode = process.waitFor();

            if (exitCode == 0 && Files.exists(thumbPath)) {
                video.setThumbnailPath(thumbPath.toString());
                log.info("Thumbnail generated [uuid={}]", video.getVideoUuid());
            } else {
                log.warn("Thumbnail generation failed [uuid={}, exitCode={}]\n{}",
                        video.getVideoUuid(), exitCode, logs);
            }
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            log.warn("Thumbnail generation error [uuid={}]", video.getVideoUuid(), e);
        }
    }

    @Override
    @Transactional
    public void delete(UUID videoUuid, UUID requestedByUserId) {
        Video video = findByUuidOrThrow(videoUuid);
        log.warn("Video deletion [uuid={}, requestedBy={}]", videoUuid, requestedByUserId);

        try {
            Path hlsDir = Paths.get(HLS_DIR, videoUuid.toString());
            if (Files.exists(hlsDir)) deleteDirectoryRecursively(hlsDir);
            if (video.getRawFilePath() != null) {
                Files.deleteIfExists(Paths.get(video.getRawFilePath()));
            }
        } catch (IOException e) {
            log.error("File cleanup failed for video {}", videoUuid, e);
        }

        videoRepository.delete(video);
        log.info("Video deleted [uuid={}]", videoUuid);
    }

    @Override
    public VideoResponseDTO getVideo(UUID videoUuid) {
        return toResponseDTO(findByUuidOrThrow(videoUuid));
    }

    @Override
    public List<VideoResponseDTO> getAllVideos() {
        return videoRepository.findAllByOrderByUploadedAtDesc()
                .stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public VideoStreamResponseDTO getStreamInfo(UUID videoUuid) {
        Video video = findByUuidOrThrow(videoUuid);
        boolean ready = video.getProcessingStatus() == VideoProcessingStatus.READY;

        String masterUrl = ready ? "/api/v1/videos/" + videoUuid + "/master.m3u8" : null;
        String thumbnailUrl = video.getThumbnailPath() != null
                ? "/api/v1/videos/" + videoUuid + "/thumbnail.jpg"
                : null;
        List<VideoQualityDTO> qualities = ready ? buildQualityList(videoUuid) : List.of();

        return new VideoStreamResponseDTO(
                video.getVideoUuid(),
                video.getTitle(),
                masterUrl,
                thumbnailUrl,
                qualities,
                video.is18Plus(),
                video.getProcessingStatus().name()
        );
    }

    private List<VideoQualityDTO> buildQualityList(UUID videoUuid) {
        // Fixed mapping from the ffmpeg -var_stream_map: v:0=1080p, v:1=720p, v:2=360p
        return List.of(
                new VideoQualityDTO(1080, "1080p", "/api/v1/videos/" + videoUuid + "/v0/prog_index.m3u8"),
                new VideoQualityDTO(720,  "720p",  "/api/v1/videos/" + videoUuid + "/v1/prog_index.m3u8"),
                new VideoQualityDTO(360,  "360p",  "/api/v1/videos/" + videoUuid + "/v2/prog_index.m3u8")
        );
    }

    // ── Playlists ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PlaylistResponseDTO createPlaylist(CreatePlaylistRequestDTO dto, UUID userID) {
        User user = userRepository.findById(userID)
                .orElseThrow(() -> new RuntimeException("User not found: " + userID));

        Playlist playlist = Playlist.builder()
                .user(user)
                .name(dto.name())
                .isPrivate(dto.isPrivate())
                .build();

        return toPlaylistDTO(playlistRepository.save(playlist));
    }

    @Override
    @Transactional
    public PlaylistResponseDTO addVideoToPlaylist(Long playlistId, UUID videoUuid, Integer position) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found: " + playlistId));
        Video video = findByUuidOrThrow(videoUuid);

        int resolvedPosition = (position != null) ? position : playlist.getVideos().size() + 1;

        PlaylistVideo pv = PlaylistVideo.builder()
                .playlist(playlist)
                .video(video)
                .position(resolvedPosition)
                .build();
        playlist.getVideos().add(pv);

        return toPlaylistDTO(playlistRepository.save(playlist));
    }

    @Override
    @Transactional
    public void removeVideoFromPlaylist(Long playlistId, UUID videoUuid) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found: " + playlistId));
        playlist.getVideos().removeIf(pv -> pv.getVideo().getVideoUuid().equals(videoUuid));
        playlistRepository.save(playlist);
    }

    @Override
    public PlaylistResponseDTO getPlaylist(Long playlistId) {
        return toPlaylistDTO(playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found: " + playlistId)));
    }

    @Override
    public List<PlaylistResponseDTO> getUserPlaylists(UUID userId) {
        return playlistRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toPlaylistDTO).collect(Collectors.toList());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Video findByUuidOrThrow(UUID videoUuid) {
        return videoRepository.findByVideoUuid(videoUuid)
                .orElseThrow(() -> new RuntimeException("Video not found: " + videoUuid));
    }

    private void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Video file must not be empty");
        }
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("video/")) {
            throw new IllegalArgumentException("Uploaded file is not a video (content-type: " + ct + ")");
        }
        // 5 GB hard cap
        long maxBytes = 5L * 1024 * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("Video exceeds the 5 GB upload limit");
        }
    }

    private void deleteDirectoryRecursively(Path dir) throws IOException {
        try (var stream = Files.walk(dir)) {
            stream.sorted((a, b) -> b.compareTo(a))
                    .forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
        }
    }

    private VideoResponseDTO toResponseDTO(Video v) {
        return new VideoResponseDTO(
                v.getId(),
                v.getTitle(),
                v.getDescription(),
                v.getProcessingStatus() == VideoProcessingStatus.READY
                        ? "/api/v1/videos/" + v.getVideoUuid() + "/master.m3u8"
                        : null,
                v.getThumbnailPath() != null
                        ? "/api/v1/videos/" + v.getVideoUuid() + "/thumbnail.jpg"
                        : null,
                v.getDurationSecs(),
                v.is18Plus()
        );
    }

    private PlaylistVideoResponseDTO toPlaylistVideoDTO(PlaylistVideo pv) {
        return new PlaylistVideoResponseDTO(pv.getPosition(), toResponseDTO(pv.getVideo()));
    }

    private PlaylistResponseDTO toPlaylistDTO(Playlist p) {
        List<PlaylistVideoResponseDTO> videos = p.getVideos().stream()
                .map(this::toPlaylistVideoDTO)
                .collect(Collectors.toList());
        return new PlaylistResponseDTO(
                p.getId(),
                p.getUser().getId(),
                p.getName(),
                p.getIsPrivate(),
                videos
        );
    }
}