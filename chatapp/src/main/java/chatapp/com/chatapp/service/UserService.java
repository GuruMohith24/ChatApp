package chatapp.com.chatapp.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import chatapp.com.chatapp.model.User;
import chatapp.com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;  

    public User registerUser(String username , String email , String password){
        
        if(userRepository.existsByUsername(username)){
            throw new RuntimeException("User name is already taken");
        }

        if(userRepository.existsByEmail(email)){
            throw new RuntimeException("Email already taken");
        }
        
        User user = User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .createdAt(Instant.now())
                    .build();
        
        return userRepository.save(user);

    }
}
