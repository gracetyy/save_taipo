import { useEffect, useState, RefObject } from 'react';

export interface UseResponsiveMapHeightOptions {
  headerRef?: RefObject<HTMLElement>;
  bottomNavSelector?: string; // css selector to locate bottom nav (fallback to #bottom-nav)
  minHeight?: number; // minimum height in px
  extraMargin?: number; // margin to avoid overlap
}

export default function useResponsiveMapHeight(options: UseResponsiveMapHeightOptions = {}) {
  const { headerRef, bottomNavSelector = '#bottom-nav', minHeight = 120, extraMargin = 16 } = options;
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const computeHeight = () => {
      const headerBottom = headerRef && headerRef.current ? headerRef.current.getBoundingClientRect().bottom : 0;
      const bottomNav = document.querySelector(bottomNavSelector) || document.querySelector('.fixed.bottom-0');
      const bottomNavHeight = bottomNav ? (bottomNav as HTMLElement).getBoundingClientRect().height : 64;
      const viewportHeight = (window as any).visualViewport ? (window as any).visualViewport.height : window.innerHeight;
      const h = Math.max(viewportHeight - headerBottom - bottomNavHeight - extraMargin, minHeight);
      setHeight(h);
    };

    // Run initially and attach listeners
    computeHeight();
    window.addEventListener('resize', computeHeight);
    window.addEventListener('orientationchange', computeHeight);

    // Also try to recalc when visualViewport's resize/scroll changes (mobile soft keyboard)
    if ((window as any).visualViewport) {
      (window as any).visualViewport.addEventListener('resize', computeHeight);
      (window as any).visualViewport.addEventListener('scroll', computeHeight);
    }

    return () => {
      window.removeEventListener('resize', computeHeight);
      window.removeEventListener('orientationchange', computeHeight);
      if ((window as any).visualViewport) {
        (window as any).visualViewport.removeEventListener('resize', computeHeight);
        (window as any).visualViewport.removeEventListener('scroll', computeHeight);
      }
    };
  }, [headerRef, bottomNavSelector, minHeight, extraMargin]);

  return height;
}
