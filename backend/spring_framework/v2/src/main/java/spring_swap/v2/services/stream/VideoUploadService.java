package spring_swap.v2.services.stream;

import org.springframework.web.multipart.MultipartFile;
import spring_swap.v2.dtos.stream.*;
import java.util.List;
import java.util.UUID;

public interface VideoUploadService {

    // Videos
    VideoResponseDTO upload(MultipartFile file, VideoUploadRequestDTO dto, UUID uploadedByUserId);
    VideoResponseDTO getVideo(UUID videoUuid);
    List<VideoResponseDTO> getAllVideos();
    VideoStreamResponseDTO getStreamInfo(UUID videoUuid);
    void delete(UUID videoUuid, UUID requestedByUserId);

    // Playlists
    PlaylistResponseDTO createPlaylist(CreatePlaylistRequestDTO dto,UUID userId);
    PlaylistResponseDTO getPlaylist(Long playlistId);
    List<PlaylistResponseDTO> getUserPlaylists(UUID userId);
    PlaylistResponseDTO addVideoToPlaylist(Long playlistId, UUID videoUuid, Integer position);
    void removeVideoFromPlaylist(Long playlistId, UUID videoUuid);
}