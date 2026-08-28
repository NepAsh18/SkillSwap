package spring_swap.v2.controllers.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.dtos.admin.AdminAnalyticsDTO;
import spring_swap.v2.dtos.admin.AdminUserSummaryDTO;
import spring_swap.v2.dtos.admin.PagedResponse;
import spring_swap.v2.dtos.admin.UpdateUserRoleRequest;
import spring_swap.v2.services.admin.AdminUserService;

import java.util.UUID;


@Slf4j
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;


    @GetMapping
    public ResponseEntity<PagedResponse<AdminUserSummaryDTO>> searchUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) Integer level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(
                adminUserService.searchUsers(search, role, tier, level, page, size, sortBy, sortDir)
        );
    }


    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserSummaryDTO> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminUserService.getUserById(userId));
    }

    /**
     * PUT /api/v1/admin/users/{userId}/role
     * Sets the user's role to exactly the role given by roleId (replace, not additive).
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        adminUserService.updateUserRole(userId, request.getRoleId());
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(adminUserService.getAnalytics());
    }
}