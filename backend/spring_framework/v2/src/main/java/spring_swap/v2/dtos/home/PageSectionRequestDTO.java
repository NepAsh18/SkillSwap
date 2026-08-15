package spring_swap.v2.dtos.home;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageSectionRequestDTO {
    private String title;
    private String sectionKey;
    private int sortOrder;
    private boolean visible;
    private String content;
}
