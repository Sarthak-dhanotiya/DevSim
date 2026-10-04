package com.virtualcompany.modules.github;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
class GithubSecurityTest {
 @Test void encryptionAuthenticatesCiphertext(){var c=new GithubCrypto(Base64.getEncoder().encodeToString(new byte[32]));String token="synthetic-github-token";String a=c.encrypt(token),b=c.encrypt(token);assertNotEquals(a,b);assertFalse(a.contains(token));assertEquals(token,c.decrypt(a));String[] parts=a.split(":");byte[] data=Base64.getDecoder().decode(parts[1]);data[0]^=1;assertThrows(IllegalStateException.class,()->c.decrypt(parts[0]+":"+Base64.getEncoder().encodeToString(data)));}
 @Test void missingEncryptionKeyFailsClosed(){assertFalse(new GithubCrypto("").configured());assertThrows(IllegalStateException.class,()->new GithubCrypto("").encrypt("token"));}
 @Test void webhookRejectsMissingSignatureWrongSecretAndTampering()throws Exception{byte[] body="{\"event\":\"pull_request\"}".getBytes(StandardCharsets.UTF_8);Mac m=Mac.getInstance("HmacSHA256");m.init(new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8),"HmacSHA256"));String sig="sha256="+HexFormat.of().formatHex(m.doFinal(body));assertTrue(GithubCrypto.validSignature(body,sig,"test-secret"));assertFalse(GithubCrypto.validSignature(body,sig,"other-secret"));assertFalse(GithubCrypto.validSignature("changed".getBytes(StandardCharsets.UTF_8),sig,"test-secret"));assertFalse(GithubCrypto.validSignature(body,null,"test-secret"));assertFalse(GithubCrypto.validSignature(body,sig,""));}
 @Test void diffCommentsOnlyTargetRightSideVisibleLines(){String patch="@@ -3,3 +3,4 @@ method\n context\n-removed\n+added\n+second\n context\n@@ -20,1 +21,1 @@\n-old\n+new";assertEquals(Set.of(3,4,5,6,21),GithubReviewer.rightLines(patch));}
 @Test void pkceMatchesRfcVector(){assertEquals("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",GithubCrypto.challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"));}
}
