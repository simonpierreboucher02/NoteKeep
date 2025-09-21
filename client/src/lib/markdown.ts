import { marked } from "marked";
import DOMPurify from "dompurify";

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function parseMarkdown(content: string): string {
  const html = marked.parse(content) as string;
  return DOMPurify.sanitize(html);
}

export function extractPlainText(content: string): string {
  const html = parseMarkdown(content);
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

export function countWords(content: string): number {
  const plainText = extractPlainText(content);
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

export function estimateReadingTime(content: string): number {
  const wordCount = countWords(content);
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(wordCount / wordsPerMinute);
}
