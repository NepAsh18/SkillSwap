package spring_swap.v2.dtos.stream;



public record VideoResponseDTO(
        Long id,
        String title,
        String description,
        String videoUrl,
        String thumbnailUrl,
        Integer durationSecs,
        boolean is18Plus
) {}