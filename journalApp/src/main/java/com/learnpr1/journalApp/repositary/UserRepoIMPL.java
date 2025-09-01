package com.learnpr1.journalApp.repositary;

import com.learnpr1.journalApp.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public class UserRepoIMPL {


    @Autowired
    private MongoTemplate mongoTemplate;


    public List<User> getUserForSentimentAnalysis(){

        Query query= new Query();
//        query.addCriteria(Criteria.where("username").is("abc")); // Example: username is "abc"
//        query.addCriteria(Criteria.where("field").ne("value")); // Adjust the field and value as needed
//        query.addCriteria(Criteria.where("age").gte(34)); // Example: age greater than or equal to 34



//        query.addCriteria(Criteria.where("email").exists(true)); // Check if the email field exists
//        query.addCriteria(Criteria.where("email").ne(null).ne("")); // Check if email is not null or empty

        // -----OR---- We can check that if it is a regular expression or not

        query.addCriteria(Criteria.where("email").regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")); // Check if email is a valid format
        query.addCriteria(Criteria.where("sentimentAnalysis").is(true)); // Check if sentimentAnalysis is true

        // You can add more criteria and use "AND" "OR" conditions as needed
        // Example of using OR condition
        // Criteria criteria = Criteria.where("email").exists(true).orOperator
                                // (Criteria.where("sentimentAnalysis").is(true));
        // query.addCriteria(criteria);

        // -----OR----

//        Criteria criteria =new Criteria();
//        query.addCriteria(criteria.orOperator(
//                Criteria.where("email").exists(true),
//                Criteria.where("sentimentAnalysis").is(true)));

        List<User> users = mongoTemplate.find(query, User.class);
        return users;
    }
}
