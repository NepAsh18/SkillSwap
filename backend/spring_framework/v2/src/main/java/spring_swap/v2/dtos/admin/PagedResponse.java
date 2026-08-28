package spring_swap.v2.dtos.admin;

import lombok.*;

import java.util.List;

/** Generic pagination wrapper so the response shape is decoupled from Spring's Page<T>. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
}