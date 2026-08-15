package spring_swap.v2.dtos.stream;

public record PlaylistVideoResponseDTO(
        Integer position,
        VideoResponseDTO video
) {}