module.exports = {
  apps: [
    {
      name: 'linkrescue-browser-api',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3847,
      },
      // Graceful shutdown — give browsers 10s to close
      kill_timeout: 10000,
      // Restart if process uses too much memory
      max_restarts: 10,
      restart_delay: 3000,
      // Log configuration
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
