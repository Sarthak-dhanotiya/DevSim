package com.virtualcompany.modules.github;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import com.virtualcompany.common.exception.BadRequestException;
import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class GithubClient {
    private final RestClient client;
    public GithubClient(){var factory=new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());factory.setReadTimeout(Duration.ofSeconds(30));client=RestClient.builder().requestFactory(factory).build();}
    public JsonNode call(String token,String method,String path,Object body){
        if(!path.startsWith("/")||path.contains("..")||path.contains("://"))throw new BadRequestException("Invalid GitHub API path");
        try {var req=client.method(org.springframework.http.HttpMethod.valueOf(method)).uri("https://api.github.com"+path).header("Authorization","Bearer "+token).header("Accept","application/vnd.github+json").header("X-GitHub-Api-Version","2022-11-28");if(body!=null)req.contentType(org.springframework.http.MediaType.APPLICATION_JSON).body(body);return req.retrieve().body(JsonNode.class);}
        catch(RestClientResponseException e){throw new BadRequestException(switch(e.getStatusCode().value()){case 401 -> "GitHub authorization expired. Disconnect and reconnect.";case 403,429 -> "GitHub permissions or rate limit prevented this action. Check app access and retry later.";case 404 -> "GitHub repository was not found or is not accessible.";case 422 -> "GitHub rejected the repository or PR settings. Check the name, template and branches.";default -> "GitHub is temporarily unavailable. Retry later.";});}
    }
    public JsonNode exchange(Object body){try{return client.post().uri("https://github.com/login/oauth/access_token").header("Accept","application/json").contentType(org.springframework.http.MediaType.APPLICATION_JSON).body(body).retrieve().body(JsonNode.class);}catch(Exception e){throw new BadRequestException("GitHub OAuth exchange failed. Try connecting again.");}}
}
