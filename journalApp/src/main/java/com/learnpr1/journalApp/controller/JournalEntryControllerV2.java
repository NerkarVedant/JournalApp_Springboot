package com.learnpr1.journalApp.controller;


import  com.learnpr1.journalApp.entity.JournalEntry;
import com.learnpr1.journalApp.service.ExternalApiService;
import com.learnpr1.journalApp.service.JournalEntryService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;


@RestController
@RequestMapping("/journal")     //adds mapping on the whole class
public class JournalEntryControllerV2 {

    @Autowired      //--injecting-- an instance of the interface
    private JournalEntryService journalEntryService;

    @Autowired
    private ExternalApiService externalApiService;


    //Display all the entries
    @GetMapping()            //localhost:8080/journal --GET--
    public ResponseEntity<?> getAllJournalEntriesOfUser(){
        return journalEntryService.getAllJournalEntries();
    }



    //Creates new entries
    @PostMapping()            //localhost:8080/journal --Post--
    public ResponseEntity<JournalEntry>  createEntry(@RequestBody JournalEntry myentry){
        return journalEntryService.saveJournalEntry(myentry);

    }


    // Gets entry by id
    @GetMapping("id/{myId}")
    public ResponseEntity<JournalEntry> getJournalEntryById(@PathVariable ObjectId myId){
        return journalEntryService.getJournalEntryByID(myId);
    }


    //Deletes entry by id
    @DeleteMapping("id/{myId}")
    public ResponseEntity<String> deleteEntryById(@PathVariable ObjectId myId){
        return journalEntryService.deleteObjectById(myId);
    }



    //Updates entry by id
    @PutMapping("id/{myId}")
    public ResponseEntity<?> updateJournalEntryById (
            @PathVariable ObjectId myId,
            @RequestBody JournalEntry myentry){
        return journalEntryService.updatejournalEntry(myId,myentry);
    }


}
