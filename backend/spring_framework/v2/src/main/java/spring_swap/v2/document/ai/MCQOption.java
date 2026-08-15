package spring_swap.v2.document.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// document/MCQOption.java  (embedded)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCQOption {
    private String label;   // A B C D
    private String text;
}