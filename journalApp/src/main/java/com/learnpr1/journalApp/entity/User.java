package com.learnpr1.journalApp.entity;


import lombok.Data;
import lombok.NonNull;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collation = "en")
public class User {
    @Id     //this is the unique key
    private ObjectId id;

    @Indexed(unique = true)
    @NonNull
    private String username;
    @NonNull
    private String password;

    @DBRef      //It will keep the reference of the Enteryes in the journalEntries
                //ex journalEntryList:[ DBRef ("journalentries",ObjectID("5948357492394"))

                //Only embedding the ID and not the whole entry
    private List<JournalEntry> journalEntryList=new ArrayList<>();

    //role of the user
    private List<String>roles;
}
