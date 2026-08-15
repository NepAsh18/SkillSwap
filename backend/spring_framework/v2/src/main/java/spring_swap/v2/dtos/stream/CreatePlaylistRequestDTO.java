package spring_swap.v2.dtos.stream;


import java.util.UUID;

public record CreatePlaylistRequestDTO(

        String name,
        Boolean isPrivate
) {}
