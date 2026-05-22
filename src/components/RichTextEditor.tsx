import React, { useState, useRef } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    minHeight?: string;
    maxHeight?: string;
}

/**
 * Rich Text Editor Component
 * Supports markdown formatting with preview
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Write something amazing...',
    minHeight = '150px',
    maxHeight = '500px',
}) => {
    const [showPreview, setShowPreview] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Insert markdown syntax
    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || 'text';
        const newValue =
            value.substring(0, start) +
            before +
            selectedText +
            after +
            value.substring(end);

        onChange(newValue);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            const cursorPos = start + before.length + selectedText.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
    };

    return (
        <div className="border-2 border-[#374151] rounded-lg overflow-hidden bg-[#1A1A24]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 border-b border-[#374151] bg-[#252532] flex-wrap">
                <button
                    onClick={() => insertMarkdown('**', '**')}
                    title="Bold (Ctrl+B)"
                    className="p-2 hover:bg-[#374151] rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12v2H6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10h12v2H6z" />
                    </svg>
                </button>

                <button
                    onClick={() => insertMarkdown('_', '_')}
                    title="Italic (Ctrl+I)"
                    className="p-2 hover:bg-[#374151] rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 5h4m-4 14h4" />
                    </svg>
                </button>

                <div className="w-px h-6 bg-[#374151]" />

                <button
                    onClick={() => insertMarkdown('[', '](url)')}
                    title="Link"
                    className="p-2 hover:bg-[#374151] rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </button>

                <button
                    onClick={() => insertMarkdown('`', '`')}
                    title="Code"
                    className="p-2 hover:bg-[#374151] rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                </button>

                <button
                    onClick={() => insertMarkdown('```\n', '\n```')}
                    title="Code Block"
                    className="p-2 hover:bg-[#374151] rounded-lg transition-colors text-xs"
                >
                    &lt;/&gt;
                </button>

                <button
                    onClick={() => insertMarkdown('- ', '')}
                    title="Bullet List"
                    className="p-2 hover:bg-[#374151] rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <button
                    onClick={() => insertMarkdown('# ', '')}
                    title="Heading 1"
                    className="p-2 hover:bg-[#374151] rounded-lg transition-colors font-bold text-lg"
                >
                    H1
                </button>

                <button
                    onClick={() => insertMarkdown('## ', '')}
                    title="Heading 2"
                    className="p-2 hover:bg-[#374151] rounded-lg transition-colors font-bold"
                >
                    H2
                </button>

                <div className="ml-auto" />

                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                        showPreview
                            ? 'bg-indigo-600 text-white'
                            : 'bg-[#374151] text-gray-400 hover:text-white'
                    }`}
                >
                    {showPreview ? 'Editing' : 'Preview'}
                </button>
            </div>

            {/* Editor / Preview */}
            {!showPreview ? (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        minHeight,
                        maxHeight,
                    }}
                    className="w-full p-4 bg-[#1A1A24] text-white border-0 focus:outline-none resize-none font-mono text-sm"
                />
            ) : (
                <div
                    style={{
                        minHeight,
                        maxHeight,
                        overflow: 'auto',
                    }}
                    className="w-full p-4 text-gray-300"
                >
                    <MarkdownPreview content={value} />
                </div>
            )}

            {/* Hint */}
            <div className="px-4 py-2 bg-[#252532] border-t border-[#374151] text-xs text-gray-500">
                Markdown supported: **bold** _italic_ `code` [links](url) • You can drag to resize
            </div>
        </div>
    );
};

/**
 * Simple Markdown Preview Component
 */
const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
    // Simple markdown to HTML conversion
    const parseMarkdown = (md: string) => {
        let html = md
            // Headings
            .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
            // Italic
            .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
            // Code inline
            .replace(/`(.*?)`/g, '<code class="bg-[#374151] px-2 py-1 rounded text-sm">$1</code>')
            // Code blocks
            .replace(/```\n(.*?)\n```/gs, '<pre class="bg-[#374151] p-3 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-400 hover:underline">$1</a>')
            // Line breaks
            .replace(/\n/g, '<br />');

        return html;
    };

    return (
        <div
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            className="prose prose-invert max-w-none"
        />
    );
};

export default RichTextEditor;
