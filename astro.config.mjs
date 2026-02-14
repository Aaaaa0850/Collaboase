// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import vue from '@astrojs/vue';

import tailwindcss from "@tailwindcss/vite"; 

//import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [vue()],
  vite: { 
    plugins: [
      tailwindcss(),
    ],
    ssr: {
      external: ['node:async_hooks'],
    },
  },
});