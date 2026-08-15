package spring_swap.v2.services.auth;



import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import spring_swap.v2.dtos.auth.ProjectRequest;
import spring_swap.v2.dtos.auth.ProjectResponse;
import spring_swap.v2.models.auth.Project;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repo.auth.ProjectRepository;
import spring_swap.v2.repo.auth.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public List<ProjectResponse> getProjectsForUser(UUID userId) {
        return projectRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse addProject(UUID userId, ProjectRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found."));

        Project proj = Project.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .projectLink(req.getProjectLink())
                .techStack(req.getTechStack())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .user(user)
                .build();

        projectRepository.save(proj);
        return toResponse(proj);
    }

    public ProjectResponse updateProject(UUID userId, UUID projectId, ProjectRequest req) {
        Project proj = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found."));

        if (!proj.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("This entry doesn't belong to you.");
        }

        proj.setTitle(req.getTitle());
        proj.setDescription(req.getDescription());
        proj.setProjectLink(req.getProjectLink());
        proj.setTechStack(req.getTechStack());
        proj.setStartDate(req.getStartDate());
        proj.setEndDate(req.getEndDate());

        projectRepository.save(proj);
        return toResponse(proj);
    }

    public void deleteProject(UUID userId, UUID projectId) {
        Project proj = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found."));

        if (!proj.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("This entry doesn't belong to you.");
        }
        projectRepository.delete(proj);
    }

    ProjectResponse toResponse(Project proj) {
        return ProjectResponse.builder()
                .id(proj.getId())
                .title(proj.getTitle())
                .description(proj.getDescription())
                .projectLink(proj.getProjectLink())
                .techStack(proj.getTechStack())
                .startDate(proj.getStartDate())
                .endDate(proj.getEndDate())
                .build();
    }
}
