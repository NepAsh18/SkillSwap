package spring_swap.v2.models.stream;

import jakarta.persistence.*;
import lombok.*;
import spring_swap.v2.models.auth.User;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "videos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "video_uuid", nullable = false, unique = true)
    private UUID videoUuid;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "duration_secs")
    private Integer durationSecs;

    @Column(name = "thumbnail_path")
    private String thumbnailPath;

    @Column(name = "is_18_plus", nullable = false)
    private boolean is18Plus;

    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false)
    @Builder.Default
    private VideoProcessingStatus processingStatus = VideoProcessingStatus.PENDING;


    @Column(name = "hls_base_path")
    private String hlsBasePath;

    @Column(name = "raw_file_path")
    private String rawFilePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        uploadedAt = now;
        updatedAt = now;
        if (videoUuid == null) videoUuid = UUID.randomUUID();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}