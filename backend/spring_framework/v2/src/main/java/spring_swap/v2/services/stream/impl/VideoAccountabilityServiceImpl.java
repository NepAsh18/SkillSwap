package spring_swap.v2.services.stream.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import spring_swap.v2.dtos.stream.VideoAccountabilityDTO;
import spring_swap.v2.models.stream.Video;
import spring_swap.v2.repo.stream.VideoRepository;
import spring_swap.v2.services.stream.VideoAccountabilityService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoAccountabilityServiceImpl implements VideoAccountabilityService {

    private final VideoRepository videoRepository;

    @Override
    public List<VideoAccountabilityDTO> getAllAccountabilityRecords() {
        log.info("[ADMIN] getAllAccountabilityRecords");
        return videoRepository.findAllByOrderByUploadedAtDesc()
                .stream()
                .map(this::toAccountabilityDTO)
                .collect(Collectors.toList());
    }

    @Override
    public VideoAccountabilityDTO getAccountabilityByVideoUuid(UUID videoUuid) {
        log.info("[ADMIN] getAccountabilityByVideoUuid uuid={}", videoUuid);
        Video video = videoRepository.findByVideoUuid(videoUuid)
                .orElseThrow(() -> new RuntimeException("Video not found: " + videoUuid));
        return toAccountabilityDTO(video);
    }

    @Override
    public List<VideoAccountabilityDTO> getAccountabilityByUploader(UUID userId) {
        log.info("[ADMIN] getAccountabilityByUploader userId={}", userId);
        return videoRepository.findByUploadedByIdOrderByUploadedAtDesc(userId)
                .stream()
                .map(this::toAccountabilityDTO)
                .collect(Collectors.toList());
    }

    @Override
    public long getTotalStorageUsedBytes() {
        return videoRepository.sumAllFileSizeBytes();
    }

    @Override
    public long getTotalStorageByUploader(UUID userId) {
        return videoRepository.sumFileSizeBytesByUploader(userId);
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private VideoAccountabilityDTO toAccountabilityDTO(Video v) {
        return new VideoAccountabilityDTO(
                v.getId(),
                v.getVideoUuid(),
                v.getTitle(),
                v.getUploadedBy().getId(),
                v.getUploadedBy().getUsername(),
                v.getUploadedBy().getEmail(),
                v.getFileSizeBytes(),
                formatBytes(v.getFileSizeBytes()),
                v.getDurationSecs(),
                v.is18Plus(),
                v.getProcessingStatus().name(),
                v.getUploadedAt()
        );
    }

    private String formatBytes(Long bytes) {
        if (bytes == null) return "Unknown";
        if (bytes < 1_024L)              return bytes + " B";
        if (bytes < 1_048_576L)          return String.format("%.2f KB", bytes / 1_024.0);
        if (bytes < 1_073_741_824L)      return String.format("%.2f MB", bytes / 1_048_576.0);
        return                                  String.format("%.2f GB", bytes / 1_073_741_824.0);
    }
}