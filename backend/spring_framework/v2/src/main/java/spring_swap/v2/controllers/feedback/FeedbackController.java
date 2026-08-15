package spring_swap.v2.controllers.feedback;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.document.feedback.FeedbackDocument;
import spring_swap.v2.dtos.feedback.FeedbackRequest;
import spring_swap.v2.dtos.feedback.FeedbackResponse;
import spring_swap.v2.services.feedback.FeedbackService;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;


    @PostMapping
    public ResponseEntity<FeedbackResponse> submitFeedback(
            @RequestBody @Valid FeedbackRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID fromUserId = extractUserId(userDetails);
        FeedbackResponse response = feedbackService.submitFeedback(fromUserId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET — fetch all feedback received by a user for a skill
    @GetMapping("/{targetUserId}/{skill}")
    public ResponseEntity<List<FeedbackDocument>> getFeedback(
            @PathVariable UUID targetUserId,
            @PathVariable String skill) {

        return ResponseEntity.ok(
                feedbackService.getFeedbackForUserSkill(targetUserId, skill)
        );
    }

    private UUID extractUserId(UserDetails userDetails) {

        return UUID.fromString(userDetails.getUsername());
    }
}
