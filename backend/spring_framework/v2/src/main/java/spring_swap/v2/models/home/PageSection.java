package spring_swap.v2.models.home;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "page_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "page_id")
    private Page page;

    @Column(nullable = false)
    private String sectionKey;   // e.g., "hero_banner", "features_grid"

    private int sortOrder;

    @Builder.Default
    private boolean visible = true;

    @Type(JsonType.class)        // Requires hypersistence-utils integration
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> content = new HashMap<>();
}