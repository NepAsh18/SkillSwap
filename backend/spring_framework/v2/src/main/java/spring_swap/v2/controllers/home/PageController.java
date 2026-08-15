package spring_swap.v2.controllers.home;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.dtos.home.*;
import spring_swap.v2.services.home.PageService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/home")
@RequiredArgsConstructor
public class PageController {

    private final PageService pageService;



    // Public Endpoint: Read-only access bypassing authentication filters cleanly
    @GetMapping("/public/pages/{slug}")
    public ResponseEntity<PageResponseDTO> getPageBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(pageService.getPageBySlug(slug));
    }
    @GetMapping("/admin/pages")
    public ResponseEntity<List<PageResponseDTO>> getAllPages() {
        return ResponseEntity.ok(pageService.getAllPages());
    }

    // Secured Admin Mutations: Protected via Method Security (@PreAuthorize)
    @PostMapping("/admin/pages")
    public ResponseEntity<PageResponseDTO> createPage(@RequestBody PageRequestDTO requestDto) {
        return new ResponseEntity<>(pageService.createPage(requestDto), HttpStatus.CREATED);
    }

    @PostMapping("/admin/pages/{id}/sections")
    public ResponseEntity<PageResponseDTO> addSection(@PathVariable Long id, @RequestBody PageSectionRequestDTO requestDto) {
        return ResponseEntity.ok(pageService.addSectionToPage(id, requestDto));
    }
    @PutMapping("/admin/sections/{sectionId}")
    public ResponseEntity<PageSectionResponseDTO> updateSection(
            @PathVariable Long sectionId,
            @RequestBody PageSectionRequestDTO requestDto) {
        return ResponseEntity.ok(pageService.updateSection(sectionId, requestDto));
    }

    @DeleteMapping("/admin/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long sectionId) {
        pageService.deleteSection(sectionId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/admin/pages/{id}")
    public ResponseEntity<PageResponseDTO> updatePage(@PathVariable Long id, @RequestBody PageRequestDTO requestDto) {
        return ResponseEntity.ok(pageService.updatePage(id, requestDto));
    }

    @DeleteMapping("/admin/pages/{id}")
    public ResponseEntity<Void> deletePage(@PathVariable Long id) {
        pageService.deletePage(id);
        return ResponseEntity.noContent().build();
    }
}