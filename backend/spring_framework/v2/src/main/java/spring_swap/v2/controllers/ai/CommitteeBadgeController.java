package spring_swap.v2.controllers.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.dtos.ai.BadgeRankingDTO;
import spring_swap.v2.services.ai.BadgeService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/committee/badges")
@RequiredArgsConstructor
public class CommitteeBadgeController {

    private final BadgeService badgeService;

    @GetMapping("/top")
    @PreAuthorize("hasRole('COMMITTEE_MEMBER')")
    public ResponseEntity<List<BadgeRankingDTO>> getTopBadges(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String skill
    ) {
        if (limit <= 0) {
            limit = 20;
        }
        return ResponseEntity.ok(badgeService.getTopBadges(limit, skill));
    }
}