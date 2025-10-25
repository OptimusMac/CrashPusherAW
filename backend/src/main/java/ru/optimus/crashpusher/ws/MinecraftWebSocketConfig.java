package ru.optimus.crashpusher.ws;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.springframework.context.annotation.Bean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;
import ru.optimus.crashpusher.service.LogService;

import java.util.*;

@Configuration
@EnableWebSocket
public class MinecraftWebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new MinecraftWebSocketHandler(), "/minecraft-server")
                .setAllowedOriginPatterns("*");
    }
}