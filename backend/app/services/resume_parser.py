from backend.app.services.pdf_parser import extract_text_from_pdf
from backend.app.services.docx_parser import extract_text_from_docx

def parse_resume(file_bytes: bytes, filename: str, content_type: str) -> dict:
    """
    Main resume parsing dispatcher for PDF and DOCX.
    """
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if content_type == "application/pdf" or ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif content_type in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ] or ext == "docx":
        return extract_text_from_docx(file_bytes)
    elif content_type == "text/plain" or ext == "txt":
        text = file_bytes.decode("utf-8", errors="ignore")
        from backend.app.services.pdf_parser import clean_extracted_text
        cleaned = clean_extracted_text(text)
        return {
            "extracted_text": cleaned,
            "warning": None,
            "char_count": len(cleaned),
            "word_count": len(cleaned.split())
        }
    else:
        raise ValueError(f"Unsupported file format: .{ext}. Only PDF and DOCX files are allowed.")
