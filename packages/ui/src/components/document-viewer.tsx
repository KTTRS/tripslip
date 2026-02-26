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
    <div className="rounded-2xl border-2 border-black/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-black/5 hover:bg-bus/10 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
            <span className="text-white text-sm">📄</span>
          </div>
          <div>
            <p className="text-sm font-bold text-black">{title}</p>
            <p className="text-xs text-black/40">
              {open ? 'Scroll to read full document' : 'Tap to read full document'}
              {required && ' · Required'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {read && <Badge status="COMPLETED" sm />}
          <span
            className={`text-black/30 transition-transform inline-block text-lg font-bold ${
              open ? 'rotate-90' : ''
            }`}
          >
            ›
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t-2 border-black/10">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="max-h-80 overflow-y-auto px-5 py-4 bg-white"
          >
            {content.split('\n\n').map((paragraph, i) => (
              <p
                key={i}
                className={`text-sm leading-relaxed ${
                  i === 0 ? 'font-bold text-black text-base' : 'text-black/70'
                } mb-3`}
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div
            className={`px-5 py-3 border-t-2 flex items-center gap-2 ${
              read ? 'bg-ts-green/10 border-ts-green/20' : 'bg-bus/10 border-bus/20'
            }`}
          >
            <span className={`text-xs font-bold ${read ? 'text-ts-green' : 'text-black/60'}`}>
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
