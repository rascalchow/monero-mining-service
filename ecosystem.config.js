module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'serve',
      args: '--spa',
      env: {
        PM2_SERVE_PATH: '../dashboard/build',
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      }
    },
    {
      name: 'backend',
      script: './server.js', // cluster mode run with node only, not npm
      args: '',
      exec_mode: 'cluster', // default fork
      instances: 2, // "max",
      kill_timeout: 4000,
      wait_ready: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env: {
        NODE_ENV: 'production',
        JWT_SECRET: '#@(FWeiooijweoi234)',
        JWT_EXPIRATION_IN_MINUTES: '4320000',
        MONGO_URI:
          'mongodb://nurevadmin:WEIAWENB9483FfDFsWEf@127.0.0.1/nurev?authSource=admin',
        EMAIL_FROM_NAME: 'My Project',
        EMAIL_FROM_ADDRESS: 'info@myproject.com',
        EMAIL_SMTP_DOMAIN_MAILGUN: 'myproject.com',
        EMAIL_SMTP_API_MAILGUN: '123456',
        FRONTEND_URL: 'http://localhost:8080',
        USE_REDIS: 'false',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        PORT: '4004',
        DEVICE_TOKEN: 'xkieuiwefwe'
      }
    }
  ]
}
