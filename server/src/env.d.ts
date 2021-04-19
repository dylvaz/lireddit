declare namespace NodeJS {
  interface ProcessEnv {
    SECRET_KEY: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    PORT: string;
    CORS_ORGIN: string;
  }
}