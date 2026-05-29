package chatapp.com.chatapp.model;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    @ManyToOne
    @JoinColumn(name = "sender_id" , nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "recipient_id" , nullable = false)
    private User recipient;

    private String content;

    @Builder.Default
    private Boolean isRead = false;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
