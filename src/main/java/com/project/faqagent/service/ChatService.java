package com.project.faqagent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.faqagent.ai.AiService;
import com.project.faqagent.model.dto.AskQuestionRequest;
import com.project.faqagent.model.dto.AskQuestionResponse;
import com.project.faqagent.model.entity.Conversation;
import com.project.faqagent.model.entity.Faq;
import com.project.faqagent.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final AiService aiService;
    private final FaqService faqService;
    private final ConversationRepository conversationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AskQuestionResponse askQuestion(AskQuestionRequest request) {
        List<Faq> allFaqs = faqService.getAllFaqEntities();
        
        // Fetch Conversation History
        List<com.project.faqagent.model.entity.Conversation> history = conversationRepository.findBySessionId(request.getSessionId());
        if (history == null) history = new ArrayList<>();
        
        // Step 1: Query Extraction using AI
        String searchKeywords = aiService.extractQuery(request.getQuestion(), history);
        System.out.println("AI Extracted Search Keywords: " + searchKeywords);
        
        // Step 2: Retrieve Relevant Context (Two-Step RAG)
        String queryToUse = searchKeywords.isEmpty() ? request.getQuestion() : searchKeywords;
        List<Faq> relevantFaqs = getTopRelevantFaqs(queryToUse, allFaqs, 15);
        
        // Check if any FAQ actually matches the question
        Set<String> questionWords = Arrays.stream(queryToUse.toLowerCase().split("[\\s\\p{Punct}]+"))
                .filter(w -> w.length() > 2).collect(Collectors.toSet());
        List<Faq> trulyRelevantFaqs = relevantFaqs.stream().filter(faq -> {
            long overlap = getOverlapScore(faq, questionWords);
            return questionWords.size() > 0 && ((double) overlap / questionWords.size()) >= 0.4;
        }).collect(Collectors.toList());
        
        String context;
        if (trulyRelevantFaqs.isEmpty()) {
            // No FAQ matches - send empty context so AI acts as general assistant
            context = "";
        } else {
            StringBuilder sb = new StringBuilder();
            for (Faq faq : trulyRelevantFaqs) {
                if ("ar".equalsIgnoreCase(request.getLanguage())) {
                    sb.append("Q: ").append(faq.getQuestionAr()).append(" A: ").append(faq.getAnswerAr()).append("\n");
                } else {
                    sb.append("Q: ").append(faq.getQuestionEn()).append(" A: ").append(faq.getAnswerEn()).append("\n");
                }
            }
            context = sb.toString();
        }
        
        // Step 3: Generate Final Answer
        String aiRawResponse = aiService.generateFinalAnswer(context, request.getQuestion(), history);
        System.out.println("AI Raw Response: " + aiRawResponse);
        
        boolean isEscalated = false;
        double confidenceScore = 0.0;
        String finalAnswer = "";
        List<String> followUps = new ArrayList<>();
        boolean usedFaq = false;
        
        try {
            int startIndex = aiRawResponse.indexOf("{");
            int endIndex = aiRawResponse.lastIndexOf("}");
            if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
                aiRawResponse = aiRawResponse.substring(startIndex, endIndex + 1);
            }
            aiRawResponse = aiRawResponse.trim();
            JsonNode rootNode;
            
            if (!aiRawResponse.startsWith("{")) {
                // AI hallucinated plain text instead of JSON
                finalAnswer = aiRawResponse;
                confidenceScore = 0.9;
                usedFaq = false;
                
                // Construct a fake rootNode for subsequent logic
                com.fasterxml.jackson.databind.node.ObjectNode node = objectMapper.createObjectNode();
                node.put("answer", finalAnswer);
                node.put("confidence_score", confidenceScore);
                node.put("used_faq", usedFaq);
                rootNode = node;
            } else {
                rootNode = objectMapper.readTree(aiRawResponse);
                finalAnswer = rootNode.path("answer").asText();
                confidenceScore = rootNode.path("confidence_score").asDouble();
                
                if (rootNode.has("used_faq")) {
                    usedFaq = rootNode.path("used_faq").asBoolean();
                }
                
                JsonNode followUpsNode = rootNode.path("follow_ups");
                if (followUpsNode.isArray()) {
                    for (JsonNode node : followUpsNode) {
                        followUps.add(node.asText());
                    }
                }
            }
            
            if ("admin".equalsIgnoreCase(request.getRole()) && !usedFaq) {
                isEscalated = true;
                confidenceScore = 0.1;
                if ("ar".equalsIgnoreCase(request.getLanguage())) {
                    finalAnswer = "عذراً، هذا السؤال غير متوفر في قاعدة البيانات حالياً.";
                } else {
                    finalAnswer = "Sorry, this question is not available in the database at the moment.";
                }
            } else if ("UNABLE".equals(finalAnswer) || confidenceScore < 0.5) {
                isEscalated = true;
                if ("ar".equalsIgnoreCase(request.getLanguage())) {
                    finalAnswer = "عذراً، لم أتمكن من العثور على إجابة دقيقة لطلبك. سيتم تحويل سؤالك للدعم البشري.";
                } else {
                    finalAnswer = "Sorry, I could not find a confident answer. Your question will be escalated to human support.";
                }
            } else if (!usedFaq && rootNode.has("hidden_db_save") && !rootNode.path("hidden_db_save").isNull()) {
                // Self-learning: Auto-save general knowledge to FAQ DB
                JsonNode hiddenDb = rootNode.path("hidden_db_save");
                String qAr = hiddenDb.path("q_ar").asText();
                String aAr = hiddenDb.path("a_ar").asText();
                String qEn = hiddenDb.path("q_en").asText();
                String aEn = hiddenDb.path("a_en").asText();
                
                if (qAr != null && !qAr.isEmpty() && aAr != null && !aAr.isEmpty()) {
                    // Prevent duplicates
                    boolean exists = allFaqs.stream().anyMatch(f -> 
                        (f.getQuestionAr() != null && f.getQuestionAr().contains(qAr)) ||
                        (f.getQuestionEn() != null && f.getQuestionEn().equalsIgnoreCase(qEn))
                    );
                    
                    if (!exists) {
                        com.project.faqagent.model.dto.FaqDto newFaqDto = new com.project.faqagent.model.dto.FaqDto();
                        newFaqDto.setQuestionAr(qAr);
                        newFaqDto.setAnswerAr(aAr);
                        newFaqDto.setQuestionEn(qEn != null && !qEn.isEmpty() ? qEn : qAr);
                        newFaqDto.setAnswerEn(aEn != null && !aEn.isEmpty() ? aEn : aAr);
                        newFaqDto.setStatus("ACTIVE");
                        
                        try {
                            newFaqDto.setCategoryId(1L);
                            faqService.createFaq(newFaqDto);
                        } catch (Exception catEx) {
                            System.err.println("Failed to auto-save FAQ due to category issue: " + catEx.getMessage());
                        }
                    }
                }
            }
            
            // Programmatic safety check: Force usedFaq = true if the question highly overlaps with an existing FAQ
            if (!usedFaq) {
                Set<String> qWords = Arrays.stream(request.getQuestion().toLowerCase().split("[\\s\\p{Punct}]+"))
                        .filter(w -> w.length() > 2).collect(Collectors.toSet());
                for (Faq f : allFaqs) {
                    long overlap = getOverlapScore(f, qWords);
                    if (qWords.size() > 0 && ((double) overlap / qWords.size()) >= 0.7) {
                        usedFaq = true;
                        break;
                    }
                }
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed AI Raw Response: " + aiRawResponse);
            isEscalated = true;
            confidenceScore = 0.0;
            if ("ar".equalsIgnoreCase(request.getLanguage())) {
                finalAnswer = "عذراً، حدث خطأ في تحليل الإجابة. السبب: " + e.getMessage() + "\nالرد: " + (aiRawResponse.length() > 100 ? aiRawResponse.substring(0, 100) + "..." : aiRawResponse);
            } else {
                finalAnswer = "Sorry, an error occurred analyzing the answer. Escalated to human support. Error: " + e.getMessage();
            }
        }
        
        AskQuestionResponse response = new AskQuestionResponse();
        response.setAnswer(finalAnswer);
        response.setConfidenceScore(confidenceScore);
        response.setEscalated(isEscalated);
        response.setSuggestedFollowUps(followUps);

        Conversation conversation = new Conversation();
        conversation.setSessionId(request.getSessionId());
        conversation.setLanguage(request.getLanguage());
        conversation.setUserQuestion(request.getQuestion());
        conversation.setAiResponse(finalAnswer);
        conversation.setConfidenceScore(confidenceScore);
        conversation.setEscalated(isEscalated);
        conversation.setAnsweredFromFaq(usedFaq);
        conversationRepository.save(conversation);
        
        return response;
    }

    private List<Faq> getTopRelevantFaqs(String userQuestion, List<Faq> allFaqs, int limit) {
        Set<String> queryWords = Arrays.stream(userQuestion.toLowerCase().split("[\\s\\p{Punct}]+"))
                .filter(w -> w.length() > 2)
                .collect(Collectors.toSet());
        
        if (queryWords.isEmpty()) {
            return allFaqs.stream().limit(limit).collect(Collectors.toList());
        }

        return allFaqs.stream()
                .sorted((f1, f2) -> {
                    long score2 = getOverlapScore(f2, queryWords);
                    long score1 = getOverlapScore(f1, queryWords);
                    return Long.compare(score2, score1);
                })
                .limit(limit)
                .collect(Collectors.toList());
    }

    private long getOverlapScore(Faq faq, Set<String> queryWords) {
        String text = (faq.getQuestionAr() + " " + faq.getAnswerAr() + " " + faq.getQuestionEn() + " " + faq.getAnswerEn()).toLowerCase();
        Set<String> faqWords = Arrays.stream(text.split("[\\s\\p{Punct}]+")).collect(Collectors.toSet());
        return queryWords.stream().filter(faqWords::contains).count();
    }

    public List<Conversation> getConversations(String sessionId) {
        return conversationRepository.findBySessionId(sessionId);
    }
    
    public List<Conversation> getAllConversations() {
        return conversationRepository.findAll();
    }
    
    public List<Conversation> getEscalatedConversations() {
        return conversationRepository.findByIsEscalatedTrue();
    }
    
    public void deleteConversation(Long id) {
        conversationRepository.deleteById(id);
    }
    
    public List<com.project.faqagent.model.dto.SessionDto> getAllSessions() {
        List<Conversation> allConvs = conversationRepository.findAll();
        java.util.Map<String, List<Conversation>> grouped = allConvs.stream()
            .filter(c -> c.getSessionId() != null)
            .collect(Collectors.groupingBy(Conversation::getSessionId));
            
        List<com.project.faqagent.model.dto.SessionDto> sessions = new ArrayList<>();
        for (java.util.Map.Entry<String, List<Conversation>> entry : grouped.entrySet()) {
            List<Conversation> list = entry.getValue();
            list.sort(java.util.Comparator.comparing(Conversation::getCreatedAt));
            
            com.project.faqagent.model.dto.SessionDto dto = new com.project.faqagent.model.dto.SessionDto();
            dto.setSessionId(entry.getKey());
            dto.setFirstMessage(list.get(0).getUserQuestion());
            dto.setUpdatedAt(list.get(list.size() - 1).getCreatedAt());
            dto.setMessageCount(list.size());
            sessions.add(dto);
        }
        
        sessions.sort((s1, s2) -> s2.getUpdatedAt().compareTo(s1.getUpdatedAt()));
        return sessions;
    }
    
    public void deleteSession(String sessionId) {
        conversationRepository.deleteBySessionId(sessionId);
    }
}
