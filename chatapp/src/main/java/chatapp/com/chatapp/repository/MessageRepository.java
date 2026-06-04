package chatapp.com.chatapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import chatapp.com.chatapp.model.Message;
import chatapp.com.chatapp.model.User;

public interface MessageRepository extends JpaRepository<Message , Long >{

    List<Message> findBySenderAndRecipientOrRecipientAndSenderOrderByCreatedAtAsc(
        User sender1, User recipient1, User sender2, User recipient2
    );

} 
