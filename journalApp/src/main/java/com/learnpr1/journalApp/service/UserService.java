package com.learnpr1.journalApp.service;


import com.learnpr1.journalApp.entity.JournalEntry;
import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.repositary.UserRepo;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;


@Service

@Component

@Slf4j
public class UserService {

    @Autowired
    private UserRepo userRepo;

    private static final PasswordEncoder passwordencoder=new BCryptPasswordEncoder();
// Insted of it we can use @Slf4j annotation to log
    // messages, but for that we need to add lombok dependency in pom.xml
    // and also add @Slf4j annotation on top of the class
    // @Slf4j
//    private static final Logger logger = Logger.getLogger(UserService.class.getName());

    //Saves user
    public void saveuser(User user){
        userRepo.save(user);
    }

    public void saveuserEncripted(User user){
        user.setPassword(passwordencoder.encode(user.getPassword()));
        user.setRoles(List.of("User"));
        userRepo.save(user);
    }

    //create new admin
    public void saveAdminEncripted(User user) {
        user.setPassword(passwordencoder.encode(user.getPassword()));
        user.setRoles(List.of("User","ADMIN"));
        userRepo.save(user);
    }

    //Find by User Name
    public User findByUserName(String username){
        return userRepo.findByUsername(username);
    }

    //Returna list of all users
    public ResponseEntity<?> getAlluser(){
        List<User> all =userRepo.findAll();
        if(all != null && !all.isEmpty()){
            return new ResponseEntity<>(all, HttpStatus.OK);
        }
        else{
            return new ResponseEntity<>("There are no entries",HttpStatus.NOT_FOUND);
        }
    }

    //Creates a new user
    public ResponseEntity<User> createNewUser(User user){
        try {
            saveuserEncripted(user);
            return new ResponseEntity<>(user,HttpStatus.CREATED);
        } catch (Exception e) {
            log.trace("Info error");
            log.debug("Debug error");
            log.info("Info error");
            log.warn("Warn error");
            log.error("Error occurred while creating user: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    //Creates a ADMIN user
    public ResponseEntity<User> createNewAdmin(User user){
        try {
            saveAdminEncripted(user);
            return new ResponseEntity<>(user,HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }


    //Updates the user
    public ResponseEntity<?> updateUser(User user) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username=authentication.getName();


        // Fetch user from DB by username
        User existingUser = userRepo.findByUsername(username);

        if (existingUser != null) {


            // Update the existing user's fields
            existingUser.setUsername(user.getUsername() !=null && !user.getUsername().isEmpty()?user.getUsername(): existingUser.getUsername());
            existingUser.setPassword(user.getPassword() !=null && !user.getPassword().isEmpty()?user.getPassword(): existingUser.getPassword());
            existingUser.setJournalEntryList(user.getJournalEntryList() !=null && user.getJournalEntryList().isEmpty()?user.getJournalEntryList():existingUser.getJournalEntryList());

            // Save updated user back to DB
            saveuserEncripted(existingUser);
            return new ResponseEntity<>("User updated successfully", HttpStatus.OK);

        } else {
            System.out.println("User not found with username: " + username);
            return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
        }
    }


    //Deletes the user
    public void deleteObjectById(ObjectId id){
        userRepo.deleteById(id);
    }

    public ResponseEntity<?> deleteUserByUsername(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username= authentication.getName();
        User user = userRepo.findByUsername(username);
        userRepo.delete(user);
        return new ResponseEntity<>("User Deleted successfully", HttpStatus.NO_CONTENT);


    }






}
