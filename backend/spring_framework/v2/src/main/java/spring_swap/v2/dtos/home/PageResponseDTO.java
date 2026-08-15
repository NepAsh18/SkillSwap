package spring_swap.v2.dtos.home;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponseDTO {
    private Long id;
    private String slug;
    private String title;
    private String metaDescription;
    private boolean published;
    private List<PageSectionResponseDTO> sections;
}

