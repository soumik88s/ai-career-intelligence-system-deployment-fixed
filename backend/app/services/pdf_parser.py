import fitz  # PyMuPDF
import re

def clean_extracted_text(raw_text: str) -> str:
    """
    Safely clean extracted document text.
    Structural cleaning only: removes null bytes, normalizes line endings, cleans whitespace.
    """
    if not raw_text:
        return ""
    
    # Remove null bytes
    cleaned = raw_text.replace("\0", "")
    # Normalize line endings
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    # Replace tab / non-breaking space
    cleaned = re.sub(r'[\t\xa0]', ' ', cleaned)
    # Strip spaces per line
    lines = [line.strip() for line in cleaned.split("\n")]
    cleaned = "\n".join(lines)
    # Replace multiple consecutive blank lines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()

def extract_text_from_pdf(file_bytes: bytes) -> dict:
    """
    Extracts text from PDF bytes using PyMuPDF (fitz).
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if doc.is_encrypted:
            raise ValueError("Password-protected PDF files are not supported.")
            
        full_text_pages = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text:
                full_text_pages.append(text)
                
        raw_text = "\n".join(full_text_pages)
        cleaned_text = clean_extracted_text(raw_text)
        
        if not cleaned_text:
            return {
                "extracted_text": "",
                "warning": "PDF contains no machine-readable text. OCR support can be added later.",
                "char_count": 0,
                "word_count": 0
            }
            
        return {
            "extracted_text": cleaned_text,
            "warning": None,
            "char_count": len(cleaned_text),
            "word_count": len(cleaned_text.split())
        }
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document: {str(e)}")
