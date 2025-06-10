module.exports = {
  apps: [{
    name: 'certificate-manager',
    script: './start.sh',
    cwd: '/home/appuser/CertificateManager',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
