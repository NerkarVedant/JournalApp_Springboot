package com.learnpr1.journalApp.service;

import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.repositary.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class UserDetailServiceIMPL implements UserDetailsService {

    @Autowired
    private UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException{

        User user = userRepo.findByUsername(username);
        if(user !=null){
            UserDetails userDetails = org.springframework.security.core.userdetails.User
                    .builder()
                    .username(user.getUsername())
                    .password(user.getPassword())
                    .roles(user.getRoles().toArray(new String[0]))
                    .build();
            return userDetails;
        }
        throw new UsernameNotFoundException("User not found WITH USERNAME : "+username);

    }
}
