import React, { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  className = ""
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleCommand = (command: string, value?: string) => {
    // Focus the editor first to ensure the command applies to the right element
    editorRef.current?.focus();
    
    // Execute the command
    document.execCommand(command, false, value);
    
    // Update the state with the new content
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          handleCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          handleCommand('underline');
          break;
      }
    }
  };

  return (
    <div className={`relative border border-gray-300 rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => handleCommand('bold')}
          className="p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Bold (Ctrl+B)"
        >
          <span className="font-bold text-sm">B</span>
        </button>
        
        <button
          type="button"
          onClick={() => handleCommand('italic')}
          className="p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Italic (Ctrl+I)"
        >
          <span className="italic text-sm">I</span>
        </button>
        
        <button
          type="button"
          onClick={() => handleCommand('underline')}
          className="p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Underline (Ctrl+U)"
        >
          <span className="underline text-sm">U</span>
        </button>
        
        <button
          type="button"
          onClick={() => handleCommand('strikethrough')}
          className="p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Strikethrough"
        >
          <span className="line-through text-sm">S</span>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => handleCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => handleCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            <circle cx="4" cy="5" r="1" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="4" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {/* Editor Container */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsEditorFocused(true)}
          onBlur={() => setIsEditorFocused(false)}
          onKeyDown={handleKeyDown}
          className={`
            p-3 min-h-[100px] focus:outline-none prose prose-sm max-w-none
            ${!value && !isEditorFocused ? 'text-gray-400' : 'text-gray-900'}
            [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6
            [&_li]:mb-1
          `}
          style={{ wordBreak: 'break-word' }}
          suppressContentEditableWarning={true}
        />
        
        {/* Placeholder */}
        {!value && !isEditorFocused && (
          <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
