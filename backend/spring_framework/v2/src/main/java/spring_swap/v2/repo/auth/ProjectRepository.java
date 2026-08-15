package spring_swap.v2.repo.auth;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import spring_swap.v2.models.auth.Project;
import spring_swap.v2.models.auth.User;

import java.util.List;
import java.util.UUID;

@NullMarked
@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByUserId(UUID userId);

}