package com.learnpr1.journalApp.services;


import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;

@SpringBootTest
public class RedisTests {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;


    @Test
    void testRedis(){
        redisTemplate.opsForValue().set("email","abcd@gmail.com");

        Object username =redisTemplate.opsForValue().get("username");
        System.out.println(username);

    }
}
