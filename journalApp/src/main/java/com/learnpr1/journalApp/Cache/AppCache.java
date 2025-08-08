package com.learnpr1.journalApp.Cache;


import com.learnpr1.journalApp.entity.ConfigJournalAppEntity;
import com.learnpr1.journalApp.repositary.ConfigJournalAppRepo;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AppCache {

    @Autowired
    private ConfigJournalAppRepo configJournalAppRepo;

    public Map<String, String> APP_CACHE;

    @PostConstruct // This method will be called after the bean is created and dependencies are injected
    public void init(){
        APP_CACHE=new HashMap<>();
        List<ConfigJournalAppEntity> configList = configJournalAppRepo.findAll();
        for (ConfigJournalAppEntity configJournalAppEntity : configList) {
            APP_CACHE.put(configJournalAppEntity.getKey(), configJournalAppEntity.getValue());
        }


        //If you make any changes in the config DataBase it will not automatically lode here
        //You have to restart the application to load the new config data
        //If you want to make it dynamic, you can make a controller which only calls init() method
        //It will clear the cache and reload the data from the database


    }

}
