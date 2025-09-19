import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for different markdown elements to match the book style
          h1: ({ children }) => (
            <h1 className="text-4xl font-bold mb-6 text-neutral-100">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl font-semibold mb-5 text-neutral-200">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl font-semibold mb-4 text-neutral-200">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xl font-semibold mb-3 text-neutral-300">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-lg leading-relaxed mb-4 text-neutral-300">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-neutral-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-neutral-300">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-lg leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neutral-600 pl-4 my-4 italic text-neutral-400">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="bg-neutral-800 px-2 py-1 rounded text-sm font-mono text-neutral-300">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-neutral-800 p-4 rounded-lg overflow-x-auto mb-4">
                <code className="text-sm font-mono text-neutral-300">{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-neutral-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-800">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-neutral-700">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-neutral-800/50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-neutral-300">{children}</td>
          ),
          hr: () => (
            <hr className="my-8 border-neutral-700" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg my-4"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
