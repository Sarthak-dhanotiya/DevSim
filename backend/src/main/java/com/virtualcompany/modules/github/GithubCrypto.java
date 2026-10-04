package com.virtualcompany.modules.github;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.*;
import java.util.*;
import java.nio.charset.StandardCharsets;

@Component
public class GithubCrypto {
    private final String key;
    public GithubCrypto(@Value("${github.token-key:}") String key) { this.key=key; }
    public boolean configured() { try { return Base64.getDecoder().decode(key).length==32; } catch(Exception e){return false;} }
    public static String random() { byte[] b=new byte[32]; new SecureRandom().nextBytes(b); return Base64.getUrlEncoder().withoutPadding().encodeToString(b); }
    public static String hash(String value) { try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);} }
    public static String challenge(String value) { return Base64.getUrlEncoder().withoutPadding().encodeToString(HexFormat.of().parseHex(hash(value))); }
    public String encrypt(String value) { try { byte[] iv=new byte[12];new SecureRandom().nextBytes(iv); Cipher c=cipher(Cipher.ENCRYPT_MODE,iv);return Base64.getEncoder().encodeToString(iv)+":"+Base64.getEncoder().encodeToString(c.doFinal(value.getBytes(StandardCharsets.UTF_8))); }catch(Exception e){throw new IllegalStateException("GitHub token encryption is not configured");} }
    public String decrypt(String value) {try {String[] p=value.split(":");return new String(cipher(Cipher.DECRYPT_MODE,Base64.getDecoder().decode(p[0])).doFinal(Base64.getDecoder().decode(p[1])),StandardCharsets.UTF_8);}catch(Exception e){throw new IllegalStateException("GitHub token cannot be decrypted; reconnect your account");}}
    private Cipher cipher(int mode,byte[] iv)throws Exception {if(!configured())throw new IllegalStateException();Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(mode,new SecretKeySpec(Base64.getDecoder().decode(key),"AES"),new GCMParameterSpec(128,iv));return c;}
    public static boolean validSignature(byte[] body,String signature,String secret) {if(secret.isBlank()||signature==null)return false;try{Mac m=Mac.getInstance("HmacSHA256");m.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));return MessageDigest.isEqual(("sha256="+HexFormat.of().formatHex(m.doFinal(body))).getBytes(StandardCharsets.UTF_8),signature.getBytes(StandardCharsets.UTF_8));}catch(Exception e){return false;}}
}
