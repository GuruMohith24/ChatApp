package chatapp.com.chatapp.controller;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import chatapp.com.chatapp.dto.UserResponse;
import chatapp.com.chatapp.service.UserService;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService){
        this.userService = userService ;
    }

    @GetMapping("/all")
    public List<UserResponse> getAllUsers(){
        return userService.getAllUsers();
    }
}
