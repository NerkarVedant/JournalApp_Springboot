package com.learnpr1.journalApp.entity;


import com.mongodb.connection.ProxySettings;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Document(collation = "en")
public class User {
    @Id     //this is the unique key
    private ObjectId id;

    @Indexed(unique = true)
    @NonNull
    private String username;
    @NonNull
    private String password;

    @DBRef      //It will keep the reference of the Entries in the journalEntries
                //ex journalEntryList:[ DBRef ("journal entries",ObjectID("5948357492394"))

                //Only embedding the ID and not the whole entry
    private List<JournalEntry> journalEntryList=new ArrayList<>();

    //role of the user
    private List<String>roles;


    private String email;
    private boolean sentimentAnalysis;

//    private boolean sentimentAnalysis = false; // Default value is false
}
