package com.learnpr1.journalApp.repositary;

import com.learnpr1.journalApp.entity.JournalEntry;
import com.learnpr1.journalApp.entity.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepo extends MongoRepository<User, ObjectId>{
    User findByUsername(String username);

    void delete(User user);
}
