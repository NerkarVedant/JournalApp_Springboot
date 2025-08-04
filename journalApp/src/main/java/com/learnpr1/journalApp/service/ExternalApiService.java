package com.learnpr1.journalApp.service;

import ch.qos.logback.core.joran.spi.HttpUtil;
import com.learnpr1.journalApp.ApiResponse.WeatherResponse;
import com.learnpr1.journalApp.entity.JournalEntry;
import com.learnpr1.journalApp.repositary.JournalEntryRepo;
import com.mashape.unirest.http.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;
import com.mashape.unirest.http.exceptions.UnirestException;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

@Service
@Component
public class ExternalApiService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private JournalEntryRepo journalEntryRepo;//Class in spring which processes http requests and gives responses

    @Value("${weather.api.key}")
    private String weatherApiKey; // Injected from application.properties
    private String baseUrl="http://api.weatherstack.com/current";

    public ExternalApiService() throws IOException {
    }

    public WeatherResponse getWeather(String cityName) {
        String finalAPI = baseUrl + "?access_key=" + weatherApiKey + "&query=" + cityName;
        ResponseEntity<WeatherResponse> response = restTemplate.exchange(finalAPI, HttpMethod.GET, null, WeatherResponse.class);
        return response.getBody();

    }

//     POST call
//    String requestBody= "hiii etc etc";
//    User user= User.builder().username("abc").password("abc").build();
//    HttpEntity<String> httpEntity=new HttpEntity<>(requestBody);
//    HttpEntity<user> httpEntity=new HttpEntity<>(user);
//
//
//
//    ResponseEntity<WeatherResponse> response = restTemplate.exchange(finalAPI, HttpMethod.POST,httpEntity, WeatherResponse.class);
//
//    we can also send headers

//    HttpHeaders httpHeaders=new HttpHeaders();
//
//    public void setHttpHeaders(HttpHeaders httpHeaders) {
//        this.httpHeaders = httpHeaders;
//        httpHeaders.set("Key","value");
//        HttpEntity<user> httpEntity=new HttpEntity<>(user, httpHeaders);




    //Showes the temperature
    public ResponseEntity<?> temperature() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        WeatherResponse weatherResponse=getWeather("Pune");
        String currentWeater="";
        if (weatherResponse != null ) {
            currentWeater = " Temperature: " + weatherResponse.getCurrent().getTemperature() + "°C, " +
                            "\n Feels like: " + weatherResponse.getCurrent().getWeather_descriptions().get(0)+
                            "\n Sunrise: " + weatherResponse.getCurrent().getAstro().getSunrise() +
                            "\n Sunset: " + weatherResponse.getCurrent().getAstro().getSunset() +
                            "\n Air Quality CO: " + weatherResponse.getCurrent().getAir_quality().getCo() +
                            "\n NO2: " + weatherResponse.getCurrent().getAir_quality().getNo2() +
                            "\n O3: " + weatherResponse.getCurrent().getAir_quality().getO3() +
                            "\n SO2: " + weatherResponse.getCurrent().getAir_quality().getSo2() +
                            "\n PM2.5: " + weatherResponse.getCurrent().getAir_quality().getPm2_5() +
                            "\n PM10: " + weatherResponse.getCurrent().getAir_quality().getPm10();
        } else {
            currentWeater = "Weather data not available";
        }
        return new ResponseEntity<>("Hii "+ authentication.getName()+currentWeater, HttpStatus.OK);
    }

//    @Value("${elevenlabs.api.key}")
//    String elevenlabsApiKey; // Replace with your ElevenLabs API key

    @Value("${speechify.api.key}")
    String speechifyApiKey; // Replace with your Speechify API key
    public byte[] generateSpeechFile(JournalEntry journalEntry) {
        byte[] audioBytes = null;
        try {
            // Escape special characters in text
            String title = "Title."+journalEntry.getTitle().replace("\"", "\\\"").replace("\n", " ");
            String content ="Content."+ journalEntry.getContent().replace("\"", "\\\"").replace("\n", " ");

            // Create properly formatted JSON
            String jsonBody = String.format("{\"input\": \"%s %s\", \"voice_id\": \"lisa\"}",
                    title, content);



            // Make API request with longer timeouts
            Unirest.setTimeouts(10000, 60000); // 10s connect, 60s socket timeout
            HttpResponse<InputStream> response = Unirest.post("https://api.sws.speechify.com//v1/audio/stream")
                    .header("Accept", "audio/mpeg")
                    .header("Authorization", "Bearer " + speechifyApiKey)
                    .header("Content-Type", "application/json")
                    .body(jsonBody)
                    .asBinary();

            if (response.getStatus() != 200) {
                String errorMsg = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
                System.out.println("Error: " + errorMsg);
                return null;
            }

            // Read binary response completely
            InputStream inputStream = response.getBody();
            ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192]; // Larger buffer
            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                byteOut.write(buffer, 0, bytesRead);
            }

            audioBytes = byteOut.toByteArray();

            // Validate file size
            if (audioBytes == null || audioBytes.length < 10000) { // Expecting at least 10KB
                System.out.println("⚠️ Warning: Audio file too small: " +
                        (audioBytes != null ? audioBytes.length : 0) + " bytes");
            } else {
                System.out.println("✅ Received " + audioBytes.length + " bytes of audio");
            }

            // Save file with proper error handling
            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH-mm-ss");
            String fileName = "C:/Users/HP/Documents/TP/TextToSpeech/" + formatter.format(new Date()) + ".mp3";
            try (FileOutputStream fos = new FileOutputStream(fileName)) {
                fos.write(audioBytes);
                System.out.println("✅ File saved as: " + fileName);
            }
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
        }

        return audioBytes;
    }
}


//        String ElevenlabsUrl = "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZz?output_format=mp3_44100_128";
//        HttpHeaders httpHeaders = new HttpHeaders();
//        httpHeaders.set("xi-api-key", "My-elevenlabs-api-key");
//        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
//        httpHeaders.setAccept(List.of(MediaType.ALL));
//
//        String requestJson = """
//            {
//              "text": "The first move is what sets everything in motion.",
//              "model_id": "eleven_multilingual_v1"
//            }
//            """;
//
//        HttpEntity<String> httpEntity = new HttpEntity<>(requestJson, httpHeaders);
//
//        ResponseEntity<byte[]> response = restTemplate.exchange(
//                ElevenlabsUrl,
//                HttpMethod.POST,
//                httpEntity,
//                byte[].class
//        );
//        byte[] audioBytes = response.getBody();
//        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH-mm-ss");
//        String formattedDate = formatter.format(new Date());
//
//        String path="C:/Users/HP/Documents/TP/TextToSpeech";
//        // Create file name with date
//        String fileName = path+formattedDate + ".mp3";
//
//        try {
//            FileOutputStream fos = new FileOutputStream(fileName);
//            fos.write(audioBytes);
//            fos.close();
//
//            System.out.println("File saved as: " + fileName);
//
//        } catch (IOException e) {
//            System.out.println(" Error writing file: " + e.getMessage());
//            e.printStackTrace();
//        }
//        return audioBytes;
//    }





// right code below
//        try {
//            // Actual API call using Unirest
//            HttpResponse<InputStream> response = Unirest.post("https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb?output_format=mp3_44100_128")
//                    .header("xi-api-key", elevenlabsApiKey)
//                    .header("Content-Type", "application/json")
//                    .body(String.format("{\n  \"text\": \"%s %s\",\n  \"model_id\": \"eleven_multilingual_v2\"\n}",
//                            journalEntry.getTitle(), journalEntry.getContent()))
//                    .asBinary();
//            if (response.getStatus() != 200) {
//                String errorMsg = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
//                System.out.println("Error: " + errorMsg);
//                return null;
//            }
//
//            // Read the binary response into a byte array
//            InputStream inputStream = response.getBody();
//            ByteArrayOutputStream byteOut = new ByteArrayOutputStream();
//            byte[] buffer = new byte[4096];
//            int bytesRead;
//
//            while ((bytesRead = inputStream.read(buffer)) != -1) {
//                byteOut.write(buffer, 0, bytesRead);
//            }
//
//            audioBytes = byteOut.toByteArray();
//
//            // Optional: Save to file with timestamp
//            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH-mm-ss");
//            String formattedDate = formatter.format(new Date());
//            String path = "C:/Users/HP/Documents/TP/TextToSpeech/";
//            String fileName = path + formattedDate + ".mp3";
//
//            try (FileOutputStream fos = new FileOutputStream(fileName)) {
//                fos.write(audioBytes);
//                System.out.println("✅ File saved as: " + fileName);
//            }
//
//        } catch (Exception e) {
//            System.out.println("❌ Error: " + e.getMessage());
//            e.printStackTrace();
//        }
//
//        return audioBytes;
//    }

//            // 1. API URL
//            String apiUrl = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL?output_format=mp3_44100_128";
//            URL url = new URL(apiUrl);
//            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
//
//            // 2. Set headers
//            conn.setRequestMethod("POST");
//            conn.setRequestProperty("xi-api-key", elevenlabsApiKey); // Replace with your key
//            conn.setRequestProperty("Content-Type", "application/json");
//            conn.setRequestProperty("Accept", "*/*");
//            conn.setDoOutput(true); // Enable sending request body
//
//            // 3. JSON body
//            String requestJson = String.format( """
//                {
//                  "text": " %s %s ",
//                  "model_id": "eleven_multilingual_v2"
//                }
//                """,journalEntry.getTitle(), journalEntry.getContent());

//            // 4. Send the JSON request
//            try (OutputStream os = conn.getOutputStream()) {
//                byte[] input = requestJson.getBytes("utf-8");
//                os.write(input, 0, input.length);
//            }
//
//            // 5. Read response (MP3 file)
//            try (InputStream inputStream = conn.getInputStream();
//                 ByteArrayOutputStream byteOut = new ByteArrayOutputStream()) {
//
//                byte[] buffer = new byte[4096];
//                int bytesRead;
//
//                while ((bytesRead = inputStream.read(buffer)) != -1) {
//                    byteOut.write(buffer, 0, bytesRead);
//                }
//
//                audioBytes = byteOut.toByteArray(); // Store in byte[]
//            }
//
//            // 6. Save to file with timestamp
//            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH-mm-ss");
//            String formattedDate = formatter.format(new Date());
//
//            String path = "C:/Users/HP/Documents/TP/TextToSpeech/";
//            String fileName = path + formattedDate + ".mp3";
//
//            try (FileOutputStream fos = new FileOutputStream(fileName)) {
//                fos.write(audioBytes);
//            }
//
//            System.out.println("✅ File saved as: " + fileName);
//
//            conn.disconnect(); // 7. Close connection
//
//        } catch (Exception e) {
//            System.out.println("❌ Error: " + e.getMessage());
//            e.printStackTrace();
//        }




        // 8. Prepare ResponseEntity with audio bytes

//        HttpHeaders httpHeaders=new HttpHeaders();
//        httpHeaders.setContentType(MediaType.valueOf("audio/mpeg"));
//        assert audioBytes != null;
//        httpHeaders.setContentLength(audioBytes.length);
//        httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "inline;filename='output.mp3'");
//
//        return audioBytes;
//    }

//}
