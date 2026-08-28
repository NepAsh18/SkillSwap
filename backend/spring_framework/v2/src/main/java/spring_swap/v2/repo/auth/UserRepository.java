package spring_swap.v2.repo.auth;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import spring_swap.v2.models.auth.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    Optional<User> findByEmailOrUsername(String email, String username);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = 'ROLE_COMMITTEE'")
    List<User> findAllCommitteeMembers();

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.educationList")
    List<User> findAllWithEducation();

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.projectList")
    List<User> findAllWithProjects();
}