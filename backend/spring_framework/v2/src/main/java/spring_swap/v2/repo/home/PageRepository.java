package spring_swap.v2.repo.home;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import spring_swap.v2.models.home.Page;

import java.util.Optional;
@NullMarked
@Repository
public interface PageRepository extends JpaRepository<Page, Long> {

    /**
     * Fetches a Page by its slug and eagerly loads all associated sections
     * in a single query, preserving the @OrderBy("sortOrder ASC") directive.
     */
    @Query("SELECT p FROM Page p LEFT JOIN FETCH p.sections WHERE p.slug = :slug")
    Optional<Page> findBySlugWithSections(@Param("slug") String slug);

    // Standard lookup if you don't need the sections immediately
    boolean existsBySlug(String slug);
}