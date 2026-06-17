package com.learnpr1.journalApp.Config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.learnpr1.journalApp.entity.JournalEntryDTO;
import io.lettuce.core.resource.DefaultClientResources;
import jakarta.annotation.PreDestroy;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
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

    @Autowired
    private ObjectIdDeserializer objectIdDeserializer;

    @Autowired
    private ObjectIdSerializer objectIdSerializer;

    @Bean
//            (name = journalEntryDTORedisTemplate)
    @Primary
    public RedisTemplate<String,JournalEntryDTO> journalEntryDTORedisTemplate(RedisConnectionFactory connectionFactory){
        RedisTemplate<String,JournalEntryDTO> journalEntryDTORedisTemplate= new RedisTemplate<>();
        journalEntryDTORedisTemplate.setConnectionFactory(connectionFactory);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        SimpleModule module= new SimpleModule();
        module.addSerializer(ObjectId.class,new ObjectIdSerializer());
        module.addDeserializer(ObjectId.class,new ObjectIdDeserializer());
        objectMapper.registerModule(module);

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

    private final DefaultClientResources clientResources = DefaultClientResources.create();

    @Bean
    public DefaultClientResources lettuceClientResources() {
        return clientResources;
    }

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;


    @Value("${spring.data.redis.password}")
    private String redisPassword;


    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration configuration = new RedisStandaloneConfiguration();
        configuration.setHostName(redisHost); // Redis Cloud host
        configuration.setPort(redisPort); // Redis Cloud port
        configuration.setPassword(redisPassword); // Redis Cloud password

        // Enable SSL if needed for Redis Cloud
//        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
//                .clientResources(clientResources)
//                .useSsl()
//                .build();

        return new LettuceConnectionFactory(configuration);
    }
    @PreDestroy
    public void shutdown() {
        clientResources.shutdown();
    }
    @Bean
    public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        return template;
    }

    @Bean(name = "refreshTokenRedisTemplate")
    public RedisTemplate<String, String> refreshTokenRedisTemplate(LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

//    The selected code configures Redis connectivity for a Spring Boot application using the Lettuce client. Here's what each part does:
//
//
//    private final DefaultClientResources clientResources:
//
//
//    Creates shared resources for the Lettuce Redis client (thread pools, event loops)
//    @Bean(destroyMethod = "destroy") public DefaultClientResources lettuceClientResources():
//
//
//    Exposes the client resources as a Spring bean
//    Configures automatic cleanup with the destroy method
//    @Bean public LettuceConnectionFactory redisConnectionFactory():
//
//
//    Creates a factory for Redis connections
//    Uses default connection settings (localhost:6379)
//    @PreDestroy public void shutdown():

    //Changed it as we are using Redis cloud so we need to provide host, port and password
//
//
//    Ensures proper cleanup of Lettuce resources when application shuts down
//    @Bean public RedisTemplate<String, Object> redisTemplate():
//
//
//    Creates a general-purpose template for Redis operations
//    Configures it with String keys and Object values
//    Note: This template uses default serializers (unlike the specialized JournalEntryDTORedisTemplate above which has custom serialization)
//    This configuration enables the application to interact with Redis for caching or storing data, with proper resource management.

}

