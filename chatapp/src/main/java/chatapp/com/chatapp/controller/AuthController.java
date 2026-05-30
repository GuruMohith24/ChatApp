package chatapp.com.chatapp.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import chatapp.com.chatapp.dto.AuthResponse;
import chatapp.com.chatapp.dto.LoginRequest;
import chatapp.com.chatapp.dto.RegisterRequest;
import chatapp.com.chatapp.dto.UserResponse;
import chatapp.com.chatapp.model.User;
import chatapp.com.chatapp.service.JwtService;
import chatapp.com.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final JwtService jwtService;
    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(@RequestBody RegisterRequest request){
        User savedUser = userService.registerUser(request.getUsername(), request.getEmail(), request.getPassword());
        UserResponse response = UserResponse.builder()
                                .id(savedUser.getId())
                                .username(savedUser.getUsername())
                                .email(savedUser.getEmail())
                                .avatarUrl(savedUser.getAvatarUrl())
                                .isOnline(savedUser.getIsOnline())
                                .createdAt(savedUser.getCreatedAt())
                                .build();
        
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        String jwtToken = jwtService.generateToken(request.getUsername());
        AuthResponse response = AuthResponse.builder()
                                    .token(jwtToken)
                                    .username(request.getUsername())
                                    .build();
            
        return new ResponseEntity<>(response, HttpStatus.OK);
            
        
    }
}
