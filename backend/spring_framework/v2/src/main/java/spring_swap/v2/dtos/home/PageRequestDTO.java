package spring_swap.v2.dtos.home;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageRequestDTO {
    private String slug;
    private String title;
    private String metaDescription;
    private boolean published;
}
