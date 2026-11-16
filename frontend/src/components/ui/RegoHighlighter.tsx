import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export interface RegoHighlighterProps {
  code: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  title?: string;
  className?: string;
  maxHeight?: string;
}

export const RegoHighlighter: React.FC<RegoHighlighterProps> = ({
  code,
  readOnly = true,
  onChange,
  title = 'policy.rego',
  className = '',
  maxHeight = '420px'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightRego = (source: string) => {
    const lines = source.split('\n');
    return lines.map((line, idx) => {
      // Very clean token-based formatting
      let formattedLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Comments
      if (formattedLine.trim().startsWith('#')) {
        return (
          <div key={idx} className="table-row">
            <span className="table-cell pr-4 text-right select-none text-lavender-300 font-mono text-xs">
              {idx + 1}
            </span>
            <span className="table-cell font-mono text-xs text-slate-400 italic">
              {line}
            </span>
          </div>
        );
      }

      // Keywords
      const keywords = [
        'package',
        'import',
        'default',
        'allow',
        'deny',
        'violation',
        'else',
        'not',
        'with',
        'as',
        'some',
        'in',
        'every'
      ];
      keywords.forEach((kw) => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'g');
        formattedLine = formattedLine.replace(
          regex,
          '<span class="text-purple-600 font-semibold">$1</span>'
        );
      });

      // Built-in inputs
      formattedLine = formattedLine.replace(
        /\b(input\.[a-zA-Z0-9_.]+)/g,
        '<span class="text-indigo-600 font-medium">$1</span>'
      );

      // Strings
      formattedLine = formattedLine.replace(
        /"([^"]*)"/g,
        '<span class="text-emerald-600">"$1"</span>'
      );

      // Numbers
      formattedLine = formattedLine.replace(
        /\b(\d+(\.\d+)?)\b/g,
        '<span class="text-amber-600">$1</span>'
      );

      return (
        <div key={idx} className="table-row hover:bg-lavender-100/40 transition-colors">
          <span className="table-cell pr-4 text-right select-none text-lavender-400 font-mono text-xs w-10">
            {idx + 1}
          </span>
          <span
            className="table-cell font-mono text-xs text-lavender-900 whitespace-pre"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        </div>
      );
    });
  };

  return (
    <div
      className={`rounded-xl border border-lavender-200 bg-[#FAF9FF] overflow-hidden shadow-sm flex flex-col ${className}`}
    >
      <div className="px-4 py-2 bg-lavender-100/60 border-b border-lavender-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-lavender-400" />
          <span className="font-mono font-medium text-lavender-900">{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-lavender-200/70 text-lavender-700 font-semibold uppercase tracking-wider">
            REGO
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-lavender-700 hover:text-lavender-900 hover:bg-lavender-200/60 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] text-emerald-600 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      <div
        className="p-4 overflow-auto font-mono text-xs leading-relaxed"
        style={{ maxHeight }}
      >
        {readOnly ? (
          <div className="table w-full">{highlightRego(code)}</div>
        ) : (
          <textarea
            value={code}
            onChange={(e) => onChange && onChange(e.target.value)}
            className="w-full h-full font-mono text-xs text-lavender-900 bg-transparent resize-none focus:outline-none leading-relaxed"
            rows={14}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
};
