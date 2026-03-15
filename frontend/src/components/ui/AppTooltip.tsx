import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TooltipAlign = 'left' | 'right' | 'center';
type TooltipSide = 'top' | 'bottom';

interface AppTooltipProps {
  content?: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: TooltipAlign;
  side?: TooltipSide;
  boundarySelector?: string;
  margin?: number;
  maxWidth?: number;
  zIndex?: number;
  className?: string;
  tooltipClassName?: string;
  disableClickToggle?: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
}

function normalizeRectMargin(rect: DOMRect, margin: number) {
  return {
    left: rect.left + margin,
    right: rect.right - margin,
    top: rect.top + margin,
    bottom: rect.bottom - margin,
  };
}

export function AppTooltip({
  content,
  children,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  align = 'left',
  side = 'bottom',
  boundarySelector = '[data-tooltip-boundary]',
  margin = 10,
  maxWidth = 320,
  zIndex = 2147483647,
  className = '',
  tooltipClassName = '',
  disableClickToggle = false,
}: AppTooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [resolvedSide, setResolvedSide] = useState<TooltipSide>(side);
  const open = isOpen ?? internalOpen;

  const tooltipStyle = useMemo(
    () => ({
      maxWidth: `${maxWidth}px`,
      zIndex,
    }),
    [maxWidth, zIndex]
  );

  const setOpen = (next: boolean) => {
    if (isOpen === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const computePosition = () => {
    if (!open || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const boundaryElement = triggerRef.current.closest(boundarySelector) as HTMLElement | null;
    const viewportRect = new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    const boundaryRect = boundaryElement?.getBoundingClientRect() || viewportRect;
    const innerBoundary = normalizeRectMargin(boundaryRect, margin);
    const gap = 8;

    let left = triggerRect.left;
    if (align === 'center') {
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
    } else if (align === 'right') {
      left = triggerRect.right - tooltipRect.width;
    }

    // Primary strategy: left-aligned with trigger/form.
    // Fallback: pin right edge to popup boundary with 10px margin.
    if (left + tooltipRect.width > innerBoundary.right) {
      left = innerBoundary.right - tooltipRect.width;
    }
    if (left < innerBoundary.left) {
      left = innerBoundary.left;
    }

    let nextSide = side;
    let top =
      side === 'bottom'
        ? triggerRect.bottom + gap
        : triggerRect.top - tooltipRect.height - gap;

    const canFitBelow = triggerRect.bottom + gap + tooltipRect.height <= window.innerHeight - margin;
    const canFitAbove = triggerRect.top - gap - tooltipRect.height >= margin;
    if (side === 'bottom' && !canFitBelow && canFitAbove) {
      nextSide = 'top';
      top = triggerRect.top - tooltipRect.height - gap;
    } else if (side === 'top' && !canFitAbove && canFitBelow) {
      nextSide = 'bottom';
      top = triggerRect.bottom + gap;
    }

    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));

    setResolvedSide(nextSide);
    setPosition({ top, left });
  };

  useLayoutEffect(() => {
    computePosition();
  }, [open, align, side, margin, maxWidth, content]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => computePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, align, side, margin, maxWidth, content]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isOpen]);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(event) => {
        if (disableClickToggle) return;
        event.stopPropagation();
        setOpen(!open);
      }}
    >
      {children}

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className={`fixed rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-left text-[10px] leading-relaxed text-white shadow-xl ${tooltipClassName}`}
          style={{
            ...tooltipStyle,
            top: position?.top ?? -9999,
            left: position?.left ?? -9999,
          }}
        >
          {content}
          <div
            className={`absolute h-2 w-2 rotate-45 border-slate-700 bg-slate-900 ${
              resolvedSide === 'bottom'
                ? '-top-1 border-l border-t'
                : '-bottom-1 border-b border-r'
            }`}
            style={{ left: '14px' }}
          />
        </div>,
        document.body
      )}
    </span>
  );
}
