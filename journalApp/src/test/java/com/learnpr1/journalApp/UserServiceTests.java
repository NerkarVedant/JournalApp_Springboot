package com.learnpr1.journalApp;

import com.learnpr1.journalApp.repositary.UserRepo;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvFileSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class UserServiceTests {

    @Autowired
    private UserRepo userRepo;



    @Test
    public void testAdd(){
        assertEquals(5,2+3);
    }

    @Test
    public void findByUsername(){
        assertNotNull(userRepo.findByUsername("abc"));
    }

    @ParameterizedTest
//    @CsvFileSource
    @CsvSource({
            "abc",
            "def",
            "jfusebcshd"
    })
    public void findByUsernameParam(String username){
        assertNotNull(userRepo.findByUsername(username));
    }

    @Disabled
    @ParameterizedTest
    @CsvSource({
            "1,2,3",
            "2,3,5",
            "10,20,30"
    })
    public void testAddParam(int a, int b, int expected){
        assertEquals(expected,a+b);
    }

}
