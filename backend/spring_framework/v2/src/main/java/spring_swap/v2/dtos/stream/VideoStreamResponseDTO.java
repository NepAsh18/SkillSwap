package spring_swap.v2.dtos.stream;

import java.util.UUID;


public record VideoStreamResponseDTO(
        UUID videoUuid,
        String title,
        String masterPlaylistUrl,   // e.g. /api/v1/videos/{uuid}/master.m3u8
        boolean is18Plus,
        String processingStatus     // PENDING | PROCESSING | READY | FAILED
) {}