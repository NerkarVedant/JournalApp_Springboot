package com.learnpr1.journalApp.controller;


import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/all-users")            //localhost:8080/user --GET--
    public ResponseEntity<?> getAllUsers(){
        return userService.getAlluser();
    }


    @PostMapping("/create-admin")
    public ResponseEntity<User> createAdmin(@RequestBody User user){
        return userService.createNewAdmin(user);
    }
}
