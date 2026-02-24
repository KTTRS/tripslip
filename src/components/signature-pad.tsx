import { useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';

export function SignaturePad({
  onSave,
  saved,
}: {
  onSave: () => void;
  saved: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const ctx = canvasRef.current!.getContext('2d')!;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      setDrawing(true);
    },
    [getPos],
  );

  const moveDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const ctx = canvasRef.current!.getContext('2d')!;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      setHasContent(true);
    },
    [drawing, getPos],
  );

  const endDraw = useCallback(() => setDrawing(false), []);

  const clear = () => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.clearRect(0, 0, 440, 160);
    setHasContent(false);
  };

  return (
    <div>
      <div
        className={`relative border-2 rounded-2xl overflow-hidden ${
          saved ? 'border-ts-green bg-ts-green/5' : 'border-black/20 bg-white'
        }`}
      >
        {saved && (
          <div className="absolute inset-0 flex items-center justify-center bg-ts-green/10 z-10">
            <span className="text-ts-green font-black text-sm">✓ Signature captured</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={440}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
        />
        <div className="absolute bottom-4 left-5 right-5 border-b-2 border-dashed border-black/15" />
        <span className="absolute bottom-5 left-5 text-[10px] text-black/30 font-black tracking-widest uppercase">
          Sign here
        </span>
      </div>
      <div className="flex gap-2 mt-3">
        <Button v="ghost" sz="xs" onClick={clear} disabled={saved}>
          Clear
        </Button>
        <Button v={saved ? 'green' : 'primary'} sz="xs" onClick={onSave} disabled={!hasContent || saved}>
          {saved ? '✓ Confirmed' : 'Confirm Signature'}
        </Button>
      </div>
    </div>
  );
}
