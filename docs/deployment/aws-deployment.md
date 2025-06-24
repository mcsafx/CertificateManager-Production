# Guia de Deploy: CertificateManager na AWS Free Tier

## 📋 Pré-requisitos
- Conta AWS com Free Tier ativa
- Cartão de crédito cadastrado (não será cobrado se ficar no Free Tier)
- Conhecimento básico do console AWS

## 🎯 O que vamos usar (Free Tier)
- **EC2**: t2.micro (1 vCPU, 1GB RAM)
- **RDS**: PostgreSQL db.t3.micro (ou PostgreSQL no EC2)
- **Elastic IP**: IP fixo gratuito
- **Security Groups**: Firewall da AWS

## 🚀 Deploy Passo a Passo

### Passo 1: Criar Instância EC2

#### 1.1 Acessar Console AWS
1. Login em: https://console.aws.amazon.com
2. Região: Selecione a mais próxima (São Paulo: sa-east-1)
3. Buscar: "EC2" → Launch Instance

#### 1.2 Configurar Instância
- **Name**: CertificateManager
- **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
- **Instance Type**: t2.micro (Free tier eligible)
- **Key Pair**: 
  - Click "Create new key pair"
  - Name: certificate-manager-key
  - Type: RSA
  - Format: .pem (Linux/Mac) ou .ppk (Windows/PuTTY)
  - **BAIXE E GUARDE O ARQUIVO!**

#### 1.3 Network Settings
- **VPC**: Default
- **Subnet**: No preference
- **Auto-assign public IP**: Enable
- **Security Group**: Create new
  - Name: certificate-manager-sg
  - Rules:
    - SSH (22): My IP
    - HTTP (80): Anywhere (0.0.0.0/0)
    - HTTPS (443): Anywhere (0.0.0.0/0)
    - Custom TCP (5000): Anywhere (temporário para testes)

#### 1.4 Storage
- **Size**: 20GB (máximo do Free Tier)
- **Type**: gp3

#### 1.5 Launch Instance
Click "Launch Instance" e aguarde inicializar

### Passo 2: Configurar IP Elástico (Fixo)

1. EC2 Dashboard → Elastic IPs → Allocate Elastic IP
2. Allocate
3. Actions → Associate → Selecione sua instância
4. Associate

**Anote o IP Elástico**: Este será o IP fixo do seu servidor

### Passo 3: Conectar via SSH

#### Linux/Mac:
```bash
# Dar permissão ao arquivo da chave
chmod 400 ~/Downloads/certificate-manager-key.pem

# Conectar
ssh -i ~/Downloads/certificate-manager-key.pem ubuntu@SEU-IP-ELASTICO
```

#### Windows (PuTTY):
- Use o PuTTYgen para converter .pem em .ppk
- Configure o PuTTY com o IP e a chave .ppk

### Passo 4: Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl git wget build-essential nginx

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### Passo 5: Opção A - PostgreSQL no EC2 (Mais Econômico)

```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Configurar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário e banco
sudo -u postgres psql
```

```sql
CREATE USER appuser WITH PASSWORD 'SuaSenhaForteAWS2024!@#';
CREATE DATABASE tenant_management_db OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;
\q
```

### Passo 5: Opção B - RDS PostgreSQL (Mais Robusto)

#### 5.1 Criar RDS
1. Console AWS → RDS → Create Database
2. **Engine**: PostgreSQL
3. **Version**: 15.x
4. **Template**: Free tier
5. **Settings**:
   - DB Instance identifier: certificate-manager-db
   - Master username: appuser
   - Master password: SuaSenhaForteRDS2024!@#
6. **Instance**: db.t3.micro
7. **Storage**: 20GB (Free tier)
8. **Connectivity**:
   - VPC: Default
   - Public access: Yes (para desenvolvimento)
   - Security group: Create new
9. **Database options**:
   - Initial database: tenant_management_db
10. Create Database (demora ~5 minutos)

#### 5.2 Configurar Security Group do RDS
1. Após criar, clique no RDS
2. Security Groups → Inbound Rules → Edit
3. Add Rule: PostgreSQL (5432) → Source: Security Group da EC2

**Anote o Endpoint do RDS**: Será usado na DATABASE_URL

### Passo 6: Instalar PM2 e Clonar Projeto

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar usuário da aplicação
sudo useradd -m -s /bin/bash appuser
sudo usermod -aG sudo appuser

# Mudar para o usuário
sudo su - appuser

# Clonar projeto
cd ~
git clone https://github.com/mcsafx/CertificateManager.git
cd CertificateManager

# Instalar dependências
npm install
npm install dotenv pg
npm install --save-dev @types/pg
```

### Passo 7: Configurar Aplicação

#### 7.1 Modificar Arquivos
Mesmas modificações dos guias anteriores:
- server/db.ts (PostgreSQL local)
- server/index.ts (adicionar dotenv)

#### 7.2 Criar .env
```bash
nano .env
```

**Para PostgreSQL local (Opção A)**:
```env
DATABASE_URL="postgresql://appuser:SuaSenhaForteAWS2024!@#@localhost:5432/tenant_management_db"
NODE_ENV=production
PORT=5000
SESSION_SECRET="gere-uma-chave-de-64-caracteres-super-segura-para-producao"
VITE_API_URL=http://SEU-IP-ELASTICO
```

**Para RDS (Opção B)**:
```env
DATABASE_URL="postgresql://appuser:SuaSenhaForteRDS2024!@#@seu-endpoint-rds.region.rds.amazonaws.com:5432/tenant_management_db"
NODE_ENV=production
PORT=5000
SESSION_SECRET="gere-uma-chave-de-64-caracteres-super-segura-para-producao"
VITE_API_URL=http://SEU-IP-ELASTICO
```

### Passo 8: Preparar Banco e Build

```bash
# Executar migrações
npm run db:push

# Popular dados iniciais (conectar ao banco e executar SQLs dos guias anteriores)

# Build para produção
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
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
}
```

```bash
# Criar diretório de logs
mkdir logs

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Voltar para usuário ubuntu
exit
```

### Passo 10: Configurar PM2 Startup

```bash
# Como usuário ubuntu
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u appuser --hp /home/appuser
```

### Passo 11: Configurar Nginx

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/certificate-manager
```

```nginx
server {
    listen 80;
    server_name SEU-IP-ELASTICO;

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
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Passo 12: Configurar Swap (Importante para t2.micro)

```bash
# Criar arquivo swap de 1GB
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Otimizar swap
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

## 🔒 Segurança AWS

### 1. Configurar Security Group Definitivo
No console AWS → EC2 → Security Groups:
- Remover regra da porta 5000
- Manter apenas: SSH (22), HTTP (80), HTTPS (443)

### 2. Criar Alarmes CloudWatch (Free Tier)
1. CloudWatch → Alarms → Create Alarm
2. Metric: EC2 → Per-Instance → CPU Utilization
3. Threshold: > 80% por 5 minutos
4. Notification: Seu email

### 3. Configurar Backups S3 (Opcional)
```bash
# Instalar AWS CLI
sudo apt install awscli

# Script de backup para S3
nano ~/backup-to-s3.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U appuser tenant_management_db > /tmp/backup_$TIMESTAMP.sql
aws s3 cp /tmp/backup_$TIMESTAMP.sql s3://seu-bucket/backups/
rm /tmp/backup_$TIMESTAMP.sql
```

## 📊 Monitoramento

### Verificar Status
```bash
# Aplicação
sudo su - appuser
pm2 status
pm2 logs

# Nginx
sudo systemctl status nginx

# Sistema
free -h  # Memória
df -h    # Disco
top      # Processos
```

### Logs AWS
- EC2 Dashboard → Instances → Monitoring
- CloudWatch → Logs (se configurado)

## 💰 Controle de Custos (Free Tier)

### Limites Gratuitos
- **EC2**: 750 horas/mês t2.micro
- **RDS**: 750 horas/mês db.t3.micro
- **Storage**: 30GB total
- **Bandwidth**: 15GB/mês

### Dicas para Não Pagar
1. **Use apenas 1 instância** EC2 t2.micro
2. **Desligue RDS** se não usar (ou use PostgreSQL local)
3. **Configure alertas** de billing
4. **Elastic IP**: Grátis se associado a instância rodando
5. **Snapshots**: Delete antigos (cobram após 1GB)

### Configurar Alerta de Billing
1. AWS Console → Billing → Billing Preferences
2. Enable: Receive Billing Alerts
3. CloudWatch → Alarms → Create
4. Metric: Billing → Total Estimated Charge
5. Threshold: $1.00 (ou seu limite)

## ✅ Checklist Final

- [ ] EC2 rodando com IP Elástico
- [ ] PostgreSQL acessível (local ou RDS)
- [ ] Aplicação rodando no PM2
- [ ] Nginx configurado como proxy
- [ ] Security Groups configurados
- [ ] Swap habilitado
- [ ] Alertas configurados
- [ ] Acesso via: http://SEU-IP-ELASTICO

## 🆘 Troubleshooting AWS

### "Connection refused"
- Verificar Security Groups
- Verificar se Nginx está rodando
- Verificar se PM2 está rodando

### "502 Bad Gateway"
- PM2 não está rodando
- Aplicação com erro
- Verificar logs: `pm2 logs`

### "Cobrança inesperada"
- Verificar se tem mais de 1 instância
- Verificar Elastic IPs não associados
- Verificar snapshots antigos
- RDS rodando sem necessidade

### Performance lenta
- Verificar swap: `free -h`
- Verificar CPU: `top`
- Considerar upgrade (sai do Free Tier)

---

**Tempo estimado**: 45-60 minutos
**Custo**: $0 (dentro do Free Tier)
**Dificuldade**: Intermediária-Avançada