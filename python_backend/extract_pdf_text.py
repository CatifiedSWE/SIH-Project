import sys
import fitz

def main():
    if len(sys.argv) < 2:
        sys.exit(1)
    file_path = sys.argv[1]
    try:
        doc = fitz.open(file_path)
        pages_text = []
        for i, page in enumerate(doc, 1):
            t = page.get_text().strip()
            if t:
                pages_text.append(f"[PAGE {i}]\n{t}")
        doc.close()
        print("\n\n".join(pages_text))
    except Exception as e:
        sys.stderr.write(f"Error reading PDF: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
