package spring_swap.v2.repo.auth.spec;

import org.springframework.data.jpa.domain.Specification;
import spring_swap.v2.models.auth.User;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserSpecifications {

    private UserSpecifications() {}

    public static Specification<User> nameOrEmailContains(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }
            String like = "%" + search.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("username")), like),
                    cb.like(cb.lower(root.get("email")), like)
            );
        };
    }

    public static Specification<User> hasRole(String roleName) {
        return (root, query, cb) -> {
            if (roleName == null || roleName.isBlank()) {
                return cb.conjunction();
            }
            query.distinct(true);
            var join = root.join("roles");
            return cb.equal(join.get("name"), roleName);
        };
    }

    /**
     * Restricts to users whose id is in the given set — used when a tier/level
     * filter (Mongo-side) has already been resolved to a list of matching userIds.
     * Pass null to skip this filter entirely (no tier/level filter active).
     */
    public static Specification<User> idIn(List<UUID> userIds) {
        return (root, query, cb) -> {
            if (userIds == null) {
                return cb.conjunction();
            }
            if (userIds.isEmpty()) {
                // Filter was active but matched nobody — force zero results, not "match all"
                return cb.disjunction();
            }
            return root.get("id").in(userIds);
        };
    }

    public static Specification<User> build(String search, String roleName, List<UUID> badgeFilteredUserIds) {
        List<Specification<User>> specs = new ArrayList<>();
        specs.add(nameOrEmailContains(search));
        specs.add(hasRole(roleName));
        specs.add(idIn(badgeFilteredUserIds));

        Specification<User> combined = Specification.where(null);
        for (Specification<User> s : specs) {
            combined = combined.and(s);
        }
        return combined;
    }
}