package com.learnpr1.journalApp.entity;


import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document  (collection = "config_journalApp") //Tells spring that this is mapped to mongodb
// its instance will be equal to a document

@NoArgsConstructor          //IMP -- it is needed for conversion of JSON to POJO (plane old java object)
@Data

public class ConfigJournalAppEntity {

    @Id
    private ObjectId id; //MongoDB uses ObjectId as a unique identifier
    private String key;
    private String value;



}
