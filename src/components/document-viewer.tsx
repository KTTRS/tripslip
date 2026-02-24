import { useState, useRef } from 'react';
import { Badge } from './ui/badge';

export function DocumentViewer({
  title,
  content,
  required,
}: {
  title: string;
  content: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) setRead(true);
  };

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
            <span className="text-white text-sm">📄</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">
              {open ? 'Scroll to read full document' : 'Tap to read full document'}
              {required && ' · Required'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {read && <Badge status="COMPLETED" sm />}
          <span
            className={`text-gray-400 transition-transform inline-block text-lg ${
              open ? 'rotate-90' : ''
            }`}
          >
            ›
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-200">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="max-h-80 overflow-y-auto px-5 py-4 bg-white"
          >
            {content.split('\n\n').map((paragraph, i) => (
              <p
                key={i}
                className={`text-sm leading-relaxed ${
                  i === 0 ? 'font-bold text-gray-900 text-base' : 'text-gray-700'
                } mb-3`}
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div
            className={`px-5 py-3 border-t flex items-center gap-2 ${
              read ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
            }`}
          >
            <span className={`text-xs font-medium ${read ? 'text-emerald-700' : 'text-amber-700'}`}>
              {read
                ? '✓ Document reviewed'
                : '↓ Scroll to bottom to confirm you\'ve read the full document'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
