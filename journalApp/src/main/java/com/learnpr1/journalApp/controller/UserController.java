package com.learnpr1.journalApp.controller;


import com.learnpr1.journalApp.entity.JournalEntry;
import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.service.UserService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;



    //Update user
    @PutMapping()
    public ResponseEntity<?> updateUser(@RequestBody User user) {

        return userService.updateUser(user);  // Let the service handle response logic
    }

    //Delete user
    @DeleteMapping()
    public ResponseEntity<?> delteruser(){

        return userService.deleteUserByUsername();
    }





//    // Gets entry by id
//    @GetMapping("id/{myId}")
//    public ResponseEntity<User> getJournalEntryById(@PathVariable ObjectId myId){
//        Optional<User> userOptional=userService.findObjectById(myId) ;
//        if(userOptional.isPresent()){
//            return new ResponseEntity<>(userOptional.get(), HttpStatus.OK);
//        }
//        else {
//            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
//        }
//    }


//    //Deletes entry by id
//    @DeleteMapping("id/{myId}")
//    public ResponseEntity<String> deleteEntryById(@PathVariable ObjectId myId){
//        Optional<User> userOptional=userService.findObjectById(myId);
//        if(userOptional.isPresent()){
//            userService.deleteObjectById(myId);
//            return new ResponseEntity<>("Entry Deleted", HttpStatus.OK);
//        }
//        else {
//            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
//        }
//    }




}
