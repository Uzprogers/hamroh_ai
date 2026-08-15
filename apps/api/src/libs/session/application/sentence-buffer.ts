const SENTENCE_BOUNDARY = /([.!?])\s+/;
const FORCE_FLUSH_LENGTH = 90;

export class SentenceBuffer {
  private buffer = "";

  constructor(private readonly onSentence: (sentence: string) => void) {}

  push(token: string): void {
    this.buffer += token;
    this.drain();
  }

  flush(): void {
    const text = this.buffer.trim();
    this.buffer = "";
    if (text) this.onSentence(text);
  }

  clear(): void {
    this.buffer = "";
  }

  private drain(): void {
    let match: RegExpExecArray | null;
    while ((match = SENTENCE_BOUNDARY.exec(this.buffer)) !== null) {
      const end = match.index + match[1].length;
      const sentence = this.buffer.slice(0, end).trim();
      this.buffer = this.buffer.slice(end).trimStart();
      if (sentence) this.onSentence(sentence);
    }

    if (this.buffer.length <= FORCE_FLUSH_LENGTH) return;

    const cut = this.findCut();
    if (cut <= 0) return;

    const sentence = this.buffer.slice(0, cut).trim();
    this.buffer = this.buffer.slice(cut).trimStart();
    if (sentence) this.onSentence(sentence);
  }

  private findCut(): number {
    const comma = this.buffer.lastIndexOf(",", FORCE_FLUSH_LENGTH);
    if (comma > 20) return comma + 1;

    const space = this.buffer.lastIndexOf(" ", FORCE_FLUSH_LENGTH);
    if (space > 20) return space;

    return this.buffer.length;
  }
}
