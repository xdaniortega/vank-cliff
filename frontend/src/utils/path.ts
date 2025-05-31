// Utility function to handle basePath for assets
export function getAssetPath(path: string): string {
  // Check if we're in a GitHub Pages environment
  const isGithubPages = process.env.NODE_ENV === 'production' && 
                       (typeof window !== 'undefined' ? 
                        window.location.hostname.includes('github.io') : 
                        false);
  
  // Get the repository name from the current URL or environment
  const getBasePath = (): string => {
    if (typeof window !== 'undefined' && isGithubPages) {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      return pathSegments.length > 0 ? `/${pathSegments[0]}` : '';
    }
    return '';
  };

  const basePath = getBasePath();
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${basePath}${normalizedPath}`;
}

// For Next.js metadata and server-side rendering, we need a different approach
export function getServerAssetPath(path: string): string {
  // On the server side, we'll rely on the build-time configuration
  // This will be handled by Next.js basePath configuration
  return path;
} 