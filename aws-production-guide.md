CertQuality - Guia de Deploy em Produção

AWS Free Tier com Melhores Práticas 2025

🎯 Objetivo: Deploy profissional na AWS usando SSM Session Manager, sem SSH, com máxima segurança

---

📋 Pré-requisitos

* Conta AWS ativa com Free Tier
* Conhecimento básico do AWS Console
* Acesso à internet
* Navegador web moderno

---

☁️ Parte 1: Configuração IAM (Identity and Access Management)

Passo 1: Criar IAM Role para EC2 (Reutilizável)

Por que precisamos: EC2 precisa de permissões para se comunicar com SSM (Session Manager) sem usar chaves SSH.

1.1 Acessar IAM:

AWS Console → Services → IAM → Roles → Create Role

1.2 Configurar Trust Relationship:

* Trusted entity type: AWS service
* Service: EC2
* Use case: EC2

O que isso faz: Permite que instâncias EC2 assumam esta role automaticamente.

1.3 Adicionar Policies (Permissões):

* AmazonSSMManagedInstanceCore ✅
* CloudWatchAgentServerPolicy ✅

Explicação das policies:

* AmazonSSMManagedInstanceCore: Permite conexão via Session Manager, execução de comandos remotos, e gerenciamento de patches
* CloudWatchAgentServerPolicy: Permite envio de logs e métricas para CloudWatch

1.4 Finalizar Role:

* Role name: EC2-SSM-Role
* Description: “Role para EC2 com acesso SSM Session Manager”
* Create Role

Importante: Esta role pode ser reutilizada em múltiplas instâncias.

---

🖥️ Parte 2: Lançamento da Instância EC2

Passo 2: Configurar Instância EC2

2.1 Iniciar Launch Instance:

AWS Console → EC2 → Instances → Launch Instance

2.2 Configurações Básicas:

Name: CertQuality-Production
AMI: Ubuntu Server 24.04 LTS (Free tier eligible)
Instance type: t2.micro (Free tier)

Por que Ubuntu 24.04:

* LTS (Long Term Support) até 2029
* SSM Agent pré-instalado
* Amplo suporte da comunidade
* Atualizações de segurança regulares

Por que t2.micro:

* Incluído no Free Tier (750 horas/mês)
* Sufficient para aplicações pequenas-médias
* 1 vCPU, 1GB RAM

2.3 Key Pair (CRÍTICO):

Key pair: "Proceed without a key pair"

Por que não usar SSH keys:

* SSM Session Manager é mais seguro
* Não expõe porta 22
* Auditoria completa de acesso
* Gestão de acesso via IAM

2.4 Network Settings (MUITO IMPORTANTE):

Security Group Configuration:

Create security group: ✅
Security group name: certquality-production-sg
Description: Security group for CertQuality production

Inbound Rules:
┌──────┬──────┬──────┬─────────────┬──────────────┐
│ Type │ Port │ Proto│ Source      │ Description  │
├──────┼──────┼──────┼─────────────┼──────────────┤
│ HTTP │ 80   │ TCP  │ 0.0.0.0/0   │ Web access   │
│HTTPS │ 443  │ TCP  │ 0.0.0.0/0   │ Secure web   │
└──────┴──────┴──────┴─────────────┴──────────────┘

❌ NÃO adicionar SSH (port 22)

Explicação das regras:

* HTTP (80): Tráfego web padrão, permite acesso via navegador
* HTTPS (443): Tráfego web seguro (futuro certificado SSL)
* 0.0.0.0/0: Anywhere - permite acesso de qualquer IP (necessário para aplicação web pública)

Por que não SSH (22): Usaremos SSM Session Manager, mais seguro.

2.5 Advanced Details:

IAM instance profile: EC2-SSM-Role (criada no Passo 1)

2.6 User Data (Bootstrap Script):

#!/bin/bash
# Script executado na primeira inicialização

# Atualizar sistema
apt-get update
apt-get upgrade -y

# SSM Agent (já vem no Ubuntu 24.04, mas garantir que está ativo)
snap install amazon-ssm-agent --classic
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Dependências básicas para compilação
apt-get install -y curl git wget build-essential

# Log de conclusão
echo "Bootstrap completed at $(date)" >> /var/log/bootstrap.log

O que o User Data faz:

* Executa automaticamente na primeira inicialização
* Atualiza sistema operacional
* Garante que SSM Agent está funcionando
* Instala ferramentas essenciais
* Registra log de execução

2.7 Storage:

Root volume: 20 GB gp3 (máximo Free Tier)
Encrypted: ✅ (boa prática de segurança)

2.8 Launch Instance:

Clique “Launch Instance”

Aguarde 2-3 minutos para instância inicializar completamente.

---

🌐 Parte 3: Configuração de IP Público (CRÍTICO)

Passo 3: Associar Elastic IP

Por que é obrigatório: Instâncias t2.micro não recebem IP público fixo por padrão.

3.1 Allocate Elastic IP:

EC2 → Elastic IPs → Allocate Elastic IP address

3.2 Configure Elastic IP:

Public IPv4 address pool: Amazon's pool of IPv4 addresses
Network Border Group: us-east-1 (ou sua região)

Click “Allocate”

3.3 Associate com a Instância:

Actions → Associate Elastic IP address
Instance: CertQuality-Production (sua instância)
Private IP address: (deixar automático)

Click “Associate”

3.4 Anotar IP Público:

📝 IMPORTANTE: Anote o Elastic IP: XXX.XXX.XXX.XXX

Este IP será usado durante todo o processo!

---

🔐 Parte 4: Conexão via SSM Session Manager

Passo 4: Conectar na Instância

4.1 Aguardar SSM Registration:

Aguarde 3-5 minutos após launch para SSM Agent registrar.

4.2 Verificar Disponibilidade:

Systems Manager → Session Manager → Start session

Deve mostrar sua instância CertQuality-Production.

4.3 Conectar:

Select target: CertQuality-Production
Click "Start session"

Terminal abre no navegador! 🎉

4.4 Elevar Privilégios:

# Você conecta como ssm-user, precisa virar root
sudo su -

Agora você é root na instância.

---

🔧 Parte 5: Instalação do Stack de Tecnologia

Passo 5: Instalar Node.js 20 LTS

# Adicionar repositório NodeSource oficial
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Instalar Node.js
apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x

Por que Node.js 20:

* Versão LTS mais recente
* Melhor performance com V8 engine
* Suporte completo a ES modules
* Compatibilidade com todas as dependências

Passo 6: Instalar PostgreSQL

# Instalar PostgreSQL 16
apt-get install -y postgresql postgresql-contrib

# Iniciar e habilitar serviço
systemctl start postgresql
systemctl enable postgresql

# Verificar status
systemctl status postgresql  # Deve mostrar "active (running)"

Por que PostgreSQL:

* Banco relacional robusto
* Excelente performance para aplicações web
* Suporte nativo a JSON
* ACID compliance
* Amplamente usado em produção

Passo 7: Instalar Nginx

# Instalar Nginx
apt-get install -y nginx

# Habilitar para iniciar no boot
systemctl enable nginx

# Verificar instalação
nginx -v  # Deve mostrar versão

Por que Nginx:

* Web server de alta performance
* Proxy reverso eficiente
* Serve arquivos estáticos rapidamente
* Load balancing capabilities
* SSL/TLS termination

Passo 8: Instalar PM2 (Process Manager)

# Instalar PM2 globalmente
npm install -g pm2

# Verificar instalação
pm2 --version

Por que PM2:

* Process manager para Node.js
* Auto-restart em caso de crash
* Zero-downtime deployments
* Monitoring integrado
* Cluster mode para múltiplos cores

---

👤 Parte 6: Configuração de Usuário da Aplicação

Passo 9: Criar Usuário com Permissões Adequadas

# Criar usuário da aplicação
useradd -m -s /bin/bash appuser

# Definir senha automaticamente
echo "appuser:AppUserAWS2024!" | chpasswd

# Adicionar ao grupo sudo para operações administrativas
usermod -aG sudo appuser

# Configurar sudo sem senha para facilitar operações
echo "appuser ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/appuser
chmod 0440 /etc/sudoers.d/appuser

Por que um usuário dedicado:

* Princípio de menor privilégio
* Isolamento de aplicação
* Facilita debugging e logs
* Melhores práticas de segurança

---

🗄️ Parte 7: Configuração do PostgreSQL

Passo 10: Setup do Banco de Dados

# Conectar como usuário postgres e configurar
sudo -u postgres psql << 'EOF'
-- Criar usuário da aplicação
CREATE USER appuser WITH PASSWORD 'SecurePasswordAWS2024!';

-- Criar banco de dados
CREATE DATABASE tenant_management_db OWNER appuser;

-- Conceder todos os privilégios
GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;

-- Verificar criação
\du
\l

-- Sair
\q
EOF

Verificação:

# Deve mostrar usuário e banco criados
sudo -u postgres psql -l | grep tenant_management_db

Passo 11: Configurar Autenticação Automática

# Mudar para usuário appuser
su - appuser

# Criar arquivo de credenciais PostgreSQL
cat > ~/.pgpass << 'EOF'
localhost:5432:tenant_management_db:appuser:SecurePasswordAWS2024!
EOF

# Definir permissões corretas (obrigatório)
chmod 600 ~/.pgpass

# Testar conexão
psql -h localhost -U appuser -d tenant_management_db -c "SELECT version();"

Deve conectar sem pedir senha e mostrar versão do PostgreSQL.

Se pedir senha: Arquivo .pgpass está incorreto.

---

📁 Parte 8: Deploy da Aplicação

Passo 12: Clonar e Configurar Projeto

# Como appuser, clonar repositório
cd ~
git clone https://github.com/mcsafx/CertificateManager-Production.git CertificateManager
cd CertificateManager

# Verificar estrutura
ls -la

Passo 13: Configurar Variáveis de Ambiente

# Criar arquivo .env com configurações de produção
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://appuser:SecurePasswordAWS2024!@localhost:5432/tenant_management_db"

# Environment
NODE_ENV=production

# Server Configuration
PORT=5000

# Session Security
SESSION_SECRET="$(openssl rand -base64 48)"

# Frontend API URL - SUBSTITUIR PELO SEU ELASTIC IP
VITE_API_URL=http://XXX.XXX.XXX.XXX
EOF

# ⚠️ IMPORTANTE: Substituir XXX.XXX.XXX.XXX pelo Elastic IP real
# Exemplo: sed -i 's/XXX.XXX.XXX.XXX/54.234.34.153/g' .env

Verificar .env:

cat .env
# Confirmar que VITE_API_URL tem IP correto

Passo 14: Instalar Dependências

# Instalar todas as dependências
npm install

# Processo pode demorar 3-5 minutos
# Irá compilar packages nativos para Linux

O que acontece:

* Download de todas as dependências do package.json
* Compilação de packages nativos (bcrypt, etc.)
* Setup de ferramentas de build (Vite, TypeScript)
* Criação de node_modules

---

🗄️ Parte 9: Configuração do Banco de Dados

Passo 15: Executar Migrações

# Executar push do schema para o banco
npm run db:push

O que executa:

* Drizzle Kit lê configuração em drizzle.config.ts
* Conecta no PostgreSQL usando DATABASE_URL
* Lê schema definitions em shared/schema.ts
* Cria todas as tabelas necessárias
* Aplica indexes e constraints

Saída esperada:

No config path provided, using default 'drizzle.config.ts'
Reading config file...
Using 'pg' driver for database querying
✓ Changes applied

Passo 16: Popular com Dados Iniciais

# Verificar se script existe
ls -la scripts/initial-data.sql

# Executar script de dados iniciais
psql -h localhost -U appuser -d tenant_management_db < scripts/initial-data.sql

Deve mostrar:

INSERT 0 3  (planos inseridos)
INSERT 0 5  (módulos inseridos)

Passo 17: Verificar Dados

# Verificar planos
psql -h localhost -U appuser -d tenant_management_db -c "
SELECT code, name, price FROM plans ORDER BY code;
"

# Verificar módulos
psql -h localhost -U appuser -d tenant_management_db -c "
SELECT code, name, is_core FROM modules ORDER BY code;
"

---

🏗️ Parte 10: Build e Deploy da Aplicação

Passo 18: Build de Produção

# Compilar frontend e backend para produção
npm run build

O que acontece:

* Frontend: Vite compila React + TypeScript → arquivos estáticos otimizados
* Backend: esbuild compila TypeScript → JavaScript otimizado
* Assets: Minificação, tree-shaking, code splitting
* Output: Arquivos prontos para produção em dist/

Saída esperada:

vite v5.x.x building for production...
✓ 2697 modules transformed.
dist/public/index.html                    1.80 kB
dist/public/assets/index-xxxxx.css       66.25 kB
dist/public/assets/index-xxxxx.js     1,235.54 kB
✓ built in 38.98s

dist/index.js  249.1kb
⚡ Done in 87ms

Passo 19: Configurar Script de Inicialização

# Criar script de start otimizado
cat > start.sh << 'EOF'
#!/bin/bash
cd /home/appuser/CertificateManager
NODE_ENV=production node dist/index.js
EOF

# Tornar executável
chmod +x start.sh

Passo 20: Iniciar com PM2

# Iniciar aplicação com PM2
pm2 start ./start.sh --name certquality-production

# Verificar status
pm2 status

Deve mostrar:

┌────┬─────────────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name                │ mode    │ ↺       │ status   │ cpu    │ mem  │ user     │ watching │ uptime   │
├────┼─────────────────────┼─────────┼─────────┼──────────┼────────┼──────┼──────────┼──────────┼──────────┤
│ 0  │ certquality-prod... │ fork    │ 0       │ online   │ 0%     │ 32mb │ appuser  │ disabled │ 2s       │
└────┴─────────────────────┴─────────┴─────────┴──────────┴────────┴──────┴──────────┴──────────┴──────────┘

Passo 21: Verificar Logs da Aplicação

# Ver logs detalhados
pm2 logs certquality-production --lines 15

Logs esperados (sem erros):

[express] serving on port 5000
Verificando status de todas as assinaturas...
Verificador de assinaturas iniciado. Intervalo: a cada 6 horas
Admin tenant created successfully (first-time initialization)
Admin user created successfully

Passo 22: Salvar Configuração PM2

# Salvar configuração atual
pm2 save

# Testar aplicação localmente
curl http://localhost:5000

Deve retornar: HTML da aplicação

---

🔧 Parte 11: Configuração do PM2 Startup

Passo 23: Configurar Auto-start

# Sair para root
exit

# Configurar PM2 para iniciar automaticamente
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u appuser --hp /home/appuser

O comando acima gera uma linha que você deve copiar e executar.

Exemplo de saída:

[PM2] You have to run this command as root. Execute the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u appuser --hp /home/appuser

Execute a linha mostrada pelo PM2.

---

🌐 Parte 12: Configuração do Nginx

Passo 24: Configurar Proxy Reverso

# Como root, criar configuração do site
cat > /etc/nginx/sites-available/certquality << 'EOF'
server {
    # Escutar na porta 80 (HTTP padrão)
    listen 80;
    server_name _;

    # Configuração do proxy reverso
    location / {
        # Encaminhar requests para aplicação Node.js
        proxy_pass http://localhost:5000;
        
        # Headers necessários para aplicações web modernas
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Configurações adicionais
    client_max_body_size 50M;
    
    # Logs específicos do site
    access_log /var/log/nginx/certquality.access.log;
    error_log /var/log/nginx/certquality.error.log;
}
EOF

Explicação da configuração:

* listen 80: Nginx escuta na porta padrão web
* proxy_pass: Encaminha requests para aplicação na porta 5000
* proxy_set_header: Headers necessários para aplicação funcionar corretamente
* client_max_body_size: Permite uploads de até 50MB

Passo 25: Ativar Site

# Criar link simbólico para ativar site
ln -s /etc/nginx/sites-available/certquality /etc/nginx/sites-enabled/

# Remover site padrão
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

Deve mostrar:

nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful

Passo 26: Reiniciar Nginx

# Reiniciar Nginx para aplicar configurações
systemctl restart nginx

# Verificar status
systemctl status nginx

Status deve mostrar: “active (running)”

---

✅ Parte 13: Verificações e Testes Finais

Passo 27: Testes de Conectividade

# Testar aplicação localmente
curl http://localhost
curl -I http://localhost  # Deve mostrar headers do Nginx

# Verificar IP público da instância
curl http://169.254.169.254/latest/meta-data/public-ipv4
# Deve retornar o Elastic IP associado

# Testar acesso externo
curl http://SEU-ELASTIC-IP

Passo 28: Verificar Todos os Serviços

# PostgreSQL
systemctl status postgresql  # active (running)

# Nginx
systemctl status nginx       # active (running)

# PM2 (como appuser)
su - appuser
pm2 status                   # online, 0 restarts

# Logs da aplicação
pm2 logs certquality-production --lines 10

---

🌐 Parte 14: Acesso Final

Passo 29: Acessar Aplicação

URL: http://SEU-ELASTIC-IP

Passo 30: Fazer Login

Credenciais padrão:

* Username: admin
* Password: admin123

Interface esperada:

* ✅ Dashboard CertQuality carregando
* ✅ Menu lateral funcionando
* ✅ Métricas sendo exibidas
* ✅ Sistema responsivo

---

🔧 Parte 15: Otimizações para Free Tier

Passo 31: Configurar Swap (t2.micro)

# Como root, adicionar swap para melhor performance
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Otimizar uso de swap
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf

Por que adicionar swap:

* t2.micro tem apenas 1GB RAM
* Evita out-of-memory errors
* Melhora performance geral

Passo 32: Configurar Logrotate

# Configurar rotação de logs para economizar espaço
cat > /etc/logrotate.d/certquality << 'EOF'
/var/log/nginx/certquality.*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}

/home/appuser/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

---

📊 Monitoring e Manutenção

Comandos Úteis para Monitoramento:

# Status geral do sistema
top
htop  # Se instalado: apt install htop

# Uso de disco
df -h

# Uso de memória
free -h

# Logs do sistema
journalctl -u nginx.service --since "1 hour ago"
journalctl -u postgresql.service --since "1 hour ago"

# Logs da aplicação
su - appuser
pm2 logs certquality-production
pm2 monit  # Interface de monitoramento

Backup Automático (Opcional):

# Script de backup do banco
cat > /home/appuser/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/appuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U appuser -d tenant_management_db > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Manter apenas 7 backups
ls -t $BACKUP_DIR/backup_*.sql.gz | tail -n +8 | xargs rm -f
EOF

chmod +x /home/appuser/backup-db.sh

# Adicionar ao crontab (executa diariamente às 2:00 AM)
echo "0 2 * * * /home/appuser/backup-db.sh" | crontab -u appuser -

---

🐛 Troubleshooting

Problema: “Failed to connect” no navegador

Causas possíveis:

1. Security Group não permite HTTP (80)
2. Elastic IP não associado
3. Nginx não está rodando

Soluções:

# Verificar Security Group no AWS Console
# Verificar Elastic IP associado
# Verificar Nginx
systemctl status nginx
systemctl restart nginx

Problema: “502 Bad Gateway”

Causa: Nginx funcionando, mas aplicação Node.js parada

Solução:

su - appuser
pm2 status
pm2 restart certquality-production
pm2 logs certquality-production

Problema: “Database connection failed”

Causa: PostgreSQL parado ou configuração incorreta

Solução:

systemctl status postgresql
systemctl restart postgresql

# Testar conexão manualmente
su - appuser
psql -h localhost -U appuser -d tenant_management_db -c "SELECT 1;"

---

💰 Limites do Free Tier

Monitoramento de Uso:

* EC2: 750 horas/mês (uma instância t2.micro 24/7)
* EBS: 30GB storage
* Data Transfer: 15GB/mês out
* Elastic IP: Grátis quando associado

Como Monitorar:

AWS Console → Billing → Free Tier Usage

Alertas de Billing:

AWS Console → Billing → Billing preferences → Receive Billing Alerts
CloudWatch → Alarms → Create Alarm → Billing

---

✅ Checklist de Sucesso Completo

Infraestrutura AWS:

[ ] IAM Role criada com permissões SSM
[ ] EC2 t2.micro lançada com Ubuntu 24.04
[ ] Security Group com HTTP (80) e HTTPS (443)
[ ] Elastic IP associado
[ ] SSM Session Manager funcionando

Software Stack:

[ ] Node.js 20.x instalado
[ ] PostgreSQL 16 rodando
[ ] Nginx configurado como proxy reverso
[ ] PM2 gerenciando processo da aplicação

Aplicação:

[ ] Código clonado e dependências instaladas
[ ] Banco migrado e populado com dados
[ ] Build de produção executado
[ ] PM2 mostrando status “online”
[ ] Logs sem erros de conexão

Produção:

[ ] Aplicação acessível via Elastic IP
[ ] Login funcionando
[ ] Interface carregando corretamente
[ ] Auto-restart configurado (PM2 + systemd)

---

🎯 Resultados Esperados

Após seguir este guia completamente, você terá:

✅ Aplicação Profissional em Produção:

* Sistema CertQuality rodando 24/7
* Performance otimizada para produção
* Resistente a crashes (auto-restart)
* Logs centralizados e organizados

✅ Infraestrutura Segura:

* Sem exposição SSH (porta 22)
* Acesso auditado via SSM
* Princípio de menor privilégio
* Backups automatizados

✅ Custo Zero:

* 100% dentro do AWS Free Tier
* Monitoramento de uso ativo
* Alertas configurados

✅ Manutenibilidade:

* Comandos de monitoramento
* Logs organizados
* Procedimentos de backup
* Troubleshooting documentado

Deploy profissional na AWS com zero custo! 🚀

---

🔄 Próximos Passos (Opcionais)

SSL/HTTPS (Certificado Grátis):

* Configurar Route 53 + ACM
* Certificado SSL automático
* Redirect HTTP → HTTPS

Monitoramento Avançado:

* CloudWatch Dashboards
* SNS notifications
* Custom metrics

CI/CD Pipeline:

* GitHub Actions
* Deploy automatizado
* Testing pipeline

Scaling:

* Application Load Balancer
* Multiple availability zones
* Auto Scaling Groups

Base sólida para expansão futura! 🎯