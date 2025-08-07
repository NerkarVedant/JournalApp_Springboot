package com.learnpr1.journalApp.controller;

import com.learnpr1.journalApp.entity.AuthResponseDTO;
import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.service.UserDetailServiceIMPL;
import com.learnpr1.journalApp.service.UserService;
import com.learnpr1.journalApp.utils.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/public")
public class PublicController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailServiceIMPL userServiceDetail;

    @Autowired
    private JwtUtil jwtUtil;


    @GetMapping("/health-check")  //mapping it with it, whenever we go to this url
    // the control will come to this place
    public String healthcheck(){

        return "health-Check";
    }


    //Creates new entries
    @PostMapping("/signup")            //localhost:8080/journal --Post--
    public ResponseEntity<User> signup(@RequestBody User user){

        return userService.createNewUser(user);
    }

    @PostMapping("/login")            //localhost:8080/journal --Post--
    public ResponseEntity<?> login(@RequestBody User user){
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));
            UserDetails userDetails=userServiceDetail.loadUserByUsername(user.getUsername());
            String username = userDetails.getUsername();
            String jwt=jwtUtil.generateToken(username);
            String refreshToken=jwtUtil.generateRefreshToken(username);

            AuthResponseDTO authResponse = new AuthResponseDTO(jwt, refreshToken);
            return new ResponseEntity<>(authResponse, HttpStatus.OK);

        }
        catch (Exception e) {
            log.error("Exception occurred while creating Authentication token", e.getMessage());
            return new ResponseEntity<>("Invalid username or password", HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<String> refreshToken(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        return new ResponseEntity<>(jwtUtil.returnAccessToken(token), HttpStatus.OK);
    }
}
