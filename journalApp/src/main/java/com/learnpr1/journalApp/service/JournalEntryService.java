package com.learnpr1.journalApp.service;


import com.learnpr1.journalApp.entity.JournalEntry;
import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.repositary.JournalEntryRepo;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.constant.ConstantDesc;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// controller ---> service ---> repository

//here we write all out business logic
@Service
@Component
public class JournalEntryService {

    @Autowired      //dependency injection
    private JournalEntryRepo journalEntryRepo;

    @Autowired
    private UserService userService;

    @Transactional
    public ResponseEntity<JournalEntry> saveJournalEntry(JournalEntry journalEntry){
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User user=userService.findByUserName(username);
            journalEntry.setDate(LocalDateTime.now());
            JournalEntry saved=journalEntryRepo.save(journalEntry);
            user.getJournalEntryList().add(saved);
            //here if we write
            //user.setUsername(null);
            //it will give an error means the entry will be added to our database of the journalEntries,
            //but it will not get referenced with the user, means there will be a waste of the space
            //so to avoid it we make it transactional means this all code will be treated as one
            userService.saveuser(user);
            return new ResponseEntity<>(journalEntry,HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

    }


    public ResponseEntity<?> getAllJournalEntries(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user=userService.findByUserName(username);
        List<JournalEntry> all =user.getJournalEntryList();
        if(all != null && !all.isEmpty()){
            return new ResponseEntity<>(all, HttpStatus.OK);
        }
        else{
            return new ResponseEntity<>("There are no entries",HttpStatus.NOT_FOUND);
        }


    }


    public Optional<JournalEntry> findObjectById(ObjectId id){
        return journalEntryRepo.findById(id);
    }



    public ResponseEntity<JournalEntry>getJournalEntryByID(ObjectId id){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByUserName(username);
        Optional<JournalEntry> journalEntryList=user.getJournalEntryList().stream().filter(x -> x.getId().equals(id)).findFirst();
        if(journalEntryList.isPresent()) {
            Optional<JournalEntry> journalEntry = findObjectById(id);
            if (journalEntry.isPresent()) {
                return new ResponseEntity<>(journalEntry.get(), HttpStatus.OK);
            }
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }



    @Transactional
    public ResponseEntity<String> deleteObjectById(ObjectId id){
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User user = userService.findByUserName(username);

            // here if we don't write the below sentence spring will still delete
            // the old reference of the deleted id stored in the user
            //when we will save some other entry, basically come here again
            //But it is called as inconsistent as it deletes the reference in the next round
            //this happens because our spring foes deep finding it Journal entry and when it sees the reference of the
            // deleted entry if goes and finds it to be null so it deletes it by itself
            // But if we want to delete it at the same instance we need to write the below line
            user.getJournalEntryList().removeIf(x -> x.getId().equals(id));
            userService.saveuser(user);
            Optional<JournalEntry> journalEntry = findObjectById(id);
            if (journalEntry.isPresent()) {
                journalEntryRepo.deleteById(id);
                return new ResponseEntity<>("Entry Deleted", HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
        } catch (Exception e) {
            throw new RuntimeException("An error occurred while deleting",e);
        }


    }




    public ResponseEntity<?> updatejournalEntry(ObjectId id, JournalEntry updatedEntry){
        JournalEntry oldEntry = journalEntryRepo.findById(id).orElse(null);
        if (oldEntry != null){
            oldEntry.setTitle(updatedEntry.getTitle() != null && !updatedEntry.getTitle().isEmpty() ?updatedEntry.getTitle(): oldEntry.getTitle());
            oldEntry.setContent(updatedEntry.getContent() !=null && !updatedEntry.getContent().isEmpty() ? updatedEntry.getContent(): oldEntry.getContent());
            journalEntryRepo.save(oldEntry);
            return new ResponseEntity<>(oldEntry.toString(), HttpStatus.OK);
        }
        else {
            return new ResponseEntity<>("There was not such Entry",HttpStatus.NOT_FOUND);
        }
    }
}

