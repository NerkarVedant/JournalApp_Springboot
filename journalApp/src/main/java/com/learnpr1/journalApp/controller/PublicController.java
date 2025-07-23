package com.learnpr1.journalApp.controller;

import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public")
public class PublicController {

    @Autowired
    private UserService userService;


    @GetMapping("/health-check")  //mapping it with it, whenever we go to this url
    // the control will come to this place
    public String healthcheck(){
        return "health-Check";
    }


    //Creates new entries
    @PostMapping("/create-user")            //localhost:8080/journal --Post--
    public ResponseEntity<User> createEntry(@RequestBody User user){
        return userService.createNewUser(user);
    }
}

