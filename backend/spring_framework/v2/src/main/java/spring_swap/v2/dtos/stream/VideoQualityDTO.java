package spring_swap.v2.dtos.stream;

public record VideoQualityDTO(
        int height,
        String label,
        String playlistUrl
) {}