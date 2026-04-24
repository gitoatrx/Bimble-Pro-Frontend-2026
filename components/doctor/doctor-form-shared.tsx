"use client";

import React, { useEffect, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FieldErrorState<T extends string> = Partial<Record<T, string>>;

export function FormLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

export function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizePostalCode(value: string | null | undefined) {
  return (value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
}

export function SignaturePad({
  value,
  onChange,
  onExportPromiseChange,
  showHelperText = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onExportPromiseChange?: (promise: Promise<void> | null) => void;
  showHelperText?: boolean;
}) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const strokesRef = useRef<{ x: number; y: number }[][]>([]);
  const exportPromiseRef = useRef<Promise<void> | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [hasInk, setHasInk] = useState(Boolean(value));
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 180 });

  useEffect(() => {
    setHasInk(Boolean(value));
  }, [value]);

  useEffect(() => {
    const source = value.trim();

    if (!source) {
      baseImageRef.current = null;
      return;
    }

    const image = new Image();
    let cancelled = false;

    image.onload = () => {
      if (!cancelled) {
        baseImageRef.current = image;
      }
    };

    image.src = source;

    return () => {
      cancelled = true;
    };
  }, [value]);

  useEffect(() => {
    const target = surfaceRef.current;
    if (!target) return;
    const surface = target;

    function measure() {
      const rect = surface.getBoundingClientRect();
      setSurfaceSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: 180,
      });
    }

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(surface);
    return () => resizeObserver.disconnect();
  }, []);

  function pointFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    const surface = surfaceRef.current;
    if (!surface) return null;

    const rect = surface.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    };
  }

  function capture(nextStrokes: { x: number; y: number }[][]) {
    const surface = surfaceRef.current;
    const rect = surface?.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect?.width || surfaceSize.width || 1));
    const height = Math.max(1, Math.floor(rect?.height || surfaceSize.height || 180));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (context) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (baseImageRef.current) {
        context.drawImage(baseImageRef.current, 0, 0, canvas.width, canvas.height);
      }

      context.strokeStyle = "#0f172a";
      context.lineWidth = 2.25;
      context.lineCap = "round";
      context.lineJoin = "round";

      nextStrokes.forEach((stroke) => {
        if (stroke.length === 0) return;

        if (stroke.length === 1) {
          const point = stroke[0];
          context.beginPath();
          context.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
          context.fillStyle = "#0f172a";
          context.fill();
          return;
        }

        context.beginPath();
        stroke.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.stroke();
      });

      onChange(canvas.toDataURL("image/png"));
    }

    const promise = Promise.resolve();

    exportPromiseRef.current = promise;
    onExportPromiseChange?.(promise);
    exportPromiseRef.current = null;
    onExportPromiseChange?.(null);
  }

  return (
    <div className="space-y-2">
      <div ref={surfaceRef} className="overflow-hidden rounded-3xl border border-border bg-white">
        <div
          className="relative block h-[180px] w-full cursor-crosshair"
          style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onPointerDown={(event) => {
            event.preventDefault();
            const point = pointFromEvent(event);
            if (!point) return;

            event.currentTarget.setPointerCapture(event.pointerId);
            drawingRef.current = true;
            currentStrokeRef.current = [point];
            const nextStrokes = [...strokesRef.current, [point]];
            strokesRef.current = nextStrokes;
            setStrokes(nextStrokes);
            setHasInk(true);
          }}
          onPointerMove={(event) => {
            event.preventDefault();
            if (!drawingRef.current) return;
            const point = pointFromEvent(event);
            if (!point) return;
            currentStrokeRef.current = [...currentStrokeRef.current, point];
            const nextStrokes = [...strokesRef.current];
            if (nextStrokes.length > 0) {
              nextStrokes[nextStrokes.length - 1] = [...currentStrokeRef.current];
              strokesRef.current = nextStrokes;
              setStrokes(nextStrokes);
            }
          }}
          onPointerUp={(event) => {
            event.preventDefault();
            drawingRef.current = false;
            currentStrokeRef.current = [];
            if (strokesRef.current.length > 0) {
              capture(strokesRef.current);
            }
          }}
          onPointerCancel={(event) => {
            event.preventDefault();
            drawingRef.current = false;
            currentStrokeRef.current = [];
            if (strokesRef.current.length > 0) {
              capture(strokesRef.current);
            }
          }}
          onLostPointerCapture={() => {
            drawingRef.current = false;
            currentStrokeRef.current = [];
            if (strokesRef.current.length > 0) {
              capture(strokesRef.current);
            }
          }}
        >
          {value ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${value})` }}
            />
          ) : null}
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${Math.max(1, surfaceSize.width)} ${surfaceSize.height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {strokes.map((stroke, index) =>
              stroke.length > 1 ? (
                <polyline
                  key={`${index}-${stroke.length}`}
                  points={stroke.map((point) => `${point.x},${point.y}`).join(" ")}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : stroke.length === 1 ? (
                <circle
                  key={`${index}-${stroke[0].x}-${stroke[0].y}`}
                  cx={stroke[0].x}
                  cy={stroke[0].y}
                  r="1.5"
                  fill="#0f172a"
                />
              ) : null,
            )}
          </svg>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        {showHelperText ? <p className="text-xs text-muted-foreground">Sign inside the box.</p> : <span />}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setStrokes([]);
            strokesRef.current = [];
            exportPromiseRef.current = null;
            onExportPromiseChange?.(null);
            onChange("");
            setHasInk(false);
            currentStrokeRef.current = [];
          }}
        >
          <RefreshCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>
      {showHelperText ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex h-2.5 w-2.5 rounded-full",
              hasInk ? "bg-emerald-500" : "bg-slate-300",
            )}
          />
          {hasInk ? "Signature captured" : "Signature not captured yet"}
        </div>
      ) : null}
    </div>
  );
}
