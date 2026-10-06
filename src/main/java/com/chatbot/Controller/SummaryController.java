package com.chatbot.Controller;
import com.chatbot.Services.SummaryService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SummaryController {

    private SummaryService summaryService;

    public SummaryController(SummaryService summaryService){
        this.summaryService=summaryService;
    }

    @PostMapping("/chat")
    public String summarize(@RequestBody String ticket){
        return summaryService.summarize(ticket);
    }
}
