# Guia de Deploy: CertificateManager em VPS

## 📋 Pré-requisitos
- VPS com Ubuntu 20.04+ (mínimo 2GB RAM)
- Acesso SSH root ou sudo
- Domínio apontando para IP da VPS (opcional)

## 🚀 Deploy Profissional

### Passo 1: Acessar VPS e Preparar Sistema
```bash
# Conectar via SSH
ssh root@seu-ip-vps

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl git wget build-essential nginx certbot python3-certbot-nginx
```

### Passo 2: Criar Usuário Não-Root
```bash
# Criar usuário para a aplicação
adduser appuser
usermod -aG sudo appuser

# Mudar para o novo usuário
su - appuser
```

### Passo 3: Instalar Node.js e PostgreSQL
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Passo 4: Configurar PostgreSQL para Produção
```bash
sudo -u postgres psql
```

```sql
-- Criar usuário com senha forte
CREATE USER appuser WITH PASSWORD 'SuaSenhaForteAqui2024!@#';
CREATE DATABASE tenant_management_db OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;
\q
```

### Passo 5: Instalar PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Passo 6: Clonar e Configurar Projeto
```bash
cd /home/appuser
git clone https://github.com/mcsafx/CertificateManager.git
cd CertificateManager

# Instalar dependências
npm install
npm install dotenv pg
npm install --save-dev @types/pg
```

### Passo 7: Configurar para Produção

#### 7.1 Criar .env de produção
```bash
nano .env
```

```env
# Database Configuration
DATABASE_URL="postgresql://appuser:SuaSenhaForteAqui2024!@#@localhost:5432/tenant_management_db"

# Application Configuration
NODE_ENV=production
PORT=5000

# Session Configuration
SESSION_SECRET="gere-uma-chave-super-segura-com-64-caracteres-aleatorios"

# Application URLs (substituir pelo seu domínio)
VITE_API_URL=https://seu-dominio.com
```

#### 7.2 Modificar arquivos (mesmas alterações do guia local)
- Modificar server/db.ts
- Adicionar dotenv em server/index.ts

### Passo 8: Build para Produção
```bash
# Executar migrações
npm run db:push

# Popular banco
psql -h localhost -U appuser -d tenant_management_db < initial_data.sql

# Build da aplicação
npm run build
```

### Passo 9: Configurar PM2
```bash
# Criar arquivo de configuração
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'certificate-manager',
    script: 'npm',
    args: 'start',
    cwd: '/home/appuser/CertificateManager',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/home/appuser/logs/error.log',
    out_file: '/home/appuser/logs/out.log',
    log_file: '/home/appuser/logs/combined.log',
    time: true
  }]
}
```

```bash
# Criar diretório de logs
mkdir -p ~/logs

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

### Passo 10: Configurar Nginx como Proxy Reverso
```bash
sudo nano /etc/nginx/sites-available/certificate-manager
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 50M;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/certificate-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 11: Configurar SSL com Let's Encrypt
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### Passo 12: Configurar Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### Passo 13: Configurar Backups Automáticos
```bash
# Criar script de backup
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/appuser/backups"
mkdir -p $BACKUP_DIR
pg_dump -U appuser -h localhost tenant_management_db > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x ~/backup-db.sh

# Agendar backup diário
crontab -e
# Adicionar: 0 2 * * * /home/appuser/backup-db.sh
```

## 📊 Monitoramento

### Verificar Status
```bash
# PM2
pm2 status
pm2 logs certificate-manager

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
```

### Logs Importantes
- Aplicação: `~/logs/`
- Nginx: `/var/log/nginx/`
- PostgreSQL: `/var/log/postgresql/`

## 🔒 Segurança Adicional

1. **Configurar fail2ban**
```bash
sudo apt install fail2ban
```

2. **Desabilitar login root SSH**
```bash
sudo nano /etc/ssh/sshd_config
# Definir: PermitRootLogin no
sudo systemctl restart sshd
```

3. **Atualizar regularmente**
```bash
# Criar script de atualização
sudo apt update && sudo apt upgrade -y
cd /home/appuser/CertificateManager
git pull
npm install
npm run build
pm2 restart certificate-manager
```

## ✅ Checklist Final

- [ ] Aplicação rodando: `pm2 status`
- [ ] Nginx configurado: `sudo nginx -t`
- [ ] SSL ativo: https://seu-dominio.com
- [ ] Firewall ativo: `sudo ufw status`
- [ ] Backups agendados: `crontab -l`
- [ ] PM2 no startup: `pm2 startup`

---

**Tempo estimado**: 30-45 minutos
**Dificuldade**: Avançada