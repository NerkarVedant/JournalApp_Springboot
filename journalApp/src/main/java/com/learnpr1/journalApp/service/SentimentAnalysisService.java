package com.learnpr1.journalApp.service;


import org.springframework.stereotype.Service;

@Service
public class SentimentAnalysisService {


    //out dummy method for sentiment analysis instead of using machine learning model
    public String getSentiment(String text) {
        return ""; // Dummy implementation
    }
}
