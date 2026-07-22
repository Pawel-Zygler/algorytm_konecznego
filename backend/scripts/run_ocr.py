import os
import subprocess
import fitz  # PyMuPDF

def has_text(pdf_path: str) -> bool:
    """Checks if a PDF has extractable text (at least 50 characters)."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text("text")
            if len(text.strip()) > 50:
                doc.close()
                return True
        doc.close()
        return False
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
        return False

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    books_dir = os.path.join(base_dir, "books")
    
    if not os.path.exists(books_dir):
        print(f"Books directory not found: {books_dir}")
        return
        
    pdf_files = [f for f in os.listdir(books_dir) if f.lower().endswith('.pdf')]
    print(f"Found {len(pdf_files)} PDF files. Checking for missing text layers...")
    
    for filename in pdf_files:
        pdf_path = os.path.join(books_dir, filename)
        
        if not has_text(pdf_path):
            print(f"[{filename}] - No text found. Running OCR...")
            # We use --force-ocr to ensure it processes all pages
            # and --language pol to support Polish text
            # We output to a temporary file first to avoid corruption if it fails
            temp_output = f"{pdf_path}.ocr_tmp.pdf"
            
            try:
                # Run ocrmypdf
                subprocess.run(
                    ["ocrmypdf", "--force-ocr", "-l", "pol", "--optimize", "1", pdf_path, temp_output],
                    check=True
                )
                
                # If successful, replace the original file
                os.replace(temp_output, pdf_path)
                print(f"[{filename}] - OCR completed successfully.")
            except subprocess.CalledProcessError as e:
                print(f"[{filename}] - OCR failed: {e}")
                if os.path.exists(temp_output):
                    os.remove(temp_output)
            except Exception as e:
                print(f"[{filename}] - Unexpected error: {e}")
                if os.path.exists(temp_output):
                    os.remove(temp_output)
        else:
            print(f"[{filename}] - Text layer exists. Skipping.")

if __name__ == "__main__":
    main()
