import { useEffect, useState, RefObject } from 'react';

interface UseIntersectionObserverProps {
  ref: RefObject<HTMLElement>;
  options?: IntersectionObserverInit;
  threshold?: number | number[];
  rootMargin?: string;
  once?: boolean;
}

const useIntersectionObserver = ({
  ref,
  options = {},
  threshold = 0,
  rootMargin = '0px',
  once = false,
}: UseIntersectionObserverProps): boolean => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    if (!ref.current) return;

    const observerOptions = {
      root: options.root || null,
      rootMargin: rootMargin,
      threshold: threshold,
    };

    let observer: IntersectionObserver;
    let isMounted = true;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (!isMounted) return;
      
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        
        // If once is true, unobserve after intersection
        if (once && observer && ref.current) {
          observer.unobserve(ref.current);
        }
      } else if (!once) {
        setIsIntersecting(false);
      }
    };

    observer = new IntersectionObserver(observerCallback, observerOptions);
    observer.observe(ref.current);

    return () => {
      isMounted = false;
      if (observer && ref.current) {
        observer.unobserve(ref.current);
        observer.disconnect();
      }
    };
  }, [ref, options, threshold, rootMargin, once]);

  return isIntersecting;
};

export default useIntersectionObserver;