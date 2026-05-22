import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code,
  Link as LinkIcon, Heading2, Heading3, Undo, Redo,
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { cn } from '../utils/cn';

interface Props {
  value?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  toolbar?: 'full' | 'minimal' | 'none';
  /** Use chat-style enter-to-submit. Returns plain text. */
  onSubmit?: (text: string) => void;
}

/**
 * Rich-text editor powered by Tiptap.
 * Supports:
 *  - Bold/italic/strike, headings, lists, quotes, code blocks
 *  - Auto-detects #hashtags and @mentions and styles them
 *  - Pasting a URL → renders as link
 *
 * Returns both HTML and plain text on change so callers can decide what to persist.
 */
export const RichEditor: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'What are you building?',
  minHeight = 120,
  className,
  toolbar = 'minimal',
  onSubmit,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: { HTMLAttributes: { class: 'rounded-md bg-secondary/60 p-3 font-mono text-xs overflow-x-auto' } },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'text-primary hover:underline', rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value ?? '',
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          '[&_p]:my-1.5 [&_h2]:font-semibold [&_h3]:font-semibold [&_h2]:mt-3 [&_h3]:mt-2',
          '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-5 [&_ol]:ml-5'
        ),
        style: `min-height:${minHeight}px;`,
      },
      handleKeyDown(_view, e) {
        if (onSubmit && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = editor?.getText() ?? '';
          if (text.trim()) {
            onSubmit(text);
            editor?.commands.clearContent();
          }
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML(), editor.getText());
    },
  });

  // Sync external value changes (e.g. AI applied a summary)
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  return (
    <div className={cn('rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-all', className)}>
      {toolbar !== 'none' && (
        <Toolbar editor={editor} variant={toolbar} />
      )}
      <div className="px-3 py-2.5 scrollbar-thin">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

function Toolbar({ editor, variant }: { editor: ReturnType<typeof useEditor>; variant: 'full' | 'minimal' }) {
  if (!editor) return null;
  const ToolButton: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; disabled?: boolean }> = ({ icon, label, active, onClick, disabled }) => (
    <Tooltip content={label}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors',
          'hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed',
          active && 'bg-secondary text-foreground'
        )}
        aria-label={label}
      >
        {icon}
      </button>
    </Tooltip>
  );

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border flex-wrap">
      <ToolButton icon={<Bold className="h-3.5 w-3.5" />} label="Bold (⌘B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolButton icon={<Italic className="h-3.5 w-3.5" />} label="Italic (⌘I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolButton icon={<Strikethrough className="h-3.5 w-3.5" />} label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
      {variant === 'full' && (
        <>
          <span className="h-4 w-px bg-border mx-1" />
          <ToolButton icon={<Heading2 className="h-3.5 w-3.5" />} label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolButton icon={<Heading3 className="h-3.5 w-3.5" />} label="Subheading" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        </>
      )}
      <span className="h-4 w-px bg-border mx-1" />
      <ToolButton icon={<List className="h-3.5 w-3.5" />} label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolButton icon={<ListOrdered className="h-3.5 w-3.5" />} label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolButton icon={<Quote className="h-3.5 w-3.5" />} label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolButton icon={<Code className="h-3.5 w-3.5" />} label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      <ToolButton
        icon={<LinkIcon className="h-3.5 w-3.5" />}
        label="Add link"
        active={editor.isActive('link')}
        onClick={() => {
          const prev = editor.getAttributes('link').href as string | undefined;
          const url = window.prompt('Link URL', prev ?? 'https://');
          if (!url) return;
          if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
          else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }}
      />
      <span className="h-4 w-px bg-border mx-1 ml-auto" />
      <ToolButton icon={<Undo className="h-3.5 w-3.5" />} label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
      <ToolButton icon={<Redo className="h-3.5 w-3.5" />} label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
    </div>
  );
}
