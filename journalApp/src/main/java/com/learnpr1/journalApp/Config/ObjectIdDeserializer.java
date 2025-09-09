package com.learnpr1.journalApp.Config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import org.bson.types.ObjectId;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class ObjectIdDeserializer extends JsonDeserializer<ObjectId> {
    @Override
    public ObjectId deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String id = p.getValueAsString();
        if (id == null || id.isEmpty()) {
            return null;
        }

        try {
            return new ObjectId(id);
        } catch (IllegalArgumentException e) {
            // Handle invalid ObjectId string - either return null or generate a new one
            return null;
        }
    }
}
