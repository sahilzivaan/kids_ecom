import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chhotu Fashion',
    short_name: 'Chhotu',
    description: 'India\'s premier destination for kids fashion',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#D4522A',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
