package spring_swap.v2.services.home;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import spring_swap.v2.dtos.home.*;
import spring_swap.v2.exceptions.DuplicateResourceException;
import spring_swap.v2.exceptions.ResourceNotFoundException;
import spring_swap.v2.mapper.PageMapper;
import spring_swap.v2.models.home.Page;
import spring_swap.v2.models.home.PageSection;
import spring_swap.v2.repo.home.PageRepository;
import spring_swap.v2.repo.home.PageSectionRepository;

import java.util.ArrayList;
import java.util.List;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PageService {

    private final PageRepository pageRepository;
    private final PageSectionRepository pageSectionRepository;
    private final PageMapper pageMapper;

    @Transactional(readOnly = true)
    public PageResponseDTO getPageBySlug(String slug) {
        Page page = pageRepository.findBySlugWithSections(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Page not found with slug: " + slug));

        return pageMapper.toResponseDto(page);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')") // Enforces role verification securely via filter contexts
    public PageResponseDTO createPage(PageRequestDTO requestDto) {
        if (pageRepository.existsBySlug(requestDto.getSlug())) {
            throw new DuplicateResourceException("Slug identifier already exists: " + requestDto.getSlug());
        }

        Page newPage = pageMapper.toEntity(requestDto);
        newPage.setPublished(true);

        if (newPage.getSections() == null) {
            newPage.setSections(new ArrayList<>());
        }

        Page savedPage = pageRepository.save(newPage);
        return pageMapper.toResponseDto(savedPage);
    }


    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public PageResponseDTO addSectionToPage(Long pageId, PageSectionRequestDTO sectionRequestDto) {
        Page page = pageRepository.findById(pageId)
                .orElseThrow(() -> new ResourceNotFoundException("…"));

        // Create the section using the mapper (content map is set automatically)
        PageSection newSection = pageMapper.toSectionEntity(sectionRequestDto);
        newSection.setPage(page);
        pageSectionRepository.save(newSection);

        // Reload page to get fresh list of sections
        Page refreshed = pageRepository.findById(pageId)
                .orElseThrow(() -> new ResourceNotFoundException("…"));
        return pageMapper.toResponseDto(refreshed);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public PageSectionResponseDTO updateSection(Long sectionId, PageSectionRequestDTO sectionRequestDto) {
        PageSection existingSection = pageSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found with ID: " + sectionId));


        pageMapper.updateSectionFromDto(sectionRequestDto, existingSection);

        PageSection savedSection = pageSectionRepository.save(existingSection);
        return pageMapper.toSectionResponseDto(savedSection);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public void deleteSection(Long sectionId) {
        PageSection existingSection = pageSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found with ID: " + sectionId));

        // Safely detach from parent collection if necessary to avoid unintended state syncs
        if (existingSection.getPage() != null && existingSection.getPage().getSections() != null) {
            existingSection.getPage().getSections().remove(existingSection);
        }

        pageSectionRepository.delete(existingSection);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public PageResponseDTO updatePage(Long id, PageRequestDTO requestDto) {
        Page existingPage = pageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Page update target context not found with ID: " + id));

        if (!existingPage.getSlug().equals(requestDto.getSlug()) && pageRepository.existsBySlug(requestDto.getSlug())) {
            throw new DuplicateResourceException("Cannot update slug. Resource link already occupied: " + requestDto.getSlug());
        }

        pageMapper.updatePageFromDto(requestDto, existingPage);
        return pageMapper.toResponseDto(pageRepository.save(existingPage));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public void deletePage(Long id) {
        Page existingPage = pageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Page deletion target context not found with ID: " + id));

        pageRepository.delete(existingPage);
    }
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<PageResponseDTO> getAllPages() {
        return pageRepository.findAll().stream()
                .map(pageMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PageSummaryDTO> getAllSlugs() {
        return pageRepository.findAll().stream()
                .map(p -> new PageSummaryDTO(p.getId(), p.getSlug(), p.getTitle()))
                .collect(Collectors.toList());
    }
}