# Guia de Instalação Local - Sistema de Gestão de Tenants e Módulos

Este guia contém todas as instruções necessárias para executar a aplicação em ambiente local no Ubuntu/Linux ou VPS.

## Pré-requisitos do Sistema

### 1. Sistema Operacional Recomendado
- **Ubuntu 20.04 LTS ou superior** (recomendado)
- **Debian 11+** ou **CentOS 8+** também funcionam
- Mínimo 2GB RAM, 10GB espaço em disco

### 2. Instalar Node.js 20
```bash
# Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# Instalar curl se não estiver instalado
sudo apt install -y curl

# Instalar Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x ou superior
```

### 3. Instalar PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar e habilitar o serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### 4. Configurar PostgreSQL
```bash
# Acessar PostgreSQL como usuário postgres
sudo -u postgres psql

# Dentro do psql, executar:
CREATE USER appuser WITH PASSWORD 'strongpassword123';
CREATE DATABASE tenant_management_db OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;

# Para sair do psql
\q
```

### 5. Instalar Git
```bash
sudo apt install -y git
```

## Instalação da Aplicação

### 1. Clonar o Repositório
```bash
# Navegar para o diretório desejado
cd /home/$USER

# Clonar o projeto (substitua pela URL do seu repositório)
git clone <URL_DO_SEU_REPOSITORIO> tenant-management
cd tenant-management
```

### 2. Instalar Dependências
```bash
# Instalar todas as dependências
npm install

# Verificar se todas as dependências foram instaladas
npm ls --depth=0
```

### 3. Configurar Variáveis de Ambiente
```bash
# Criar arquivo de ambiente
touch .env

# Editar o arquivo .env
nano .env
```

**Conteúdo do arquivo `.env`:**
```env
# Database Configuration
DATABASE_URL="postgresql://appuser:strongpassword123@localhost:5432/tenant_management_db"

# Application Configuration
NODE_ENV=development
PORT=5000

# Session Configuration
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Application URLs
VITE_API_URL=http://localhost:5000

# Optional: Stripe Configuration (se usar pagamentos)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Configurar Banco de Dados
```bash
# Executar migrações do banco
npm run db:push

# Se houver erro, pode ser necessário criar as tabelas manualmente
# Veja a seção "Esquema do Banco de Dados" abaixo
```

## Esquema do Banco de Dados

Se o comando `npm run db:push` falhar, execute manualmente no PostgreSQL:

```bash
# Conectar ao banco
psql -h localhost -U appuser -d tenant_management_db
```

```sql
-- Criar tabelas principais
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    storage_limit INTEGER NOT NULL,
    max_users INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    is_core BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    phone TEXT,
    logo_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    plan_id INTEGER NOT NULL REFERENCES plans(id),
    storage_used INTEGER NOT NULL DEFAULT 0,
    plan_start_date DATE,
    plan_end_date DATE,
    last_payment_date DATE,
    next_payment_date DATE,
    payment_status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    active BOOLEAN NOT NULL DEFAULT true
);

-- Inserir dados iniciais
INSERT INTO plans (code, name, description, price, storage_limit, max_users) VALUES
('A', 'Plano Básico', 'Funcionalidades essenciais', 99.90, 1000, 5),
('B', 'Plano Intermediário', 'Funcionalidades avançadas', 199.90, 5000, 15),
('C', 'Plano Completo', 'Todas as funcionalidades', 399.90, 20000, 50);

INSERT INTO modules (code, name, description, is_core) VALUES
('core', 'Módulo Core', 'Funcionalidades essenciais do sistema', true),
('products', 'Módulo Produtos', 'Gestão de produtos e inventário', false),
('certificates', 'Módulo Certificados', 'Emissão de certificados básicos', false),
('certificates_advanced', 'Certificados Avançados', 'Funcionalidades avançadas de certificados', false),
('multi_user', 'Multi-usuário', 'Gestão de múltiplos usuários', false);
```

## Executar a Aplicação

### 1. Iniciar em Modo Desenvolvimento
```bash
# Executar aplicação
npm run dev

# A aplicação estará disponível em:
# Frontend: http://localhost:5000
# Backend API: http://localhost:5000/api
```

### 2. Verificar se está Funcionando
```bash
# Em outro terminal, testar a API
curl http://localhost:5000/api/health

# Deve retornar algo como: {"status":"ok"}
```

### 3. Acessar a Aplicação
- Abra o navegador e acesse: `http://localhost:5000`
- Usuário admin padrão será criado automaticamente
- Verifique os logs no terminal para as credenciais iniciais

## Comandos Úteis

### Gerenciamento da Aplicação
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm run start

# Verificar tipos TypeScript
npm run check

# Atualizar esquema do banco
npm run db:push
```

### Gerenciamento do PostgreSQL
```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql

# Parar PostgreSQL
sudo systemctl stop postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Ver status
sudo systemctl status postgresql

# Conectar ao banco
psql -h localhost -U appuser -d tenant_management_db
```

### Logs e Monitoramento
```bash
# Ver logs da aplicação
tail -f /var/log/syslog | grep node

# Monitorar processo Node.js
ps aux | grep node

# Verificar portas em uso
netstat -tlnp | grep :5000
```

## Configuração de Firewall (se necessário)

```bash
# Permitir porta 5000
sudo ufw allow 5000

# Ver status do firewall
sudo ufw status
```

## Configuração para VPS/Servidor

### 1. Usar PM2 para Processo em Background
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar arquivo de configuração PM2
nano ecosystem.config.js
```

**Conteúdo do `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'tenant-management',
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart tenant-management

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

### 2. Configurar Nginx (Opcional)
```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/tenant-management
```

**Conteúdo da configuração Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
}
```

```bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/tenant-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com PostgreSQL**
   ```bash
   # Verificar se o PostgreSQL está rodando
   sudo systemctl status postgresql
   
   # Verificar configuração de conexão
   sudo nano /etc/postgresql/*/main/postgresql.conf
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   ```

2. **Porta 5000 já em uso**
   ```bash
   # Verificar que processo está usando a porta
   sudo lsof -i :5000
   
   # Matar processo se necessário
   sudo kill -9 <PID>
   
   # Ou alterar a porta no arquivo .env
   ```

3. **Erro de permissões no banco**
   ```bash
   # Recriar usuário do banco
   sudo -u postgres psql
   DROP USER IF EXISTS appuser;
   CREATE USER appuser WITH PASSWORD 'strongpassword123';
   GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;
   ```

4. **Erro de dependências**
   ```bash
   # Limpar cache e reinstalar
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

### Logs Importantes
- Logs da aplicação: Terminal onde rodou `npm run dev`
- Logs do PostgreSQL: `/var/log/postgresql/`
- Logs do sistema: `/var/log/syslog`

## Backup e Restauração

### Backup do Banco
```bash
# Fazer backup
pg_dump -h localhost -U appuser -d tenant_management_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql -h localhost -U appuser -d tenant_management_db < backup_YYYYMMDD_HHMMSS.sql
```

### Backup do Código
```bash
# Fazer backup do projeto (excluindo node_modules)
tar --exclude='node_modules' -czf tenant-management-backup.tar.gz /path/to/tenant-management/
```

## Configurações de Segurança

### Para Ambiente de Produção
```bash
# Configurar variáveis de ambiente seguras
# Alterar no .env:
NODE_ENV=production
SESSION_SECRET="use-a-very-strong-random-key-here"

# Configurar SSL/HTTPS com Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Contatos e Suporte

- Para problemas de instalação, verifique os logs em cada etapa
- Documentação do Node.js: https://nodejs.org/docs/
- Documentação do PostgreSQL: https://www.postgresql.org/docs/
- Para problemas específicos da aplicação, consulte os logs da aplicação

---

**Nota**: Este guia foi testado no Ubuntu 20.04/22.04. Para outras distribuições, os comandos podem variar ligeiramente.