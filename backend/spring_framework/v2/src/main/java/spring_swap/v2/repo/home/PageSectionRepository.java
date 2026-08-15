package spring_swap.v2.repo.home;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import spring_swap.v2.models.home.PageSection;

import java.util.List;
@NullMarked
@Repository
public interface PageSectionRepository extends JpaRepository<PageSection, Long> {

    // Find all sections belonging to a specific page ID (ordered manually if needed)
    List<PageSection> findByPageIdOrderBySortOrderAsc(Long pageId);

    // Find sections by their type across the whole system (e.g., all "hero_banner" instances)
    List<PageSection> findBySectionKey(String sectionKey);

    /**
     * Fast admin toggle to instantly hide/show a section without loading the entity into memory
     */
    @Transactional
    @Modifying
    @Query("UPDATE PageSection ps SET ps.visible = :visible WHERE ps.id = :id")
    int updateVisibility(@Param("id") Long id, @Param("visible") boolean visible);
}