package com.project.faqagent.controller;

import com.project.faqagent.model.dto.AskQuestionRequest;
import com.project.faqagent.model.dto.AskQuestionResponse;
import com.project.faqagent.model.entity.Conversation;
import com.project.faqagent.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/ask")
    public AskQuestionResponse askQuestion(@RequestBody AskQuestionRequest request) {
        return chatService.askQuestion(request);
    }
    
    @GetMapping("/history/{sessionId}")
    public List<Conversation> getHistory(@PathVariable String sessionId) {
        return chatService.getConversations(sessionId);
    }
    
    @GetMapping("/history/all")
    public List<Conversation> getAllHistory() {
        return chatService.getAllConversations();
    }
    
    @GetMapping("/sessions")
    public List<com.project.faqagent.model.dto.SessionDto> getAllSessions() {
        return chatService.getAllSessions();
    }

    @DeleteMapping("/sessions/{sessionId}")
    public void deleteSession(@PathVariable String sessionId) {
        chatService.deleteSession(sessionId);
    }
    
    @GetMapping("/escalated")
    public List<Conversation> getEscalated() {
        return chatService.getEscalatedConversations();
    }
    
    @DeleteMapping("/history/{id}")
    public void deleteConversation(@PathVariable Long id) {
        chatService.deleteConversation(id);
    }
}
