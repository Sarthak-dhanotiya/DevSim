package com.virtualcompany.modules.github;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.common.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.*;

@RestController
@RequestMapping("/api/v1/github")
@RequiredArgsConstructor
public class GithubController {
    private final GithubService service;
    private final GithubJobs jobs;
    public record Callback(@NotBlank String code,@NotBlank String state){}
    @GetMapping("/account") public Object account(@AuthenticationPrincipal UserPrincipal u){return ApiResponse.ok(service.account(u.getId()));}
    @GetMapping("/auth-url") public Object url(@AuthenticationPrincipal UserPrincipal u){return ApiResponse.ok(service.authUrl(u.getId()));}
    @PostMapping("/callback") public Object callback(@AuthenticationPrincipal UserPrincipal u,@Valid @RequestBody Callback c){service.connect(u.getId(),c.code(),c.state());return ApiResponse.ok(service.account(u.getId()));}
    @DeleteMapping("/disconnect") public Object disconnect(@AuthenticationPrincipal UserPrincipal u){service.disconnect(u.getId());return ApiResponse.ok(Map.of("disconnected",true));}
    @PostMapping("/projects/{id}/provision-repo") public Object provision(@AuthenticationPrincipal UserPrincipal u,@PathVariable UUID id){return ApiResponse.ok(service.provision(u.getId(),id));}
    @PostMapping("/projects/{id}/setup") public Object setup(@AuthenticationPrincipal UserPrincipal u,@PathVariable UUID id){return ApiResponse.ok(service.finishSetup(u.getId(),id));}
    @GetMapping("/projects/{id}") public Object workspace(@AuthenticationPrincipal UserPrincipal u,@PathVariable UUID id){return ApiResponse.ok(service.workspace(u.getId(),id));}
    @PostMapping("/projects/{id}/sync") public Object sync(@AuthenticationPrincipal UserPrincipal u,@PathVariable UUID id){return ApiResponse.ok(service.sync(u.getId(),id));}
    @GetMapping("/portfolio") public Object portfolio(@AuthenticationPrincipal UserPrincipal u){return ApiResponse.ok(service.portfolio(u.getId()));}
    @GetMapping("/portfolio/{user}") public Object publicPortfolio(@PathVariable UUID user){return ApiResponse.ok(service.publicPortfolio(user));}
    @PostMapping("/webhook") public Object webhook(@RequestBody byte[] body,@RequestHeader(value="X-Hub-Signature-256",required=false) String signature,@RequestHeader(value="X-GitHub-Delivery",required=false) String delivery,@RequestHeader(value="X-GitHub-Event",defaultValue="") String event){jobs.enqueue(body,signature,delivery,event);return org.springframework.http.ResponseEntity.accepted().body(Map.of("received",true));}
}
