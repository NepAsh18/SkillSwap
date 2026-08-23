package spring_swap.v2.dtos.home;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageSummaryDTO {
    private Long id;
    private String slug;
    private String title;
}
