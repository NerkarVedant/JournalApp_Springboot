package com.learnpr1.journalApp.repositary;

import com.learnpr1.journalApp.entity.ConfigJournalAppEntity;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
//mongorepo does normal CRUD operations -Create Read update Delete
public interface ConfigJournalAppRepo extends MongoRepository<ConfigJournalAppEntity, ObjectId>    {

}
