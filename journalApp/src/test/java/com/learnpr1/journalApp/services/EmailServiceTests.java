package com.learnpr1.journalApp.services;


import com.learnpr1.journalApp.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class EmailServiceTests {

    @Autowired
    private EmailService emailService;

    @Test
    void testSendMail() {
        emailService.sendMail("vedantnerkar25@gmail.com",
                "Testing JAva mail sender",
                "Hii Please study well");

    }




}
