package com.learnpr1.journalApp;

import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.repositary.UserRepo;
import com.learnpr1.journalApp.service.UserDetailServiceIMPL;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.ArrayList;

import static org.mockito.Mockito.when;

//@SpringBootTest
//public class UserDetailServiceTest {
//
//
//    @Autowired
//    private UserDetailServiceIMPL userDetailServiceIMPL;
//
//    @MockitoBean
//    private UserRepo userRepo;
//
//
//    @Test
//     void loadUserByUsernameTest(){
//
//        when(userRepo.findByUsername(ArgumentMatchers.anyString())).thenReturn(User.builder().username("ram").password("gfvdthrd").roles(new ArrayList<>()).build());
//        //when this method is called with any string argument, it will return a User object with username "ram" and password "gfvdthrd"
//
//        UserDetails user =userDetailServiceIMPL.loadUserByUsername("ram");
//
//        Assertions.assertNotNull(user);
//
//    }
//}


// we are playing with spring context when we use @SpringBootTest
// in the above program we are using @SpringBootTest to load the application context
//so as the application context is loaded all the beans are created so we need to use @MockBean to create a mock of UserRepo
// we are using @Autowired to inject the UserDetailServiceIMPL, so we need to inject the bean



public class UserDetailServiceTest {


    @InjectMocks
    private UserDetailServiceIMPL userDetailServiceIMPL;

    @Mock
    private UserRepo userRepo;
    //It mocks the UserRepo class which we @Autowired in UserDetailServiceIMPL class
    //So when we call userRepo.findByUsername() it will return the value we have defined in when() method


    // without this method we will get null pointer exception
    // because the mocks are not initialized
    // so we need to initialize the mocks
    @BeforeEach
    void setUp(){
        //MockitoAnnotations.openMocks(this); // This is used to initialize the mocks
        MockitoAnnotations.openMocks(this); // This is used to initialize the mocks
    }


    @Test
    void loadUserByUsernameTest(){

        when(userRepo.findByUsername(ArgumentMatchers.anyString())).thenReturn(User.builder().username("ram").password("gfvdthrd").roles(new ArrayList<>()).build());
        //when this method is called with any string argument, it will return a User object with username "ram" and password "gfvdthrd"

        UserDetails user =userDetailServiceIMPL.loadUserByUsername("ram");

        Assertions.assertNotNull(user);

    }
}
//here we are not using @SpringBootTest to load the application context that means we are not loading the whole spring context
// so we need to use @InjectMocks to inject the UserDetailServiceIMPL class
// and we are using @Mock to mock the UserRepo class which is @Autowired in UserDetailServiceIMPL class
// so when we call userRepo.findByUsername() it will return the value we have defined in when() method
// and we need to initialize the mocks using MockitoAnnotations.openMocks(this) in @BeforeEach method
// so that we will not get null pointer exception
