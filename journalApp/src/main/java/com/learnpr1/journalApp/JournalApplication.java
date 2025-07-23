package com.learnpr1.journalApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication

public class JournalApplication {

	public static void main(String[] args) {

		SpringApplication.run(JournalApplication.class, args);
	}

}
