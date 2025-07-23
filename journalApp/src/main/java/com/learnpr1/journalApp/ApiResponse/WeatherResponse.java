package com.learnpr1.journalApp.ApiResponse;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;


@Getter
@Setter
public class WeatherResponse {
    // import com.fasterxml.jackson.databind.ObjectMapper; // version 2.11.1
// import com.fasterxml.jackson.annotation.JsonProperty; // version 2.11.1
/* ObjectMapper om = new ObjectMapper();
Root root = om.readValue(myJsonString, Root.class); */

    private Current current;  // this assumes the API returns an object like: { "current": { ... } }

    @Getter
    @Setter
    public static class Current {
        private int temperature;
        private ArrayList<String> weather_descriptions;
        private Astro astro;
        private AirQuality air_quality;
    }

    @Getter
    @Setter
    public static class Astro {
        private String sunrise;
        private String sunset;
    }

    @Getter
    @Setter
    public static class AirQuality {
        private String co;
        private String no2;
        private String o3;
        private String so2;
        private String pm2_5;
        private String pm10;
    }


}
