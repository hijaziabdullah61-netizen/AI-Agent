package com.project.faqagent.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${ai.deepseek.base-url}")
    private String baseUrl;
    
    @Value("${ai.deepseek.model}")
    private String model;

    @Value("${ai.deepseek.api-key}")
    private String apiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private byte[] callDeepSeekApi(String systemPrompt, String userMessage, List<com.project.faqagent.model.entity.Conversation> history) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/json; charset=utf-8"));
        headers.setBearerAuth(apiKey);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        
        List<Map<String, String>> messages = new ArrayList<>();
        
        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);
        
        if (history != null) {
            for (com.project.faqagent.model.entity.Conversation conv : history) {
                Map<String, String> hUser = new HashMap<>();
                hUser.put("role", "user");
                hUser.put("content", conv.getUserQuestion());
                messages.add(hUser);
                
                Map<String, String> hAsst = new HashMap<>();
                hAsst.put("role", "assistant");
                hAsst.put("content", conv.getAiResponse());
                messages.add(hAsst);
            }
        }
        
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);
        
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.3);
        requestBody.put("response_format", Map.of("type", "json_object"));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            byte[] responseBytes = null;
            int maxRetries = 3;
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    responseBytes = restTemplate.postForObject(baseUrl, entity, byte[].class);
                    break; // Success, exit retry loop
                } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e429) {
                    System.err.println("Rate limited (429), attempt " + attempt + "/" + maxRetries + ". Retrying in 3s...");
                    if (attempt == maxRetries) throw e429;
                    try { Thread.sleep(3000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                } catch (org.springframework.web.client.HttpServerErrorException e5xx) {
                    System.err.println("Server error (5xx), attempt " + attempt + "/" + maxRetries + ". Retrying in 2s...");
                    if (attempt == maxRetries) throw e5xx;
                    try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                }
            }
            JsonNode root = objectMapper.readTree(responseBytes);
            return root.path("choices").get(0).path("message").path("content").asText().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to call DeepSeek API: " + e.getMessage());
            return "{}".getBytes();
        }
    }

    public String extractQuery(String userMessage, List<com.project.faqagent.model.entity.Conversation> history) {
        String prompt = "Extract the main search query or keywords from the user's message. " +
                "If it's a follow-up or translation request, look at the conversation history to know what they are referring to. " +
                "You MUST return ONLY a valid JSON object with a single key 'keywords'. Example: {\"keywords\": \"your extracted keywords\"}. If it's just greetings, return empty string for keywords.";
        byte[] responseBytes = callDeepSeekApi(prompt, userMessage, history);
        try {
            JsonNode root = objectMapper.readTree(responseBytes);
            return root.path("keywords").asText("").trim();
        } catch (Exception e) {
            return userMessage;
        }
    }

    public String generateFinalAnswer(String context, String userQuestion, List<com.project.faqagent.model.entity.Conversation> history) {
        String systemPrompt;
        
        if (context == null || context.trim().isEmpty()) {
            systemPrompt = "You are a highly knowledgeable, general AI Assistant.\n" +
                    "Answer the user's question directly, confidently, and comprehensively using your world knowledge.\n" +
                    "DO NOT apologize. DO NOT mention any database or context. DO NOT say you are an AI.\n" +
                    "Rule 1: Always answer in the exact same language the user wrote in.\n" +
                    "Rule 2: You MUST populate 'hidden_db_save' with your generated Question and Answer translated to both Arabic and English.\n" +
                    "Respond ONLY with a valid JSON object in the following format. Do NOT include markdown blocks like ```json.\n" +
                    "{\n" +
                    "  \"answer\": \"Your detailed answer here\",\n" +
                    "  \"confidence_score\": 0.95,\n" +
                    "  \"used_faq\": false,\n" +
                    "  \"hidden_db_save\": {\n" +
                    "    \"q_ar\": \"...\", \"a_ar\": \"...\", \"q_en\": \"...\", \"a_en\": \"...\"\n" +
                    "  },\n" +
                    "  \"follow_ups\": [\"follow up 1\", \"follow up 2\"]\n" +
                    "}\n";
        } else {
            systemPrompt = "You are a highly knowledgeable AI Assistant.\n" +
                    "You are provided with a 'Context' containing FAQs for a specific business.\n" +
                    "Rule 1: Answer the user's question using ONLY the provided context, and set 'used_faq': true.\n" +
                    "Rule 2: If the context doesn't answer the question, answer it using your general knowledge directly. DO NOT mention the database or context. Set 'used_faq': false, and populate 'hidden_db_save'.\n" +
                    "Rule 3: ALWAYS answer in the exact same language the user wrote in.\n" +
                    "Respond ONLY with a valid JSON object in the following format. Do NOT include markdown blocks like ```json.\n" +
                    "{\n" +
                    "  \"answer\": \"Your detailed answer here\",\n" +
                    "  \"confidence_score\": 0.95,\n" +
                    "  \"used_faq\": true,\n" +
                    "  \"hidden_db_save\": null,\n" +
                    "  \"follow_ups\": [\"follow up 1\", \"follow up 2\"]\n" +
                    "}\n";
        }
        
        String finalPrompt;
        if (context != null && !context.trim().isEmpty()) {
            finalPrompt = systemPrompt + "\nContext:\n" + context;
        } else {
            finalPrompt = systemPrompt;
        }

        byte[] responseBytes = callDeepSeekApi(finalPrompt, userQuestion, history);
        return new String(responseBytes, java.nio.charset.StandardCharsets.UTF_8);
    }
}
