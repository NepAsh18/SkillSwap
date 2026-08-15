package spring_swap.v2.dtos.stream;

import java.time.Instant;
import java.util.UUID;


public record VideoAccountabilityDTO(
        Long id,
        UUID videoUuid,
        String title,
        UUID uploadedByUserId,
        String uploadedByUsername,
        String uploadedByEmail,
        Long fileSizeBytes,
        String fileSizeFormatted,    // e.g. "1.34 GB"
        Integer durationSecs,
        boolean is18Plus,
        String processingStatus,
        Instant uploadedAt
) {}