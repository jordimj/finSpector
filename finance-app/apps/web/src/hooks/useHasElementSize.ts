import { useCallback, useEffect, useState } from 'react';

type ElementSize = {
  width: number;
  height: number;
};

export function useHasElementSize<TElement extends HTMLElement>() {
  const [element, setElement] = useState<TElement | null>(null);
  const [size, setSize] = useState<ElementSize | null>(null);
  const ref = useCallback((node: TElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (element === null) {
      setSize(null);

      return undefined;
    }

    const updateSize = () => {
      const { height, width } = element.getBoundingClientRect();
      const nextSize =
        width > 0 && height > 0
          ? {
              width,
              height,
            }
          : null;

      setSize((currentSize) => {
        if (
          currentSize?.width === nextSize?.width &&
          currentSize?.height === nextSize?.height
        ) {
          return currentSize;
        }

        return nextSize;
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element]);

  return [ref, size !== null, size] as const;
}
