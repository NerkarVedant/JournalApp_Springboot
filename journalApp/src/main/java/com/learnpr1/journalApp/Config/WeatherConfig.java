package com.learnpr1.journalApp.Config;

import org.springframework.context.annotation.Bean;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class WeatherConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
