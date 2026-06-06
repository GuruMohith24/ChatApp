package chatapp.com.chatapp.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import chatapp.com.chatapp.model.User;
import org.springframework.stereotype.Service;

import chatapp.com.chatapp.dto.ChatMessageResponse;
import chatapp.com.chatapp.dto.SendMessageRequest;
import chatapp.com.chatapp.model.Message;
import chatapp.com.chatapp.repository.MessageRepository;
import chatapp.com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    
    public ChatMessageResponse sendMessage(String senderUsername, SendMessageRequest request) {

        User sender = userRepository.findByUsername(senderUsername)
                            .orElseThrow(() -> new RuntimeException("Sender not found:" + senderUsername));


        String recipientUsername = request.getRecipientUsername();
        User recipient = userRepository.findByUsername(recipientUsername)
                            .orElseThrow(()-> new RuntimeException("Recipient not found:" + recipientUsername));

        Message message = Message.builder()
                .sender(sender)
                .recipient(recipient)
                .content(request.getContent())
                .createdAt(Instant.now())
                .build();

        Message savedMessage = messageRepository.save(message);

        return ChatMessageResponse.builder()
                .id(savedMessage.getId())
                .senderUsername(savedMessage.getSender().getUsername())
                .recipientUsername(savedMessage.getRecipient().getUsername())
                .content(savedMessage.getContent())
                .createdAt(savedMessage.getCreatedAt())
                .build();
    }

    public List<ChatMessageResponse> getChatHistory(String username1 , String username2){
        
        User user1 = userRepository.findByUsername(username1)
                                .orElseThrow(()-> new RuntimeException("username1 not found : "+ username1));
        User user2 = userRepository.findByUsername(username2)
                                .orElseThrow(()-> new RuntimeException("username2 not found : "+ username2));

        List<Message> messages = messageRepository.findBySenderAndRecipientOrRecipientAndSenderOrderByCreatedAtAsc(user1 , user2 , user1, user2);

        return messages.stream()
            .map(message -> ChatMessageResponse.builder()
                    .id(message.getId())
                    .senderUsername(message.getSender().getUsername())
                    .recipientUsername(message.getRecipient().getUsername())
                    .content(message.getContent())
                    .createdAt(message.getCreatedAt())
                    .build())
            .collect(Collectors.toList());
    }
}
