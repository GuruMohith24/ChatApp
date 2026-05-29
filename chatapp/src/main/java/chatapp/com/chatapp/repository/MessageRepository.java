package chatapp.com.chatapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import chatapp.com.chatapp.model.Message;

public interface MessageRepository extends JpaRepository<Message , Long >{

    
} 
