package spring_swap.v2.services.stream;

import spring_swap.v2.dtos.stream.VideoAccountabilityDTO;
import java.util.List;
import java.util.UUID;

public interface VideoAccountabilityService {
    List<VideoAccountabilityDTO> getAllAccountabilityRecords();
    VideoAccountabilityDTO getAccountabilityByVideoUuid(UUID videoUuid);
    List<VideoAccountabilityDTO> getAccountabilityByUploader(UUID userId);
    long getTotalStorageUsedBytes();
    long getTotalStorageByUploader(UUID userId);
}