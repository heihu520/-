import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  theme?: 'light' | 'dark'; // 'light' for bot bubbles (dark text), 'dark' for user bubbles (light text)
}

const CodeBlock = ({ language, code, ...props }: { language: string; code: string; [key: string]: any }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-lg">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-xs font-mono text-blue-300/80 font-bold lowercase select-none">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-all duration-200"
          title="复制代码"
        >
          {isCopied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">已复制</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>复制代码</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighter */}
      <div className="relative">
        <SyntaxHighlighter
          {...props}
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: 'transparent', 
            padding: '1.5rem',
            fontSize: '0.9rem',
            lineHeight: '1.6',
          }}
          codeTagProps={{
            style: { fontFamily: '"JetBrains Mono", Menlo, Monaco, Consolas, monospace' }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, theme = 'light' }) => {
  // Define text colors based on theme
  const isDark = theme === 'dark';
  
  const colors = {
    p: isDark ? 'text-white/90' : 'text-slate-700',
    strong: isDark ? 'text-white font-bold' : 'text-slate-900 font-bold',
    h1: isDark ? 'text-white border-white/30' : 'text-slate-900 border-slate-200',
    h2: isDark ? 'text-white/95' : 'text-slate-800',
    h3: isDark ? 'text-indigo-200' : 'text-indigo-700',
    link: isDark ? 'text-blue-200 hover:text-white decoration-blue-200/50' : 'text-blue-600 hover:text-blue-500 decoration-blue-500/30',
    codeBg: isDark ? 'bg-white/20 text-white border-white/20' : 'bg-slate-200/60 text-blue-600 border-slate-300/50',
    list: isDark ? 'text-white/80' : 'text-slate-600',
    marker: isDark ? 'marker:text-white/50' : 'marker:text-slate-400',
    blockquote: isDark ? 'border-white/40 bg-white/10 text-white/80' : 'border-blue-500/50 bg-blue-50/50 text-slate-600',
    th: isDark ? 'text-white/90 bg-white/10' : 'text-slate-700 bg-slate-50',
    td: isDark ? 'text-white/80 border-white/10' : 'text-slate-600 border-slate-100',
    tableBorder: isDark ? 'border-white/20 bg-white/5' : 'border-slate-200 bg-white/50',
  };

  return (
    <div className={`prose max-w-none text-sm md:text-base leading-relaxed break-words ${colors.p}`}>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');

            return !inline && match ? (
              <CodeBlock language={match[1]} code={codeContent} {...props} />
            ) : (
              <code
                {...props}
                className={`${className} ${colors.codeBg} rounded px-1.5 py-0.5 text-xs md:text-sm font-mono border`}
              >
                {children}
              </code>
            );
          },
          ul: ({ children }) => <ul className={`list-disc list-outside ml-5 my-4 space-y-2 ${colors.list}`}>{children}</ul>,
          ol: ({ children }) => <ol className={`list-decimal list-outside ml-5 my-4 space-y-2 ${colors.list}`}>{children}</ol>,
          li: ({ children }) => <li className={`pl-1 ${colors.marker}`}>{children}</li>,
          h1: ({ children }) => <h1 className={`text-2xl mt-8 mb-4 pb-2 border-b ${colors.h1}`}>{children}</h1>,
          h2: ({ children }) => <h2 className={`text-xl mt-6 mb-3 ${colors.h2}`}>{children}</h2>,
          h3: ({ children }) => <h3 className={`text-lg font-semibold mt-5 mb-2 ${colors.h3}`}>{children}</h3>,
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`underline underline-offset-4 transition-colors font-medium ${colors.link}`}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 py-3 px-4 rounded-r-lg my-6 italic ${colors.blockquote}`}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className={`overflow-x-auto my-6 rounded-xl border shadow-sm ${colors.tableBorder}`}>
              <table className="min-w-full divide-y divide-inherit text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          th: ({ children }) => <th className={`px-4 py-3 font-semibold tracking-wider uppercase text-xs ${colors.th}`}>{children}</th>,
          td: ({ children }) => <td className={`px-4 py-3 border-t ${colors.td}`}>{children}</td>,
          p: ({ children }) => <p className={`mb-4 last:mb-0 leading-7 ${colors.p}`}>{children}</p>,
          strong: ({ children }) => <strong className={colors.strong}>{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};