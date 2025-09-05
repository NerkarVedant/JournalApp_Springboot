package com.learnpr1.journalApp.service;

import com.learnpr1.journalApp.entity.JournalEntryDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;


@Service
@Slf4j
public class RedisService {

//    @Autowired
//    private RedisTemplate redisTemplate;


    //    @Qualifier("journalEntryDTORedisTemplate")
    @Autowired

    private RedisTemplate<String,JournalEntryDTO> journalEntryDTORedisTemplate;

//    public <T> T get(String key, Class<T> entityClass) {
//        try{
//            Object o= redisTemplate.opsForValue().get(key);
//            ObjectMapper objectMapper=new ObjectMapper();
//            assert o != null;
//            return objectMapper.readValue(o.toString(),entityClass);
//        }
//        catch (Exception e) {
//            log.error("Error while getting data from redis", e);
//            return null;
//        }
//    }
//
//    public void set(String key, Object o, Long ttl) {
//        try
//        {
//            ObjectMapper objectMapper = new ObjectMapper();
//            String jsonValue = objectMapper.writeValueAsString(o);
//            redisTemplate.opsForValue().set(key, jsonValue,ttl, TimeUnit.SECONDS);
//        }
//        catch (Exception e) {
//            log.error("Error while setting data to redis", e);
//
//        }
//    }



    public void saveJournalEntryriesToCache(String username , List<JournalEntryDTO> entries) {
        System.out.println(">>> Using template: " + journalEntryDTORedisTemplate.getValueSerializer().getClass().getName());

        String key = "user" + username;
        journalEntryDTORedisTemplate.opsForList().rightPushAll(username, entries);
    }

    public List<JournalEntryDTO> getJournalEntriesFromCache(String username) {
        String key = "user" + username;
        return journalEntryDTORedisTemplate.opsForList().range(username, 0, -1);

    }

}
