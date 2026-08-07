import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { CurtainOrientation } from '../lib/clip-path.js';
import { positionFromPointer } from '../lib/clip-path.js';

/**
 * Tracks pointer/touch movement over the overlay to drive the curtain split.
 *
 * Pointer capture keeps the line tracking when the cursor leaves the frame mid-drag,
 * which is the normal way a reviewer slides the seam across the whole composition.
 */
export function useCurtainDrag(
  orientation: CurtainOrientation,
  onChange: (position: number) => void,
): {
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly dragging: boolean;
  readonly onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromEvent = useCallback(
    (event: PointerEvent | ReactPointerEvent) => {
      const element = ref.current;
      if (element === null) return;
      const bounds = element.getBoundingClientRect();
      onChange(
        positionFromPointer(
          { clientX: event.clientX, clientY: event.clientY },
          bounds,
          orientation,
        ),
      );
    },
    [onChange, orientation],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent): void => {
      updateFromEvent(event);
    };
    const onUp = (): void => {
      setDragging(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, updateFromEvent]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      updateFromEvent(event);
    },
    [updateFromEvent],
  );

  return { ref, dragging, onPointerDown };
}
