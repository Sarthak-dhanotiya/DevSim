package com.virtualcompany.modules.journey;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import com.virtualcompany.common.exception.BadRequestException;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.*;
import java.io.*;
import java.util.zip.*;
import static org.assertj.core.api.Assertions.*;

class ResumeParserTest {
    private final ResumeParser parser = new ResumeParser();
    @Test void extractsSkillsWithoutMatchingJavaInsideJavaScript() {
        var r = parser.parse(new MockMultipartFile("file", "resume.txt", "text/plain", "JavaScript React PostgreSQL Git".getBytes()));
        assertThat(r.skills()).contains("JavaScript", "React", "PostgreSQL", "Git").doesNotContain("Java");
    }
    @Test void readsTextBasedPdf() throws Exception {
        var bytes = new ByteArrayOutputStream();
        try (var doc = new PDDocument()) {
            var page = new PDPage(); doc.addPage(page);
            try (var stream = new PDPageContentStream(doc, page)) {
                stream.beginText(); stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12); stream.newLineAtOffset(50, 700); stream.showText("Java Spring Boot SQL"); stream.endText();
            }
            doc.save(bytes);
        }
        assertThat(parser.parse(new MockMultipartFile("file", "cv.pdf", "application/pdf", bytes.toByteArray())).skills()).contains("Java", "Spring Boot", "SQL");
    }
    private byte[] docx(String xml) throws Exception {
        var bytes = new ByteArrayOutputStream();
        try (var zip = new ZipOutputStream(bytes)) { zip.putNextEntry(new ZipEntry("word/document.xml")); zip.write(xml.getBytes()); zip.closeEntry(); }
        return bytes.toByteArray();
    }
    @Test void readsDocxAndRejectsXmlEntityExpansion() throws Exception {
        byte[] safe = docx("<w:document xmlns:w='urn:w'><w:p><w:t>Python Django</w:t></w:p></w:document>");
        assertThat(parser.parse(new MockMultipartFile("file", "cv.docx", "application/octet-stream", safe)).skills()).contains("Python", "Django");
        byte[] unsafe = docx("<!DOCTYPE doc [<!ENTITY x SYSTEM 'file:///secret'>]><w:document xmlns:w='urn:w'><w:t>&x;</w:t></w:document>");
        assertThatThrownBy(() -> parser.parse(new MockMultipartFile("file", "cv.docx", "application/octet-stream", unsafe))).isInstanceOf(BadRequestException.class);
    }
    @Test void rejectsUnsupportedEmptyOversizedAndScannedResumes() throws Exception {
        assertThatThrownBy(() -> parser.parse(new MockMultipartFile("file", "cv.exe", "text/plain", "React".getBytes()))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> parser.parse(new MockMultipartFile("file", "cv.txt", "text/plain", new byte[0]))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> parser.parse(new MockMultipartFile("file", "cv.txt", "text/plain", new byte[5 * 1024 * 1024 + 1]))).isInstanceOf(BadRequestException.class);
        var out = new ByteArrayOutputStream(); try (var doc = new PDDocument()) { doc.addPage(new PDPage()); doc.save(out); }
        assertThatThrownBy(() -> parser.parse(new MockMultipartFile("file", "cv.pdf", "application/pdf", out.toByteArray()))).hasMessageContaining("No readable text");
    }
}
