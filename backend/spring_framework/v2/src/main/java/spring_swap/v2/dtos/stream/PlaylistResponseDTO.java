package spring_swap.v2.dtos.stream;

import java.util.List;
import java.util.UUID;

public record PlaylistResponseDTO(
        Long id,
         UUID userId,
        String name,
        Boolean isPrivate,
        List<PlaylistVideoResponseDTO> videos
) {}