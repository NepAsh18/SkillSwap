package spring_swap.v2.dtos.auth;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoleDTO {
    private UUID id;
    private String name;
}