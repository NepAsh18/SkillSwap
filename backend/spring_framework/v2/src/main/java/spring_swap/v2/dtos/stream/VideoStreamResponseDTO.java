package spring_swap.v2.dtos.stream;

import java.util.List;
import java.util.UUID;

public record VideoStreamResponseDTO(
        UUID videoUuid,
        String title,
        String masterPlaylistUrl,
        String thumbnailUrl,
        List<VideoQualityDTO> qualities,
        boolean is18Plus,
        String processingStatus
) {}