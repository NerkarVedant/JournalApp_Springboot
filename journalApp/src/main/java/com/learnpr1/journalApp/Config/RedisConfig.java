package com.learnpr1.journalApp.Config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.learnpr1.journalApp.entity.JournalEntryDTO;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.util.List;

@Configuration
public class RedisConfig {

    private static final String journalEntryDTORedisTemplate = "journalEntryDTORedisTemplate";

//    @Bean
//    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
//        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
//        redisTemplate.setConnectionFactory(factory);
//
//        // Set serializers for all operations
//        StringRedisSerializer stringSerializer = new StringRedisSerializer();
//        GenericJackson2JsonRedisSerializer genericJackson2JsonRedisSerializer=new GenericJackson2JsonRedisSerializer();
//        redisTemplate.setKeySerializer(stringSerializer);
//        redisTemplate.setValueSerializer(genericJackson2JsonRedisSerializer);
//        redisTemplate.setHashKeySerializer(stringSerializer);
//        redisTemplate.setHashValueSerializer(stringSerializer);
//        redisTemplate.afterPropertiesSet();
//
//        return redisTemplate;
//    }

    @Bean
//            (name = journalEntryDTORedisTemplate)
    @Primary
    public RedisTemplate<String,JournalEntryDTO> journalEntryDTORedisTemplate(RedisConnectionFactory connectionFactory){
        RedisTemplate<String,JournalEntryDTO> journalEntryDTORedisTemplate= new RedisTemplate<>();
        journalEntryDTORedisTemplate.setConnectionFactory(connectionFactory);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);


        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer genericJackson2JsonRedisSerializer=new GenericJackson2JsonRedisSerializer(objectMapper);
        journalEntryDTORedisTemplate.setKeySerializer(new StringRedisSerializer());
        journalEntryDTORedisTemplate.setValueSerializer(genericJackson2JsonRedisSerializer);
        journalEntryDTORedisTemplate.setHashKeySerializer(genericJackson2JsonRedisSerializer);
        journalEntryDTORedisTemplate.setHashValueSerializer(genericJackson2JsonRedisSerializer);
        journalEntryDTORedisTemplate.afterPropertiesSet();
        System.out.println(">>> RedisTemplate KeySerializer: " + journalEntryDTORedisTemplate.getKeySerializer().getClass().getName());
        System.out.println(">>> RedisTemplate ValueSerializer: " + journalEntryDTORedisTemplate.getValueSerializer().getClass().getName());


        return journalEntryDTORedisTemplate;

    }
}
