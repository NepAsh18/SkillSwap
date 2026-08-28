package spring_swap.v2.controllers.stream;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.dtos.stream.*;
import spring_swap.v2.security.SecurityUtils;
import spring_swap.v2.services.stream.VideoAgeGateService;
import spring_swap.v2.services.stream.VideoUploadService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;


@Slf4j
@RestController
@RequestMapping("/api/v1/videos")
@PreAuthorize("hasRole('USER')")
@RequiredArgsConstructor
public class VideoStreamController {

    @Value("${app.video.hls-dir}")
    private String HLS_DIR;

    private final VideoUploadService  videoUploadService;
    private final VideoAgeGateService ageGateService;
    private final SecurityUtils       securityUtils;

    // ── Browse ────────────────────────────────────────────────────────────────


    @GetMapping
    public ResponseEntity<List<VideoResponseDTO>> listVideos() {
        return ResponseEntity.ok(videoUploadService.getAllVideos());
    }


    @GetMapping("/{videoUuid}/info")
    public ResponseEntity<VideoStreamResponseDTO> getStreamInfo(
            @PathVariable UUID videoUuid
            ) {
        UUID userId = securityUtils.getCurrentUserId();
        ageGateService.assertAccess(userId, videoUuid);
        return ResponseEntity.ok(videoUploadService.getStreamInfo(videoUuid));
    }

    // ── HLS Streaming (age-gated) ─────────────────────────────────────────────


    @GetMapping("/{videoUuid}/master.m3u8")
    public ResponseEntity<Resource> serveMasterPlaylist(
            @PathVariable UUID videoUuid
            ) {
        ageGateService.assertAccess(securityUtils.getCurrentUserId(), videoUuid);

        Path path = Paths.get(HLS_DIR, videoUuid.toString(), "master.m3u8");
        if (!Files.exists(path)) return ResponseEntity.notFound().build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .body(new FileSystemResource(path));
    }


    @GetMapping("/{videoUuid}/v{variantIndex}/prog_index.m3u8")
    public ResponseEntity<Resource> serveVariantPlaylist(
            @PathVariable UUID videoUuid,
            @PathVariable int  variantIndex
            ) {
        ageGateService.assertAccess(securityUtils.getCurrentUserId(), videoUuid);

        Path path = Paths.get(HLS_DIR, videoUuid.toString(),
                "v" + variantIndex, "prog_index.m3u8");
        if (!Files.exists(path)) return ResponseEntity.notFound().build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .body(new FileSystemResource(path));
    }


    @GetMapping("/{videoUuid}/v{variantIndex}/{segment}.ts")
    public ResponseEntity<Resource> serveSegment(
            @PathVariable UUID   videoUuid,
            @PathVariable int    variantIndex,
            @PathVariable String segment
            ) {
        ageGateService.assertAccess(securityUtils.getCurrentUserId(), videoUuid);

        Path path = Paths.get(HLS_DIR, videoUuid.toString(),
                "v" + variantIndex, segment + ".ts");
        if (!Files.exists(path)) return ResponseEntity.notFound().build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "video/mp2t")
                .body(new FileSystemResource(path));
    }

    // ── Age Verification ──────────────────────────────────────────────────────


    @PostMapping("/verify-age")
    public ResponseEntity<Void> verifyAge(
            @RequestBody AgeVerificationRequestDTO dto
            ) {
        UUID userId = securityUtils.getCurrentUserId();
        ageGateService.verifyAge(userId, dto);
        log.info("Age verification accepted for userId={}", userId);
        return ResponseEntity.ok().build();
    }

    // ── Playlists ─────────────────────────────────────────────────────────────


    @GetMapping("/playlists/my")
    public ResponseEntity<List<PlaylistResponseDTO>> getMyPlaylists() {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(videoUploadService.getUserPlaylists(userId));
    }


    @PostMapping("/playlists")
    public ResponseEntity<PlaylistResponseDTO> createPlaylist(
            @RequestBody CreatePlaylistRequestDTO dto
    ) {
        UUID currentUserId = securityUtils.getCurrentUserId();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(videoUploadService.createPlaylist(dto, currentUserId));
    }


    @GetMapping("/playlists/{playlistId}")
    public ResponseEntity<PlaylistResponseDTO> getPlaylist(@PathVariable Long playlistId) {
        return ResponseEntity.ok(videoUploadService.getPlaylist(playlistId));
    }

    @GetMapping("/{videoUuid}/thumbnail.jpg")
    public ResponseEntity<Resource> serveThumbnail(@PathVariable UUID videoUuid) {
        Path path = Paths.get(HLS_DIR, videoUuid.toString(), "thumbnail.jpg");
        if (!Files.exists(path)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg")
                .body(new FileSystemResource(path));
    }
}