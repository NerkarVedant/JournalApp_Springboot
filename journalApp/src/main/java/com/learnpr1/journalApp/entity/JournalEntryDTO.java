package com.learnpr1.journalApp.entity;




import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@NoArgsConstructor          //IMP -- it is needed for conversion of JSON to POJO (plane old java object)
@Data
public class JournalEntryDTO {

    private String id;
    private String title;
    private String content;
    private LocalDateTime date;
    private byte[] audioFile;

    public JournalEntryDTO(JournalEntry entry) {
        this.id = entry.getId().toHexString(); // convert ObjectId to string
        this.title = entry.getTitle();
        this.content = entry.getContent();
        this.date = entry.getDate();
        this.audioFile = entry.getAudioFile();
    }
}
