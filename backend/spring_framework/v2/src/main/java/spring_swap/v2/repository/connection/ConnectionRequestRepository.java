package spring_swap.v2.repository.connection;

import org.springframework.data.mongodb.repository.MongoRepository;
import spring_swap.v2.document.connection.ConnectionRequestDocument;
import spring_swap.v2.document.connection.ConnectionStatus;

import java.util.List;
import java.util.Optional;

public interface ConnectionRequestRepository extends MongoRepository<ConnectionRequestDocument, String> {

    Optional<ConnectionRequestDocument> findBySenderIdAndReceiverIdAndStatusIn(
            String senderId, String receiverId, List<ConnectionStatus> statuses);

    List<ConnectionRequestDocument> findByReceiverIdAndStatus(String receiverId, ConnectionStatus status);

    List<ConnectionRequestDocument> findBySenderIdAndStatus(String senderId, ConnectionStatus status);

    List<ConnectionRequestDocument> findBySenderIdAndStatusOrReceiverIdAndStatus(
            String senderId, ConnectionStatus status1, String receiverId, ConnectionStatus status2);



}
