package com.learnpr1.journalApp.repository;


import com.learnpr1.journalApp.repositary.UserRepoIMPL;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class UserRepoIMPLTests {

    @Autowired
    private UserRepoIMPL userRepoIMPL;

    @Test
    public void testSavedUser(){
        userRepoIMPL.getUserForSentimentAnalysis();
    }

}
