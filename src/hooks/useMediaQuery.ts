import { useState, useEffect } from 'react';

/**
 * Simple hook to observe a CSS media query.
 * @param query Media query string, e.g. '(max-width: 768px)'
 * @returns Whether the document currently matches the query.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    listener();
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

