import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.makej.app',
  appName: 'Makej!',
  webDir: 'out',
  server: {
    // During development, uncomment to load from Next.js dev server:
    // url: 'http://YOUR_LOCAL_IP:3000',
    // cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
