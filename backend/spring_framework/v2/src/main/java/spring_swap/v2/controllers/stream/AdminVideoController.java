package spring_swap.v2.controllers.stream;



import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.dtos.stream.VideoAccountabilityDTO;
import spring_swap.v2.services.stream.VideoAccountabilityService;
import spring_swap.v2.services.stream.VideoAgeGateService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller 2 — ROLE_ADMIN only.

 * Base: /api/v1/admin/videos

 * Covers:
 *  - Full accountability audit: who uploaded what, when, and how much storage
 *  - Platform-wide and per-uploader storage summaries
 *  - Age verification inspection and revocation
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/videos")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminVideoController {

    private final VideoAccountabilityService accountabilityService;
    private final VideoAgeGateService        ageGateService;

    // ── Accountability ────────────────────────────────────────────────────────

    /** GET /api/v1/admin/videos/accountability — all upload records, newest first. */
    @GetMapping("/accountability")
    public ResponseEntity<List<VideoAccountabilityDTO>> getAllAccountability() {
        return ResponseEntity.ok(accountabilityService.getAllAccountabilityRecords());
    }

    /** GET /api/v1/admin/videos/accountability/{videoUuid} */
    @GetMapping("/accountability/{videoUuid}")
    public ResponseEntity<VideoAccountabilityDTO> getVideoAccountability(
            @PathVariable UUID videoUuid
    ) {
        return ResponseEntity.ok(accountabilityService.getAccountabilityByVideoUuid(videoUuid));
    }

    /** GET /api/v1/admin/videos/accountability/uploader/{userId} — all uploads by a user. */
    @GetMapping("/accountability/uploader/{userId}")
    public ResponseEntity<List<VideoAccountabilityDTO>> getAccountabilityByUploader(
            @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(accountabilityService.getAccountabilityByUploader(userId));
    }

    // ── Storage summaries ─────────────────────────────────────────────────────

    /** GET /api/v1/admin/videos/storage — platform-wide raw storage total. */
    @GetMapping("/storage")
    public ResponseEntity<Map<String, Object>> getStorageSummary() {
        long bytes = accountabilityService.getTotalStorageUsedBytes();
        return ResponseEntity.ok(Map.of(
                "totalBytes",     bytes,
                "totalFormatted", formatBytes(bytes)
        ));
    }

    /** GET /api/v1/admin/videos/storage/uploader/{userId} — per-uploader storage. */
    @GetMapping("/storage/uploader/{userId}")
    public ResponseEntity<Map<String, Object>> getStorageByUploader(@PathVariable UUID userId) {
        long bytes = accountabilityService.getTotalStorageByUploader(userId);
        return ResponseEntity.ok(Map.of(
                "userId",         userId,
                "totalBytes",     bytes,
                "totalFormatted", formatBytes(bytes)
        ));
    }

    // ── Age verification management ───────────────────────────────────────────

    /**
     * GET /api/v1/admin/videos/age-verification/{userId}
     * Inspect current verification status of a user.
     */
    @GetMapping("/age-verification/{userId}")
    public ResponseEntity<Map<String, Object>> getAgeVerificationStatus(
            @PathVariable UUID userId
    ) {
        boolean verified = ageGateService.isUserVerified(userId);
        return ResponseEntity.ok(Map.of(
                "userId",     userId,
                "isVerified", verified
        ));
    }

    /**
     * DELETE /api/v1/admin/videos/age-verification/{userId}
     * Revoke a user's age verification. They must re-submit a ZK proof to regain access.
     */
    @DeleteMapping("/age-verification/{userId}")
    public ResponseEntity<Void> revokeAgeVerification(@PathVariable UUID userId) {
        ageGateService.revokeVerification(userId);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String formatBytes(long bytes) {
        if (bytes < 1_024L)              return bytes + " B";
        if (bytes < 1_048_576L)          return String.format("%.2f KB", bytes / 1_024.0);
        if (bytes < 1_073_741_824L)      return String.format("%.2f MB", bytes / 1_048_576.0);
        return                                  String.format("%.2f GB", bytes / 1_073_741_824.0);
    }
}