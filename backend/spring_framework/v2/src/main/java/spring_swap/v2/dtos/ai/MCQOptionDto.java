package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// dto/ai/MCQOptionDto.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCQOptionDto {
    private String label;
    private String text;
}