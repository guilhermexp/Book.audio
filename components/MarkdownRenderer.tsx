import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for different markdown elements to match the book style
          h1: ({ children }) => (
            <h1 className="text-xl lg:text-2xl font-bold mb-3 text-neutral-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg lg:text-xl font-semibold mb-2.5 text-neutral-200">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base lg:text-lg font-semibold mb-2 text-neutral-200">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm lg:text-base font-semibold mb-2 text-neutral-300">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm lg:text-base leading-relaxed mb-2.5 text-neutral-300">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-neutral-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-neutral-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm lg:text-base leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neutral-600 pl-4 my-3 italic text-neutral-400">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono text-neutral-300">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-neutral-800 p-3 rounded-lg overflow-x-auto mb-3">
                <code className="text-xs font-mono text-neutral-300">
                  {children}
                </code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
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
            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs text-neutral-300">{children}</td>
          ),
          hr: () => <hr className="my-6 border-neutral-700" />,
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
              className="max-w-full h-auto rounded-lg my-3"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
