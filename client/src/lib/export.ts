import { jsPDF } from "jspdf";
import { parseMarkdown, extractPlainText } from "./markdown";

export function exportAsMarkdown(title: string, content: string): void {
  const markdown = `# ${title}\n\n${content}`;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  downloadBlob(blob, `${title}.md`);
}

export function exportAsText(title: string, content: string): void {
  const plainText = `${title}\n\n${extractPlainText(content)}`;
  const blob = new Blob([plainText], { type: 'text/plain' });
  downloadBlob(blob, `${title}.txt`);
}

export function exportAsPDF(title: string, content: string): void {
  const pdf = new jsPDF();
  
  // Add title
  pdf.setFontSize(20);
  pdf.text(title, 20, 20);
  
  // Add content
  pdf.setFontSize(12);
  const plainText = extractPlainText(content);
  const lines = pdf.splitTextToSize(plainText, 170);
  pdf.text(lines, 20, 35);
  
  pdf.save(`${title}.pdf`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
