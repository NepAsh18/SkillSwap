package spring_swap.v2.mapper;

import org.mapstruct.*;
import spring_swap.v2.dtos.home.*;
import spring_swap.v2.models.home.*;

import java.util.Map;
import java.util.HashMap;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PageMapper {

    // ===== Page Mappings =====
    PageResponseDTO toResponseDto(Page page);
    Page toEntity(PageRequestDTO dto);
    void updatePageFromDto(PageRequestDTO dto, @MappingTarget Page page);

    // ===== Section Mappings =====

    @Mapping(target = "content", ignore = true)
    @Mapping(target = "sectionKey", ignore = true)   // we set it manually
    PageSectionResponseDTO toSectionResponseDto(PageSection section);

    @Mapping(target = "content", ignore = true)
    @Mapping(target = "sectionKey", ignore = true)   // we set it manually
    PageSection toSectionEntity(PageSectionRequestDTO dto);

    @Mapping(target = "content", ignore = true)
    @Mapping(target = "sectionKey", ignore = true)
    void updateSectionFromDto(PageSectionRequestDTO dto, @MappingTarget PageSection section);

    // ===== After-Mappings =====

    // Entity → Response DTO: extract the "body" from the JSONB map
    @AfterMapping
    default void setContentFromMap(PageSection section, @MappingTarget PageSectionResponseDTO dto) {
        if (section.getContent() != null && section.getContent().containsKey("body")) {
            dto.setContent(section.getContent().get("body").toString());
        } else {
            dto.setContent("");
        }
    }

    // Request DTO → Entity: wrap string content into map, and set sectionKey from title
    @AfterMapping
    default void setEntityFromDto(PageSectionRequestDTO dto, @MappingTarget PageSection section) {
        // content
        if (dto.getContent() != null) {
            section.setContent(Map.of("body", dto.getContent()));
        } else {
            section.setContent(new HashMap<>());
        }
        // sectionKey ← title (you can rename this field later if you wish)
        section.setSectionKey(dto.getTitle());
    }

    // For updates we reuse the same logic
    @AfterMapping
    default void updateEntityFromDto(PageSectionRequestDTO dto, @MappingTarget PageSection section) {
        if (dto.getContent() != null) {
            section.setContent(Map.of("body", dto.getContent()));
        }
        if (dto.getTitle() != null) {
            section.setSectionKey(dto.getTitle());
        }
    }
}