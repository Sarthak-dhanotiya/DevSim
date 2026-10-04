package com.virtualcompany.modules.journey;
import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.common.exception.BadRequestException;
import com.virtualcompany.common.security.UserPrincipal;
import com.virtualcompany.common.service.EmailService;
import com.virtualcompany.modules.github.GithubCrypto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import java.util.*;
import java.security.SecureRandom;

@RestController @RequestMapping("/api/v1/journey/email") @RequiredArgsConstructor
public class RegistrationVerification {
 private final JdbcTemplate db;private final EmailService mail;private final PlatformTransactionManager transactions;
 @GetMapping public Object status(@AuthenticationPrincipal UserPrincipal user){return ApiResponse.ok(Map.of("verified",verified(user.getId())));}
 public boolean verified(UUID user){return Boolean.TRUE.equals(db.queryForObject("select email_verified from users where id=?",Boolean.class,user));}
 public void requireVerified(UUID user){if(!verified(user))throw new BadRequestException("Verify your email before creating your workspace.");}
 @PostMapping("/send") public Object send(@AuthenticationPrincipal UserPrincipal user){
   String code=new TransactionTemplate(transactions).execute(tx->{db.queryForList("select id from users where id=? for update",user.getId());if(verified(user.getId()))return null;
     if(db.queryForObject("select count(*) from registration_verifications where user_id=? and sent_at>now()-interval '60 seconds'",Integer.class,user.getId())>0)throw new BadRequestException("Wait 60 seconds before requesting another code.");
     String value=String.format("%06d",new SecureRandom().nextInt(1000000));db.update("insert into registration_verifications values(?,?,now()+interval '10 minutes',now(),0) on conflict(user_id) do update set code_hash=excluded.code_hash,expires_at=excluded.expires_at,sent_at=excluded.sent_at,attempts=0",user.getId(),GithubCrypto.hash(user.getId()+":"+value));return value;});
   if(code!=null)mail.sendRegistrationVerification(user.getEmail(),code);return ApiResponse.ok(Map.of("message","Verification email requested. Check your inbox or spam. If it does not arrive, check the server email configuration."));
 }
 public record VerifyRequest(String code){}
 @PostMapping("/verify") public Object verify(@AuthenticationPrincipal UserPrincipal user,@RequestBody VerifyRequest body){
   if(body.code()==null||!body.code().matches("[0-9]{6}"))throw new BadRequestException("Enter the six-digit verification code.");
   Boolean valid=new TransactionTemplate(transactions).execute(tx->{db.queryForList("select id from users where id=? for update",user.getId());if(verified(user.getId()))return true;
     var rows=db.queryForList("update registration_verifications set attempts=attempts+1 where user_id=? and attempts<5 and expires_at>now() returning code_hash",user.getId());if(rows.isEmpty()||!java.security.MessageDigest.isEqual(rows.getFirst().get("code_hash").toString().getBytes(java.nio.charset.StandardCharsets.UTF_8),GithubCrypto.hash(user.getId()+":"+body.code()).getBytes(java.nio.charset.StandardCharsets.UTF_8)))return false;
     db.update("update users set email_verified=true where id=?",user.getId());db.update("delete from registration_verifications where user_id=?",user.getId());return true;});
   if(!Boolean.TRUE.equals(valid))throw new BadRequestException("Code invalid, expired or too many attempts. Request a new code.");return ApiResponse.ok(Map.of("verified",true));
 }
}
