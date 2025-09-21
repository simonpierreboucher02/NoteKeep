import { parseMarkdown } from "@/lib/markdown";

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-muted px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        Preview
      </div>
      <div 
        className="flex-1 p-6 overflow-y-auto markdown-content"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        data-testid="markdown-preview"
      />
    </div>
  );
}
