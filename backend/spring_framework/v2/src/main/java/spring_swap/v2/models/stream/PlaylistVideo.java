package spring_swap.v2.models.stream;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "playlist_videos",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"playlist_id", "position"}),
                @UniqueConstraint(columnNames = {"playlist_id", "video_id"})
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaylistVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private Video video;

    @Column(nullable = false)
    private Integer position;
}