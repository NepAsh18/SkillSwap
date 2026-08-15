package spring_swap.v2.dtos.match;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchRequestDto {
    private String query;      // raw text the user typed
    private int page;          // default 0
    private int size;          // default 10
}