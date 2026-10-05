package com.virtualcompany.modules.journey;

import com.virtualcompany.common.exception.BadRequestException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;
import java.util.zip.*;

@Service
public class ResumeParser {
    static final List<String> SKILLS = List.of("Java", "Spring Boot", "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Git", "HTML", "CSS", "Tailwind", "AWS", "JUnit", "Jest", "REST", "GraphQL", "C++", "C#", "Go", "Django", "Flask", "Kotlin", "Angular", "Vue", "Figma", "Linux", "Kubernetes", "Kafka", "Microservices", "Spring Security", "WebFlux");
    public record ParsedResume(String fileName, List<String> skills, String summary, String parser, String warning) {}
    public ParsedResume parse(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) throw new BadRequestException("Upload a resume smaller than 5 MB.");
        String name = Optional.ofNullable(file.getOriginalFilename()).orElse("resume").replaceAll(".*[/\\\\]", "");
        String text;
        try {
            byte[] bytes = file.getBytes();
            if (name.toLowerCase().endsWith(".pdf")) {
                try (var doc = Loader.loadPDF(bytes)) {
                    if (doc.getNumberOfPages() > 20) throw new BadRequestException("Resume must be 20 pages or fewer.");
                    text = new PDFTextStripper().getText(doc);
                }
            } else if (name.toLowerCase().endsWith(".docx")) {
                text = readDocx(bytes);
            } else if (name.toLowerCase().endsWith(".txt")) {
                text = new String(bytes, StandardCharsets.UTF_8);
            } else throw new BadRequestException("Supported resume formats: PDF, DOCX and TXT.");
        } catch (BadRequestException ex) { throw ex; }
        catch (Exception ex) { throw new BadRequestException("Cannot read this resume. Try an unencrypted PDF, DOCX or TXT file."); }
        if (text.isBlank()) throw new BadRequestException("No readable text found. Scanned PDFs need OCR; upload a text-based resume or enter your skills manually.");
        String normalized = text.toLowerCase(Locale.ROOT);
        var skills = SKILLS.stream().filter(s -> Pattern.compile("(?<![a-z0-9])" + Pattern.quote(s.toLowerCase(Locale.ROOT)) + "(?![a-z0-9])").matcher(normalized).find()).toList();
        String summary = skills.isEmpty() ? "No known technical skills detected. Add your skills manually." : "Detected " + skills.size() + " skills: " + String.join(", ", skills) + ". Confirm these before continuing.";
        String evidence=Arrays.stream(text.split("[\\r\\n]+"))
            .map(String::trim).filter(line->line.length()>25&&line.length()<500)
            .filter(line->!line.contains("@")&&!line.matches(".*https?://.*")&&!line.matches(".*[0-9]{7,}.*"))
            .filter(line->skills.stream().anyMatch(skill->line.toLowerCase(Locale.ROOT).contains(skill.toLowerCase(Locale.ROOT))))
            .limit(8).reduce((a,b)->a+"; "+b).orElse("");
        if(!evidence.isBlank())summary+=" Technical experience: "+evidence;
        return new ParsedResume(name.substring(0, Math.min(name.length(), 255)), skills, summary, "LOCAL_TEXT_EXTRACTION", "Resume claims are unverified. The file is discarded. Extracted technical summaries may personalize AI challenges; resume claims are not verified.");
    }
    private String readDocx(byte[] bytes) throws Exception {
        try (var zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (entry.getName().equals("word/document.xml")) {
                    byte[] xml = zip.readNBytes(2 * 1024 * 1024 + 1);
                    if (xml.length > 2 * 1024 * 1024) throw new BadRequestException("Resume document is too large after extraction.");
                    var factory = DocumentBuilderFactory.newInstance();
                    factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
                    factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
                    factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
                    factory.setXIncludeAware(false);
                    factory.setExpandEntityReferences(false);
                    var doc = factory.newDocumentBuilder().parse(new ByteArrayInputStream(xml));
                    var nodes = doc.getElementsByTagName("w:t");
                    var result = new StringBuilder();
                    for (int i = 0; i < nodes.getLength(); i++) result.append(nodes.item(i).getTextContent()).append(' ');
                    return result.toString();
                }
            }
        }
        throw new BadRequestException("Invalid DOCX resume.");
    }
}
