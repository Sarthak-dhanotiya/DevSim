package com.virtualcompany.modules.journey;
import com.virtualcompany.common.security.UserPrincipal;
import com.virtualcompany.common.service.EmailService;
import com.virtualcompany.common.exception.BadRequestException;
import com.virtualcompany.modules.github.GithubCrypto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.*;
import org.junit.jupiter.api.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class RegistrationVerificationTest {
 JdbcTemplate db=mock(JdbcTemplate.class);EmailService mail=mock(EmailService.class);PlatformTransactionManager tx=mock(PlatformTransactionManager.class);UserPrincipal user=mock(UserPrincipal.class);UUID id=UUID.randomUUID();RegistrationVerification service=new RegistrationVerification(db,mail,tx);
 @BeforeEach void setup(){when(user.getId()).thenReturn(id);when(tx.getTransaction(any())).thenReturn(mock(TransactionStatus.class));when(db.queryForObject(contains("email_verified"),eq(Boolean.class),eq(id))).thenReturn(false);}
 @Test void badCodeFormatNeverQueriesOrSendsMail(){assertThrows(BadRequestException.class,()->service.verify(user,new RegistrationVerification.VerifyRequest("abc")));verifyNoInteractions(db,mail,tx);}
 @Test void incorrectCodeCommitsAttemptBeforeRejecting(){when(db.queryForList(contains("returning code_hash"),eq(id))).thenReturn(List.of(Map.of("code_hash",GithubCrypto.hash(id+":123456"))));assertThrows(BadRequestException.class,()->service.verify(user,new RegistrationVerification.VerifyRequest("000000")));verify(tx).commit(any());verify(db,never()).update(contains("email_verified=true"),any(UUID.class));verifyNoInteractions(mail);}
 @Test void correctCodeVerifiesOnlyCurrentUserAndConsumesChallenge(){when(db.queryForList(contains("returning code_hash"),eq(id))).thenReturn(List.of(Map.of("code_hash",GithubCrypto.hash(id+":123456"))));service.verify(user,new RegistrationVerification.VerifyRequest("123456"));verify(db).update("update users set email_verified=true where id=?",id);verify(db).update("delete from registration_verifications where user_id=?",id);verify(tx).commit(any());}
 @Test void unverifiedAccountCannotFinish(){assertThrows(BadRequestException.class,()->service.requireVerified(id));verifyNoInteractions(mail);}
}
