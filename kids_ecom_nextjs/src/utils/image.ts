export const getImageUrl = (originalUrl: string, type: 'original' | 'optimized' | 'thumb' = 'optimized') => {
  if (!originalUrl) return '/images/product_placeholder.jpg';
  
  // If it's an external URL or data URI, just return it
  if (originalUrl.startsWith('http') && !originalUrl.includes('uploads/originals')) {
    return originalUrl;
  }

  // If it's a static Next.js image, return it directly without prepending the backend URL
  if (originalUrl.startsWith('/images/')) {
    return originalUrl;
  }
  
  // Strip starting slash if any
  let path = originalUrl.startsWith('/') ? originalUrl.substring(1) : originalUrl;
  
  // Base URL for uploads
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8081';
  
  // If the path is just 'uploads/name.ext' (legacy), assume it's original
  if (path.startsWith('uploads/') && !path.includes('uploads/originals')) {
    path = path.replace('uploads/', 'uploads/originals/');
  }

  // At this point path should be like 'uploads/originals/file.jpg'
  
  if (type === 'original') {
    return `${baseUrl}/${path}`;
  }
  
  // For optimized and thumb, we need to change directory and extension to .webp
  const parts = path.split('/');
  const filename = parts.pop() || '';
  const baseName = filename.substring(0, filename.lastIndexOf('.')) || filename;
  const webpFilename = `${baseName}.webp`;
  
  if (type === 'optimized') {
    return `${baseUrl}/uploads/optimized/${webpFilename}`;
  }
  
  if (type === 'thumb') {
    return `${baseUrl}/uploads/thumbs/${webpFilename}`;
  }
  
  return `${baseUrl}/${path}`;
};
