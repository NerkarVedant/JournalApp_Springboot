package com.learnpr1.journalApp.service;

import com.learnpr1.journalApp.ApiResponse.WeatherResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

@Service
@Component
public class ExternalApiService {

    @Autowired
    private RestTemplate restTemplate;  //Class in spring which processes http requests and gives responses

    @Value("${weather.api.key}")
    private String weatherApiKey; // Injected from application.properties
    private static final String API_URL="http://api.weatherstack.com/current?access_key=API_key&query=City_name";

    public ExternalApiService() throws IOException {
    }

    public WeatherResponse getWeather(String cityName) {
        String finalAPI = API_URL.replace("API_key", weatherApiKey)
                                 .replace("City_name", cityName);
        ResponseEntity<WeatherResponse> response = restTemplate.exchange(finalAPI, HttpMethod.GET, null, WeatherResponse.class);
        WeatherResponse body = response.getBody();
        return body;

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

    @Value("${elevenlabs.api.key}")
    String elevenlabsApiKey; // Replace with your ElevenLabs API key
    public ResponseEntity<byte[]> generateSpeechFile() {
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
        byte[] audioBytes = null;


        try {
            // 1. API URL
            String apiUrl = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM?output_format=mp3_44100_128";
            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();

            // 2. Set headers
            conn.setRequestMethod("POST");
            conn.setRequestProperty("xi-api-key", elevenlabsApiKey); // Replace with your key
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "*/*");
            conn.setDoOutput(true); // Enable sending request body

            // 3. JSON body
            String requestJson = """
                {
                  "text": "The first move is what sets everything in motion.",
                  "model_id": "eleven_multilingual_v1"
                }
                """;

            // 4. Send the JSON request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = requestJson.getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            // 5. Read response (MP3 file)
            try (InputStream inputStream = conn.getInputStream();
                 ByteArrayOutputStream byteOut = new ByteArrayOutputStream()) {

                byte[] buffer = new byte[4096];
                int bytesRead;

                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    byteOut.write(buffer, 0, bytesRead);
                }

                audioBytes = byteOut.toByteArray(); // Store in byte[]
            }

            // 6. Save to file with timestamp
            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH-mm-ss");
            String formattedDate = formatter.format(new Date());

            String path = "C:/Users/HP/Documents/TP/TextToSpeech/";
            String fileName = path + formattedDate + ".mp3";

            try (FileOutputStream fos = new FileOutputStream(fileName)) {
                fos.write(audioBytes);
            }

            System.out.println("✅ File saved as: " + fileName);

            conn.disconnect(); // 7. Close connection

        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
        }

        HttpHeaders httpHeaders=new HttpHeaders();
        httpHeaders.setContentType(MediaType.valueOf("audio/mpeg"));
        assert audioBytes != null;
        httpHeaders.setContentLength(audioBytes.length);
        httpHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "inline;filename='output.mp3'");

        return new ResponseEntity<>(audioBytes,httpHeaders,HttpStatus.OK);
    }

}
