package spring_swap.v2.controllers.ai;


import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.document.ai.UserBadge;
import spring_swap.v2.dtos.ai.BadgeDto;
import spring_swap.v2.dtos.ai.FeedbackRequest;
import spring_swap.v2.repository.ai.UserBadgeRepository;
import spring_swap.v2.services.ai.BadgeService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/badge")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;
    private final UserBadgeRepository badgeRepo;


    @GetMapping("/{userId}")
    public ResponseEntity<List<UserBadge>> getUserBadges(@PathVariable UUID userId) {
        return ResponseEntity.ok(badgeRepo.findByUserId(userId));
    }

    // GET — fetch badge for specific skill
    @GetMapping("/{userId}/{skill}")
    public ResponseEntity<UserBadge> getBadge(
            @PathVariable UUID userId,
            @PathVariable String skill) {

        return badgeRepo.findByUserIdAndSkill(userId, skill)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }



}
