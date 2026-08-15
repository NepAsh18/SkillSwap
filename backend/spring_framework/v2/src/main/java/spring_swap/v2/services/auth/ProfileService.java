package spring_swap.v2.services.auth;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import spring_swap.v2.dtos.auth.ProfileUpdateRequest;
import spring_swap.v2.dtos.auth.ProfileResponse;
import spring_swap.v2.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import spring_swap.v2.mapper.UserMapper;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.services.match.SkillAdjacencyService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final SkillAdjacencyService skillAdjacencyService;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile requested does not exist."));
        return userMapper.toProfileResponse(user);
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile targeted for update does not exist."));

        Set<String> oldSkills = splitSkills(user.getSkillsProficient());

        userMapper.updateEntityFromRequest(request, user);
        User saved = userRepository.save(user);

        Set<String> newSkills = splitSkills(saved.getSkillsProficient());
        skillAdjacencyService.onProfileSkillsChanged(userId, oldSkills, newSkills);

        return userMapper.toProfileResponse(saved);
    }

    private Set<String> splitSkills(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    @Value("${app.upload.dir}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Cannot initialise video storage directories", e);
        }
    }

    public String uploadProfilePicture(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds 5MB limit.");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Unsupported file type.");
        }

        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);

            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = userId + "_" + UUID.randomUUID() + "." + (extension != null ? extension : "jpg");

            Path target = dir.resolve(filename).normalize();
            if (!target.startsWith(dir)) {
                throw new IllegalArgumentException("Invalid file path."); // path traversal guard
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String url = "/uploads/profile-pictures/" + filename;

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found."));
            user.setPicture(url);
            userRepository.save(user);

            return url;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }
}