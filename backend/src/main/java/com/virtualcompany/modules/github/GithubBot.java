package com.virtualcompany.modules.github;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.*;

@Service
public class GithubBot {
    private final GithubClient github;private final ObjectMapper json;
    @Value("${github.bot-token:}") private String fallback;
    @Value("${github.app-id:}") private String appId;
    @Value("${github.private-key-file:}") private String keyFile;
    public GithubBot(GithubClient github,ObjectMapper json){this.github=github;this.json=json;}
    public record Credentials(String token,String login){}
    public boolean configured(){return !fallback.isBlank()||!appId.isBlank()&&!keyFile.isBlank();}
    public Credentials credentials(String repo)throws Exception {
        if(!appId.isBlank()&&!keyFile.isBlank()){
            String pem=Files.readString(Path.of(keyFile)).replaceAll("-----[^-]+-----","").replaceAll("\\s","");
            var key=KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pem)));
            long now=Instant.now().getEpochSecond();String payload=encode(json.writeValueAsBytes(Map.of("iat",now-60,"exp",now+540,"iss",appId)));String signed=encode("{\"alg\":\"RS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8))+"."+payload;
            Signature signature=Signature.getInstance("SHA256withRSA");signature.initSign(key);signature.update(signed.getBytes(StandardCharsets.UTF_8));String jwt=signed+"."+encode(signature.sign());
            var app=github.call(jwt,"GET","/app",null);var installation=github.call(jwt,"GET","/repos/"+repo+"/installation",null);
            var token=github.call(jwt,"POST","/app/installations/"+installation.path("id").asText()+"/access_tokens",Map.of("repositories",List.of(repo.split("/")[1])));
            return new Credentials(token.path("token").asText(),app.path("slug").asText()+"[bot]");
        }
        var me=github.call(fallback,"GET","/user",null);return new Credentials(fallback,me.path("login").asText());
    }
    private static String encode(byte[] b){return Base64.getUrlEncoder().withoutPadding().encodeToString(b);}
}
