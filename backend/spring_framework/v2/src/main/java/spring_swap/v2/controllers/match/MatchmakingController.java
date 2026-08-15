package spring_swap.v2.controllers.match;



import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.domain.UserSearchDocument;
import spring_swap.v2.dtos.match.DiscoverMatchesResponse;
import spring_swap.v2.services.match.MatchmakingService;
import spring_swap.v2.services.match.UserSearchService;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/discover")
public class MatchmakingController {

    private final MatchmakingService matchmakingService;
    private final UserSearchService userSearchService;

    public MatchmakingController(MatchmakingService matchmakingService, UserSearchService userSearchService) {
        this.matchmakingService = matchmakingService;
        this.userSearchService = userSearchService;
    }


    @GetMapping("/matches")
    public DiscoverMatchesResponse getTopMatches(
            @AuthenticationPrincipal UUID currentUserId, // adjust to your actual principal type
            @RequestParam(defaultValue = "20") int limit
    ) {
        return matchmakingService.getTopMatches(currentUserId, limit);
    }

    /** Fuzzy search bar — typo tolerant, searches name/bio/skills. */
    @GetMapping("/search")
    public List<UserSearchDocument> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) throws IOException {
        return userSearchService.fuzzySearch(q, page, size);
    }

    /** Autocomplete dropdown — hit on every keystroke, debounced client-side. */
    @GetMapping("/autocomplete")
    public List<UserSearchDocument> autocomplete(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int size
    ) throws IOException {
        if (q == null || q.isBlank()) return List.of();
        return userSearchService.autocomplete(q, size);
    }
}