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
import org.springframework.web.multipart.MultipartFile;
import spring_swap.v2.dtos.stream.*;
import spring_swap.v2.security.SecurityUtils;
import spring_swap.v2.services.stream.VideoUploadService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;


@Slf4j
@RestController
@RequestMapping("/api/v1/committee/videos")
@PreAuthorize("hasRole('COMMITTEE_MEMBER')")
@RequiredArgsConstructor
public class CommitteeVideoController {

    @Value("${app.video.hls-dir}")
    private String HLS_DIR;

    private final VideoUploadService videoUploadService;
    private final SecurityUtils      securityUtils;

    // ── Video CRUD ────────────────────────────────────────────────────────────


    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<VideoResponseDTO> uploadVideo(
            @RequestParam("file")        MultipartFile file,
            @RequestParam("title")       String title,
            @RequestParam("description") String description,
            @RequestParam(value = "is18Plus", defaultValue = "false") boolean is18Plus
    ) {
        UUID uploaderId = securityUtils.getCurrentUserId();
        VideoUploadRequestDTO dto = new VideoUploadRequestDTO(title, description, is18Plus);

        VideoResponseDTO response = videoUploadService.upload(file, dto, uploaderId);
        log.info("Upload complete [title={}, uploader={}]", title, uploaderId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @DeleteMapping("/{videoUuid}")
    public ResponseEntity<Void> deleteVideo(@PathVariable UUID videoUuid) {
        videoUploadService.delete(videoUuid, securityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }


    @GetMapping
    public ResponseEntity<List<VideoResponseDTO>> listAllVideos() {
        return ResponseEntity.ok(videoUploadService.getAllVideos());
    }


    @GetMapping("/{videoUuid}/info")
    public ResponseEntity<VideoStreamResponseDTO> getStreamInfo(@PathVariable UUID videoUuid) {
        return ResponseEntity.ok(videoUploadService.getStreamInfo(videoUuid));
    }

    // ── HLS Streaming ─────────────────────────────────────────────────────────


    @GetMapping("/{videoUuid}/master.m3u8")
    public ResponseEntity<Resource> serveMasterPlaylist(@PathVariable UUID videoUuid) {
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
        Path path = Paths.get(HLS_DIR, videoUuid.toString(),
                "v" + variantIndex, segment + ".ts");
        if (!Files.exists(path)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "video/mp2t")
                .body(new FileSystemResource(path));
    }

    // ── Playlist Management ───────────────────────────────────────────────────


    @PostMapping("/playlists")
    public ResponseEntity<PlaylistResponseDTO> createPlaylist(
            @RequestBody CreatePlaylistRequestDTO dto
    ) {
        UUID currentUserId = securityUtils.getCurrentUserId();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(videoUploadService.createPlaylist(dto, currentUserId));
    }

    @PutMapping("/playlists/{playlistId}/videos/{videoUuid}")
    public ResponseEntity<PlaylistResponseDTO> addToPlaylist(
            @PathVariable Long playlistId,
            @PathVariable UUID videoUuid,
            @RequestParam(required = false) Integer position
    ) {
        return ResponseEntity.ok(
                videoUploadService.addVideoToPlaylist(playlistId, videoUuid, position));
    }


    @DeleteMapping("/playlists/{playlistId}/videos/{videoUuid}")
    public ResponseEntity<Void> removeFromPlaylist(
            @PathVariable Long playlistId,
            @PathVariable UUID videoUuid
    ) {
        videoUploadService.removeVideoFromPlaylist(playlistId, videoUuid);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/playlists/{playlistId}")
    public ResponseEntity<PlaylistResponseDTO> getPlaylist(@PathVariable Long playlistId) {
        return ResponseEntity.ok(videoUploadService.getPlaylist(playlistId));
    }

    
    @GetMapping("/playlists/user/{userId}")
    public ResponseEntity<List<PlaylistResponseDTO>> getUserPlaylists(@PathVariable UUID userId) {
        return ResponseEntity.ok(videoUploadService.getUserPlaylists(userId));
    }
}