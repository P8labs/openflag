def chunk_text(text: str, max_chars: int = 8000) -> list[str]:
    chunks = []
    start = 0

    while start < len(text):
        end = start + max_chars
        chunks.append(text[start:end])
        start = end

    return chunks
