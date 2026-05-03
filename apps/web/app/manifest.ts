import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'datasetai — npm for AI agents',
    short_name: 'datasetai',
    description:
      'Format-agnostic registry for AI agent definition files. One CLI, every tool.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
    categories: ['developer', 'productivity', 'utilities'],
  };
}
