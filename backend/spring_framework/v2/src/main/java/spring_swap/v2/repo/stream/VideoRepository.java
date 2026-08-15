package spring_swap.v2.repo.stream;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import spring_swap.v2.models.stream.Video;
import spring_swap.v2.models.stream.VideoProcessingStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {

    Optional<Video> findByVideoUuid(UUID videoUuid);

    List<Video> findAllByOrderByUploadedAtDesc();

    List<Video> findByIs18PlusFalseOrderByUploadedAtDesc();

    List<Video> findByUploadedByIdOrderByUploadedAtDesc(UUID userId);

    List<Video> findByProcessingStatus(VideoProcessingStatus status);

    boolean existsByVideoUuid(UUID videoUuid);

    @Query("SELECT COALESCE(SUM(v.fileSizeBytes), 0) FROM Video v")
    long sumAllFileSizeBytes();

    @Query("SELECT COALESCE(SUM(v.fileSizeBytes), 0) FROM Video v WHERE v.uploadedBy.id = :userId")
    long sumFileSizeBytesByUploader(UUID userId);
}