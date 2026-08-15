package spring_swap.v2.repo.auth;

import org.jspecify.annotations.NullMarked;
import spring_swap.v2.models.auth.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@NullMarked
public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByName(String name);

}
