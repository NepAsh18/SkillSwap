package spring_swap.v2.services.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import spring_swap.v2.document.ai.UserBadge;
import spring_swap.v2.dtos.admin.AdminAnalyticsDTO;
import spring_swap.v2.dtos.admin.AdminUserSummaryDTO;
import spring_swap.v2.dtos.admin.PagedResponse;
import spring_swap.v2.models.auth.Role;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repo.auth.RoleRepository;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.repo.auth.spec.UserSpecifications;
import spring_swap.v2.repository.ai.UserBadgeRepository;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserBadgeRepository userBadgeRepository;

    private static final int MAX_PAGE_SIZE = 100;

    @Transactional(readOnly = true)
    public PagedResponse<AdminUserSummaryDTO> searchUsers(
            String search,
            String roleName,
            String tier,
            Integer level,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        String sortField = switch (sortBy == null ? "" : sortBy) {
            case "name" -> "name";
            case "email" -> "email";
            case "createdAt" -> "createdAt";
            default -> "createdAt";
        };

        PageRequest pageRequest = PageRequest.of(safePage, safeSize, Sort.by(direction, sortField));

        List<UUID> badgeFilteredUserIds = resolveBadgeFilterUserIds(tier, level);

        var spec = UserSpecifications.build(search, roleName, badgeFilteredUserIds);
        Page<User> userPage = userRepository.findAll(spec, pageRequest);

        List<UUID> pageUserIds = userPage.getContent().stream()
                .map(User::getId)
                .toList();

        Map<UUID, List<UserBadge>> badgesByUser = pageUserIds.isEmpty()
                ? Map.of()
                : userBadgeRepository.findByUserIdIn(pageUserIds).stream()
                .collect(Collectors.groupingBy(UserBadge::getUserId));

        List<AdminUserSummaryDTO> content = userPage.getContent().stream()
                .map(u -> toSummaryDto(u, badgesByUser.getOrDefault(u.getId(), List.of())))
                .toList();

        return PagedResponse.<AdminUserSummaryDTO>builder()
                .content(content)
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    /**
     * GET /{userId} support — fetch one user + their badges by id.
     */
    @Transactional(readOnly = true)
    public AdminUserSummaryDTO getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));

        List<UserBadge> badges = userBadgeRepository.findByUserId(userId);
        return toSummaryDto(user, badges);
    }

    private List<UUID> resolveBadgeFilterUserIds(String tier, Integer level) {
        boolean hasTier = tier != null && !tier.isBlank();
        boolean hasLevel = level != null;

        if (!hasTier && !hasLevel) {
            return null;
        }

        List<UserBadge> matches;
        if (hasTier && hasLevel) {
            matches = userBadgeRepository.findByTierAndCurrentLevel(tier.toUpperCase(), level);
        } else if (hasTier) {
            matches = userBadgeRepository.findByTier(tier.toUpperCase());
        } else {
            matches = userBadgeRepository.findByCurrentLevel(level);
        }

        return matches.stream()
                .map(UserBadge::getUserId)
                .distinct()
                .toList();
    }

    @Transactional
    public void updateUserRole(UUID userId, UUID roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found: " + roleId));

        Set<Role> newRoles = new HashSet<>();
        newRoles.add(role);
        user.setRoles(newRoles);

        userRepository.save(user);
        log.info("Admin updated roles for user {} -> {}", userId, role.getName());
    }

    private AdminUserSummaryDTO toSummaryDto(User u, List<UserBadge> badges) {
        List<AdminUserSummaryDTO.BadgeSummaryDTO> badgeDtos = badges.stream()
                .map(b -> AdminUserSummaryDTO.BadgeSummaryDTO.builder()
                        .skill(b.getSkill())
                        .tier(b.getTier())
                        .currentLevel(b.getCurrentLevel())
                        .build())
                .toList();

        return AdminUserSummaryDTO.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .username(u.getUsername())
                .roles(u.getRoles().stream().map(Role::getName).toList())
                .skillsProficient(u.getSkillsProficient())
                .skillsToLearn(u.getSkillsToLearn())
                .badges(badgeDtos)
                .createdAt(u.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsDTO getAnalytics() {

        List<User> users = userRepository.findAll();
        List<UserBadge> badges = userBadgeRepository.findAll();



        long totalUsers = users.size();

        long totalBadges = badges.size();



        Map<String, Long> proficientSkillCounts = users.stream()
                .map(User::getSkillsProficient)
                .filter(Objects::nonNull)
                .flatMap(skills -> Arrays.stream(skills.split(",")))
                .map(String::trim)
                .filter(skill -> !skill.isBlank())
                .collect(Collectors.groupingBy(
                        skill -> skill,
                        Collectors.counting()
                ));

        long totalProficientSkills = proficientSkillCounts.size();



        List<AdminAnalyticsDTO.ChartDataDTO> topProficientSkills =
                proficientSkillCounts.entrySet()
                        .stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .limit(10)
                        .map(entry -> AdminAnalyticsDTO.ChartDataDTO.builder()
                                .name(entry.getKey())
                                .count(entry.getValue())
                                .build())
                        .toList();




        Map<String, Long> skillsToLearnCounts = users.stream()
                .map(User::getSkillsToLearn)
                .filter(Objects::nonNull)
                .flatMap(skills -> Arrays.stream(skills.split(",")))
                .map(String::trim)
                .filter(skill -> !skill.isBlank())
                .collect(Collectors.groupingBy(
                        skill -> skill,
                        Collectors.counting()
                ));

        List<AdminAnalyticsDTO.ChartDataDTO> topSkillsToLearn =
                skillsToLearnCounts.entrySet()
                        .stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .limit(10)
                        .map(entry -> AdminAnalyticsDTO.ChartDataDTO.builder()
                                .name(entry.getKey())
                                .count(entry.getValue())
                                .build())
                        .toList();


        Map<String, Long> roleCounts = users.stream()
                .filter(user -> user.getRoles() != null)
                .flatMap(user -> user.getRoles().stream())
                .filter(Objects::nonNull)
                .map(Role::getName)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(
                        role -> role,
                        Collectors.counting()
                ));

        List<AdminAnalyticsDTO.ChartDataDTO> roleDistribution =
                roleCounts.entrySet()
                        .stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .map(entry -> AdminAnalyticsDTO.ChartDataDTO.builder()
                                .name(entry.getKey())
                                .count(entry.getValue())
                                .build())
                        .toList();


        Map<String, Long> badgeTierCounts = badges.stream()
                .map(UserBadge::getTier)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(tier -> !tier.isBlank())
                .collect(Collectors.groupingBy(
                        tier -> tier,
                        Collectors.counting()
                ));

        List<AdminAnalyticsDTO.ChartDataDTO> badgeDistribution =
                badgeTierCounts.entrySet()
                        .stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .map(entry -> AdminAnalyticsDTO.ChartDataDTO.builder()
                                .name(entry.getKey())
                                .count(entry.getValue())
                                .build())
                        .toList();


        Map<String, Long> badgeLevelCounts = badges.stream()
                .collect(Collectors.groupingBy(
                        badge -> String.valueOf(badge.getCurrentLevel()),
                        Collectors.counting()
                ));

        List<AdminAnalyticsDTO.ChartDataDTO> badgeLevelDistribution =
                badgeLevelCounts.entrySet()
                        .stream()
                        .sorted(Comparator.comparingInt(
                                entry -> Integer.parseInt(entry.getKey())
                        ))
                        .map(entry -> AdminAnalyticsDTO.ChartDataDTO.builder()
                                .name("Level " + entry.getKey())
                                .count(entry.getValue())
                                .build())
                        .toList();

        return AdminAnalyticsDTO.builder()
                .totalUsers(totalUsers)
                .totalBadges(totalBadges)
                .totalProficientSkills(totalProficientSkills)
                .roleDistribution(roleDistribution)
                .badgeDistribution(badgeDistribution)
                .topProficientSkills(topProficientSkills)
                .topSkillsToLearn(topSkillsToLearn)
                .badgeLevelDistribution(badgeLevelDistribution)
                .build();
    }
    }