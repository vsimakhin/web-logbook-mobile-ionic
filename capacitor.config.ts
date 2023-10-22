import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'web-logbook-mobile-ionic',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
