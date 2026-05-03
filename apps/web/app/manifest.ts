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
    icons: [{ src: '/icon', sizes: '32x32', type: 'image/png' }],
    categories: ['developer', 'productivity', 'utilities'],
  };
}
