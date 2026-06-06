package chatapp.com.chatapp.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import chatapp.com.chatapp.dto.ChatMessageResponse;
import chatapp.com.chatapp.dto.SendMessageRequest;
import chatapp.com.chatapp.service.MessageService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ChatController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/api/messages/{username}")
    public List<ChatMessageResponse> getChatHistory(@PathVariable String username, Principal principal) {
        return messageService.getChatHistory(principal.getName(), username);
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest request, Principal principal) {
        ChatMessageResponse response = messageService.sendMessage(principal.getName(), request);
        messagingTemplate.convertAndSendToUser(response.getRecipientUsername(), "/queue/messages", response);
    }

    // TEMPORARY - for Postman testing only, remove later
    @PostMapping("/api/messages/send")
    public ChatMessageResponse sendMessageRest(@RequestBody SendMessageRequest request, Principal principal) {
        return messageService.sendMessage(principal.getName(), request);
    }
}
