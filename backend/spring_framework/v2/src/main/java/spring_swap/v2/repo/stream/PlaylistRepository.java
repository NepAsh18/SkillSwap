package spring_swap.v2.repo.stream;

import spring_swap.v2.models.stream.Playlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlaylistRepository extends JpaRepository<Playlist, Long> {
    List<Playlist> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Playlist> findByUserIdAndIsPrivateFalseOrderByCreatedAtDesc(UUID userId);

}