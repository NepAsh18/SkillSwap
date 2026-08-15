package spring_swap.v2.mapper;



import org.mapstruct.*;
import spring_swap.v2.dtos.auth.ProfileUpdateRequest;
import spring_swap.v2.dtos.auth.RegisterRequest;
import spring_swap.v2.dtos.auth.EducationResponse;
import spring_swap.v2.dtos.auth.ProfileResponse;
import spring_swap.v2.dtos.auth.ProjectResponse;
import spring_swap.v2.models.auth.Education;
import spring_swap.v2.models.auth.Project;
import spring_swap.v2.models.auth.Role;
import spring_swap.v2.models.auth.User;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    // Maps registration input directly to initial entity state
    // Password hashing must be handled safely downstream inside the service layer
    @Mapping(target = "password", ignore = true)
    User toEntity(RegisterRequest request);

    // Deep object graph transformation to full response profile
    @Mapping(target = "roles", source = "roles", qualifiedByName = "mapRoles")
    ProfileResponse toProfileResponse(User user);

    ProjectResponse toProjectResponse(Project project);

    EducationResponse toEducationResponse(Education education);

    // In-place resource mutation preventing resource reference drops
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(ProfileUpdateRequest request, @MappingTarget User user);

    // Custom structural converter flattening complex entity state
    @Named("mapRoles")
    default Set<String> mapRoles(Set<Role> roles) {
        if (roles == null) return Set.of();
        return roles.stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
    }
}