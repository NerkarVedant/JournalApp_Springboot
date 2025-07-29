package com.learnpr1.journalApp.entity;


import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Document  (collation = "en") //Tells spring that this is mapped to mongodb
// its instance will be equal to a document

//Lombok annotations
//@Getter
//@Setter
//@AllArgsConstructor
@NoArgsConstructor          //IMP -- it is needed for conversion of JSON to POJO (plane old java object)
@Data
//@ToString
//@EqualsAndHashCode
//@Builder
//@Slf4j


public class JournalEntry {

    @Id     //this is the unique key
    private ObjectId id;

    @NonNull
    private String title;
    private String content;
    private LocalDateTime date;
    private byte[] audioFile; //for storing audio file in byte array



}
