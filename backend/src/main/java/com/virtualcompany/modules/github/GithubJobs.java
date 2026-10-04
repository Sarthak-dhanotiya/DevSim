package com.virtualcompany.modules.github;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.virtualcompany.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@EnableScheduling
@RequiredArgsConstructor
public class GithubJobs {
    private final JdbcTemplate db;private final GithubService service;private final ObjectMapper json;
    @Value("${github.webhook-secret:}") private String secret;
    public void enqueue(byte[] payload,String signature,String delivery,String event){
        if(!GithubCrypto.validSignature(payload,signature,secret))throw new org.springframework.security.access.AccessDeniedException("Invalid GitHub webhook signature");
        if(delivery==null||!delivery.matches("[A-Za-z0-9-]{1,100}"))throw new BadRequestException("Invalid webhook delivery id");
        if(!List.of("pull_request","push").contains(event))return;
        if(payload.length>1000000)throw new BadRequestException("Webhook payload too large");
        try{String repo=json.readTree(payload).path("repository").path("full_name").asText();if(db.queryForObject("select count(*) from student_project_enrollments where github_repo_name=?",Integer.class,repo)==0)return;}catch(java.io.IOException e){throw new BadRequestException("Invalid webhook payload");}
        db.update("insert into github_webhook_jobs(delivery_id,payload) values(?,?) on conflict do nothing",delivery,new String(payload,StandardCharsets.UTF_8));
    }
    @Scheduled(fixedDelay=10000) public void process(){
        for(var job:db.queryForList("select delivery_id,payload from github_webhook_jobs where not processed and attempts<5 and available_at<=now() order by available_at limit 2")){
            String id=job.get("delivery_id").toString();if(db.update("update github_webhook_jobs set attempts=attempts+1,available_at=now()+interval '2 minutes' where delivery_id=? and available_at<=now()",id)!=1)continue;
            try{service.processWebhook(job.get("payload").toString());db.update("update github_webhook_jobs set processed=true,payload='{}' where delivery_id=?",id);}catch(Exception e){/* Persisted job retries without exposing tokens or payloads in logs. */}
        }
        db.update("delete from github_webhook_jobs where processed and available_at<now()-interval '7 days'");
    }
}
