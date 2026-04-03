interface AppConfig {
  apiUrl: string;
  commentServiceUrl: string,
  appTitle: string;
  appVersion: string;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  timeout: number;
  headers: object;
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  commentServiceUrl: import.meta.env.COMMENTS_SERVICE_URL  || 'http://localhost:3001',
  appTitle: import.meta.env.VITE_APP_TITLE || 'Task Manager',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
};

// Validate required config
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('VITE_API_URL is not set in production!');
}

export default config;
