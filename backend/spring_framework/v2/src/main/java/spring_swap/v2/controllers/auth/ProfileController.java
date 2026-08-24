package spring_swap.v2.controllers.auth;





import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import spring_swap.v2.config.SecurityConfig;
import spring_swap.v2.dtos.auth.*;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.services.auth.EducationService;
import spring_swap.v2.services.auth.ProfileService;
import spring_swap.v2.services.auth.ProjectService;


import java.nio.file.attribute.UserPrincipal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final EducationService educationService;
    private final ProjectService projectService;


    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile(@AuthenticationPrincipal UUID authenticatedUserId) {
        return ResponseEntity.ok(profileService.getProfile(authenticatedUserId));
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UUID authenticatedUserId,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(authenticatedUserId, request));
    }

    @PostMapping("/picture")
    public ResponseEntity<PictureUploadResponse> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        UUID userId = ((UUID) authentication.getPrincipal()); // adapt to however you pull the current user elsewhere in this controller
        String url = profileService.uploadProfilePicture(userId, file);
        return ResponseEntity.ok(new PictureUploadResponse(url));
    }

    @PostMapping("/education")
    public ResponseEntity<EducationResponse> addEducation(
            @Valid @RequestBody EducationRequest request, Authentication authentication) {
        return ResponseEntity.ok(educationService.addEducation(currentUserId(authentication), request));
    }

    @PutMapping("education/{educationId}")
    public ResponseEntity<EducationResponse> updateEducation(
            @PathVariable UUID educationId,
            @Valid @RequestBody EducationRequest request, Authentication authentication) {
        return ResponseEntity.ok(educationService.updateEducation(currentUserId(authentication), educationId, request));
    }

    @DeleteMapping("/education/{educationId}")
    public ResponseEntity<Void> deleteEducation(@PathVariable UUID educationId, Authentication authentication) {
        educationService.deleteEducation(currentUserId(authentication), educationId);
        return ResponseEntity.noContent().build();
    }

    // ---- Projects ----
    @PostMapping("/projects")
    public ResponseEntity<ProjectResponse> addProject(
            @Valid @RequestBody ProjectRequest request, Authentication authentication) {
        return ResponseEntity.ok(projectService.addProject(currentUserId(authentication), request));
    }

    @PutMapping("/projects/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectRequest request, Authentication authentication) {
        return ResponseEntity.ok(projectService.updateProject(currentUserId(authentication), projectId, request));
    }

    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID projectId, Authentication authentication) {
        projectService.deleteProject(currentUserId(authentication), projectId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PublicProfileResponse> getPublicProfile(@PathVariable UUID userId) {
        return ResponseEntity.ok(profileService.getPublicProfile(userId));
    }

    private UUID currentUserId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }


}