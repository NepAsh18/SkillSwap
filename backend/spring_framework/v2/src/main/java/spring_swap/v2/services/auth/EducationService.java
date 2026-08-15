package spring_swap.v2.services.auth;



import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import spring_swap.v2.dtos.auth.EducationRequest;
import spring_swap.v2.dtos.auth.EducationResponse;
import spring_swap.v2.models.auth.Education;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repo.auth.EducationRepository;
import spring_swap.v2.repo.auth.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EducationService {

    private final EducationRepository educationRepository;
    private final UserRepository userRepository;

    public List<EducationResponse> getEducationForUser(UUID userId) {
        return educationRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EducationResponse addEducation(UUID userId, EducationRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found."));

        Education edu = Education.builder()
                .institution(req.getInstitution())
                .degree(req.getDegree())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .score(req.getScore())
                .description(req.getDescription())
                .user(user)
                .build();

        educationRepository.save(edu);
        return toResponse(edu);
    }

    public EducationResponse updateEducation(UUID userId, UUID educationId, EducationRequest req) {
        Education edu = educationRepository.findById(educationId)
                .orElseThrow(() -> new EntityNotFoundException("Education entry not found."));

        if (!edu.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("This entry doesn't belong to you.");
        }

        edu.setInstitution(req.getInstitution());
        edu.setDegree(req.getDegree());
        edu.setStartDate(req.getStartDate());
        edu.setEndDate(req.getEndDate());
        edu.setScore(req.getScore());
        edu.setDescription(req.getDescription());

        educationRepository.save(edu);
        return toResponse(edu);
    }

    public void deleteEducation(UUID userId, UUID educationId) {
        Education edu = educationRepository.findById(educationId)
                .orElseThrow(() -> new EntityNotFoundException("Education entry not found."));

        if (!edu.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("This entry doesn't belong to you.");
        }
        educationRepository.delete(edu);
    }

    EducationResponse toResponse(Education edu) {
        return EducationResponse.builder()
                .id(edu.getId())
                .institution(edu.getInstitution())
                .degree(edu.getDegree())
                .startDate(edu.getStartDate())
                .endDate(edu.getEndDate())
                .score(edu.getScore())
                .description(edu.getDescription())
                .build();
    }
}