package com.learnpr1.journalApp.Config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

@Configuration
public class JacksonConfig {

    @Autowired
    private ObjectIdSerializer objectIdSerializer;

    @Autowired
    private ObjectIdDeserializer objectIdDeserializer;

    @Bean
    @Primary
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        ObjectMapper objectMapper = builder.build();

        // Register modules
        objectMapper.registerModule(new JavaTimeModule());

        // Add custom serializers and deserializers
        SimpleModule module = new SimpleModule();
        module.addSerializer(ObjectId.class, objectIdSerializer);
        module.addDeserializer(ObjectId.class, objectIdDeserializer);
        objectMapper.registerModule(module);

        return objectMapper;
    }
}
