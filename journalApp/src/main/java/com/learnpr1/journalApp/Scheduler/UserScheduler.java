package com.learnpr1.journalApp.Scheduler;


import com.learnpr1.journalApp.Cache.AppCache;
import com.learnpr1.journalApp.entity.JournalEntry;
import com.learnpr1.journalApp.entity.User;
import com.learnpr1.journalApp.repositary.UserRepoIMPL;
import com.learnpr1.journalApp.service.EmailService;
import com.learnpr1.journalApp.service.SentimentAnalysisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class UserScheduler {

    @Autowired
    private UserRepoIMPL userRepoIMPL;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SentimentAnalysisService sentimentAnalysisService;

    @Autowired
    private AppCache appCache;


    @Scheduled(cron = "0 0 9 * * SUN") // Every Sunday at 9 AM
    public void fetchUsersAndSendSAMails(){
        List<User> users=userRepoIMPL.getUserForSentimentAnalysis();
        for(User user:users){
            List<JournalEntry> journalEntries=user.getJournalEntryList();

            List<String> filteredList = journalEntries.stream().filter(x -> x.getDate().isAfter(LocalDateTime.now().minusDays(7))).map(JournalEntry::getContent).toList();
            String combinedContent = String.join(" ", filteredList);
            String sentimentResult=sentimentAnalysisService.getSentiment(combinedContent);

            emailService.sendMail(user.getEmail(),"Weekly Sentiment Analysis Report",sentimentResult);
        }
    }


    @Scheduled(cron="0 * * ? * *") //E
    public void relodeAppCache(){
        appCache.init();
        log.info("App Cache reloaded at {}", LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
    }


















//    public void sendMailsToUsers(){
//        var users= userRepoIMPL.getUserForSentimentAnalysis();
//        for(var user:users){
//            String to=user.getEmail();
//            String subject="Your Weekly Sentiment Analysis Report";
//            String body="Dear "+user.getName()+",\n\n"+
//                    "Here is your weekly sentiment analysis report:\n"+
//                    "Average Sentiment Score: "+user.getAvgSentimentScore()+"\n"+
//                    "Total Entries Analyzed: "+user.getEntryCount()+"\n\n"+
//                    "Keep journaling to track your mood and thoughts!\n\n"+
//                    "Best regards,\n"+
//                    "The Journal App Team";
//            emailService.sendMail(to,subject,body);
//        }
//    }
}
