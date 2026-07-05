package com.project.faqagent.service;

import com.project.faqagent.exception.ResourceNotFoundException;
import com.project.faqagent.model.dto.FaqDto;
import com.project.faqagent.model.dto.FollowUpDto;
import com.project.faqagent.model.entity.Category;
import com.project.faqagent.model.entity.Faq;
import com.project.faqagent.model.entity.FollowUp;
import com.project.faqagent.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FaqService {

    private final FaqRepository faqRepository;
    private final CategoryService categoryService;

    public List<FaqDto> getAllFaqs() {
        return faqRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<FaqDto> getFaqsByCategory(Long categoryId) {
        return faqRepository.findByCategoryId(categoryId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public FaqDto createFaq(FaqDto dto) {
        Faq faq = new Faq();
        updateEntityFromDto(faq, dto);
        Faq saved = faqRepository.save(faq);
        return mapToDto(saved);
    }

    @Transactional
    public FaqDto updateFaq(Long id, FaqDto dto) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ not found"));
        
        if (faq.getFollowUps() != null) {
            faq.getFollowUps().clear();
        }
        updateEntityFromDto(faq, dto);
        
        Faq updated = faqRepository.save(faq);
        return mapToDto(updated);
    }

    public void deleteFaq(Long id) {
        faqRepository.deleteById(id);
    }

    private void updateEntityFromDto(Faq faq, FaqDto dto) {
        faq.setQuestionAr(dto.getQuestionAr());
        faq.setQuestionEn(dto.getQuestionEn());
        faq.setAnswerAr(dto.getAnswerAr());
        faq.setAnswerEn(dto.getAnswerEn());
        faq.setStatus(dto.getStatus());
        
        Category category = categoryService.getCategoryEntity(dto.getCategoryId());
        faq.setCategory(category);
        
        if (dto.getFollowUps() != null) {
            List<FollowUp> followUps = dto.getFollowUps().stream().map(fDto -> {
                FollowUp f = new FollowUp();
                f.setQuestionAr(fDto.getQuestionAr());
                f.setQuestionEn(fDto.getQuestionEn());
                f.setFaq(faq);
                return f;
            }).collect(Collectors.toList());
            
            if (faq.getFollowUps() == null) {
                faq.setFollowUps(followUps);
            } else {
                faq.getFollowUps().addAll(followUps);
            }
        }
    }

    public FaqDto mapToDto(Faq faq) {
        FaqDto dto = new FaqDto();
        dto.setId(faq.getId());
        dto.setQuestionAr(faq.getQuestionAr());
        dto.setQuestionEn(faq.getQuestionEn());
        dto.setAnswerAr(faq.getAnswerAr());
        dto.setAnswerEn(faq.getAnswerEn());
        dto.setStatus(faq.getStatus());
        if (faq.getCategory() != null) {
            dto.setCategoryId(faq.getCategory().getId());
            dto.setCategoryNameAr(faq.getCategory().getNameAr());
            dto.setCategoryNameEn(faq.getCategory().getNameEn());
        }
        
        if (faq.getFollowUps() != null) {
            dto.setFollowUps(faq.getFollowUps().stream().map(f -> {
                FollowUpDto fd = new FollowUpDto();
                fd.setId(f.getId());
                fd.setQuestionAr(f.getQuestionAr());
                fd.setQuestionEn(f.getQuestionEn());
                return fd;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
    
    // For AI Context
    public List<Faq> getAllFaqEntities() {
        return faqRepository.findAll();
    }
}
