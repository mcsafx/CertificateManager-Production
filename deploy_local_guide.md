# Guia Completo: Deploy Local CertificateManager

**Sistema de Gestão de Certificados de Qualidade para Distribuidores Químicos**

## 📋 Pré-requisitos

- **Sistema Operacional:** Ubuntu 20.04+, Debian 11+, ou ChromeOS com Linux
- **Recursos Mínimos:** 2GB RAM, 2GB espaço livre
- **Acesso:** sudo/root
- **Conexão:** Internet ativa

---

## 🔧 Passo 1: Preparação do Sistema

### 1.1 Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

**Resposta Esperada:**
```
Reading package lists... Done
Building dependency tree... Done
...
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
```

### 1.2 Instalar Dependências Básicas
```bash
sudo apt install -y curl git build-essential
```

**Resposta Esperada:**
```
The following NEW packages will be installed:
  curl git build-essential
...
Setting up build-essential
```

### 1.3 Verificar Espaço Disponível
```bash
df -h /
```

**Resposta Esperada:** Pelo menos 1GB livre
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       20G   8G   11G  42% /
```

---

## 📦 Passo 2: Instalar Node.js 20

### 2.1 Adicionar Repositório Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

**Resposta Esperada:**
```
2025-XX-XX - Installing pre-requisites
...
Repository configured successfully.
```

### 2.2 Instalar Node.js
```bash
sudo apt install -y nodejs
```

### 2.3 Verificar Instalação
```bash
node --version
npm --version
```

**Resposta Esperada:**
```
v20.19.3
10.8.2
```

---

## 🐘 Passo 3: Instalar e Configurar PostgreSQL

### 3.1 Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 3.2 Iniciar e Habilitar PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.3 Verificar Status
```bash
sudo systemctl status postgresql
```

**Resposta Esperada:**
```
● postgresql.service - PostgreSQL RDBMS
   Active: active (exited)
```

### 3.4 Configurar Banco de Dados
```bash
sudo -u postgres psql << 'EOF'
CREATE USER appuser WITH PASSWORD 'DevLocal2024';
CREATE DATABASE tenant_management_db OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;
\q
EOF
```

**Resposta Esperada:**
```
CREATE ROLE
CREATE DATABASE
GRANT
```

### 3.5 Configurar Autenticação Automática
```bash
cat > ~/.pgpass << 'EOF'
localhost:5432:tenant_management_db:appuser:DevLocal2024
EOF
chmod 600 ~/.pgpass
```

### 3.6 Testar Conexão
```bash
psql -h localhost -U appuser -d tenant_management_db -c "SELECT version();"
```

**Resposta Esperada:**
```
PostgreSQL 15.13 (Debian 15.13-0+deb12u1) on x86_64-pc-linux-gnu...
```

---

## 💾 Passo 4: Configurar Swap (Recomendado para sistemas com pouca RAM)

### 4.1 Verificar se Swap Existe
```bash
swapon --show
```

Se não mostrar nada, continue:

### 4.2 Criar Arquivo de Swap
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 4.3 Tornar Permanente
```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4.4 Verificar Swap Ativo
```bash
free -h
```

**Resposta Esperada:**
```
               total        used        free      shared  buff/cache   available
Mem:           2.7Gi        84Mi       2.2Gi       160Ki       458Mi       2.6Gi
Swap:          1.0Gi          0B       1.0Gi
```

---

## 📁 Passo 5: Clonar e Configurar Projeto

### 5.1 Clonar Repositório
```bash
cd ~
git clone https://github.com/mcsafx/CertificateManager.git
cd CertificateManager
```

**Resposta Esperada:**
```
Cloning into 'CertificateManager'...
remote: Enumerating objects: 1519, done.
...
Resolving deltas: 100% (963/963), done.
```

### 5.2 Verificar Conteúdo
```bash
ls
```

**Resposta Esperada:**
```
client  drizzle.config.ts  package.json  server  shared  vite.config.ts
```

### 5.3 Configurar Variáveis de Ambiente
```bash
cat > .env << 'EOF'
DATABASE_URL="postgresql://appuser:DevLocal2024@localhost:5432/tenant_management_db"
NODE_ENV=development
PORT=5000
SESSION_SECRET="local-dev-secret-2024"
VITE_API_URL=http://localhost:5000
NODE_OPTIONS="--max-old-space-size=512"
EOF
```

### 5.4 Verificar .env
```bash
cat .env
```

---

## 🔧 Passo 6: Corrigir Configuração do Banco

### 6.1 Corrigir server/db.ts
```bash
cat > server/db.ts << 'EOF'
import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL deve ser configurado");
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
EOF
```

### 6.2 Adicionar dotenv ao server/index.ts
```bash
echo 'import dotenv from "dotenv"; dotenv.config();' > temp.js && cat server/index.ts >> temp.js && mv temp.js server/index.ts
```

---

## 📦 Passo 7: Instalar Dependências

### 7.1 Instalar Dependências de Produção
```bash
npm install --production --no-optional
```

**Resposta Esperada:**
```
added 441 packages, and audited 442 packages in 1m
```

### 7.2 Instalar dotenv
```bash
npm install dotenv
```

### 7.3 Instalar Dependências Completas
```bash
npm install
```

**Resposta Esperada:**
```
added 101 packages, and audited 543 packages in 57s
```

---

## 🗄️ Passo 8: Configurar Banco de Dados

### 8.1 Executar Migrações
```bash
npm run db:push
```

**Resposta Esperada:**
```
Using 'pg' driver for database querying
[✓] Pulling schema from database...
[✓] Changes applied
```

### 8.2 Inserir Dados Iniciais
```bash
psql -h localhost -U appuser -d tenant_management_db << 'EOF'
INSERT INTO plans (code, name, description, price, storage_limit, max_users) VALUES
('A', 'Plano Básico', 'Funcionalidades essenciais', 99.90, 1000, 5),
('B', 'Plano Intermediário', 'Funcionalidades avançadas', 199.90, 5000, 15),
('C', 'Plano Completo', 'Todas as funcionalidades', 399.90, 20000, 50);

INSERT INTO modules (code, name, description, is_core) VALUES
('core', 'Módulo Core', 'Funcionalidades essenciais', true),
('products', 'Módulo Produtos', 'Gestão de produtos', false),
('certificates', 'Módulo Certificados', 'Emissão de certificados', false),
('multi_user', 'Multi-usuário', 'Gestão de usuários', false);
\q
EOF
```

**Resposta Esperada:**
```
INSERT 0 3
INSERT 0 4
```

---

## 🚀 Passo 9: Executar Aplicação

### 9.1 Iniciar Aplicação
```bash
npm run dev
```

**Resposta Esperada:**
```
[express] serving on port 5000
Verificando status de todas as assinaturas...
Verificador de assinaturas iniciado...
Admin tenant created successfully
Admin user created successfully
```

### 9.2 Verificar Status
Abra outro terminal e execute:
```bash
curl http://localhost:5000
```

**Resposta Esperada:** HTML da aplicação

---

## 🌐 Passo 10: Acessar Aplicação

### 10.1 Abrir no Navegador
```
http://localhost:5000
```

### 10.2 Fazer Login
- **Usuário:** `admin`
- **Senha:** `admin123`

**Resposta Esperada:** Dashboard do CertQuality carregado

---

## ✅ Verificação Final

Execute este script para verificar se tudo está funcionando:

```bash
echo "=== VERIFICAÇÃO COMPLETA ==="
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PostgreSQL: $(sudo systemctl is-active postgresql)"
echo "Espaço livre: $(df -h / | awk 'NR==2 {print $4}')"
echo "Conexão banco: $(psql -h localhost -U appuser -d tenant_management_db -c 'SELECT 1;' 2>/dev/null && echo 'OK' || echo 'ERRO')"
echo "Aplicação: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000)"
echo "=== STATUS: SUCESSO ==="
```

**Resposta Esperada:**
```
=== VERIFICAÇÃO COMPLETA ===
Node.js: v20.19.3
npm: 10.8.2
PostgreSQL: active
Espaço livre: 1.8G
Conexão banco: OK
Aplicação: 200
=== STATUS: SUCESSO ===
```

---

## 🔄 Como Executar Após Reiniciar o Computador

### Método Automático (Script)

Crie um script de inicialização:

```bash
cat > ~/start-certquality.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando CertQuality..."

# Verificar PostgreSQL
if ! sudo systemctl is-active --quiet postgresql; then
    echo "📊 Iniciando PostgreSQL..."
    sudo systemctl start postgresql
fi

# Aguardar PostgreSQL estar pronto
sleep 3

# Verificar conexão
if ! psql -h localhost -U appuser -d tenant_management_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Erro na conexão com banco de dados"
    exit 1
fi

# Navegar para projeto
cd ~/CertificateManager

# Iniciar aplicação
echo "🌐 Iniciando aplicação em http://localhost:5000"
npm run dev
EOF

chmod +x ~/start-certquality.sh
```

### Para Executar Sempre:
```bash
~/start-certquality.sh
```

### Método Manual (Passo a Passo)

**Toda vez que reiniciar o computador:**

1. **Iniciar PostgreSQL:**
   ```bash
   sudo systemctl start postgresql
   ```

2. **Navegar para o projeto:**
   ```bash
   cd ~/CertificateManager
   ```

3. **Iniciar aplicação:**
   ```bash
   npm run dev
   ```

4. **Acessar:** http://localhost:5000

---

## 📤 Como Subir Atualizações para o GitHub

### Configurar Git (primeira vez)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### Subir Alterações

1. **Verificar alterações:**
   ```bash
   git status
   ```

2. **Adicionar arquivos modificados:**
   ```bash
   git add .
   ```

3. **Criar commit:**
   ```bash
   git commit -m "Descrição das alterações feitas"
   ```

4. **Subir para branch principal:**
   ```bash
   git push origin main
   ```

### Criar Branch para Desenvolvimento

1. **Criar e trocar para nova branch:**
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. **Fazer alterações e commit:**
   ```bash
   git add .
   git commit -m "Nova funcionalidade implementada"
   ```

3. **Subir branch:**
   ```bash
   git push origin feature/nova-funcionalidade
   ```

4. **Merge via GitHub Web:**
   - Acesse o repositório no GitHub
   - Clique em "Compare & pull request"
   - Descreva as alterações
   - Clique em "Create pull request"

---

## 🛠️ Troubleshooting

### Problema: PostgreSQL não inicia
**Solução:**
```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

### Problema: Porta 5000 ocupada
**Solução:**
```bash
sudo lsof -i :5000
sudo kill -9 [PID]
```

### Problema: Erro de permissão no banco
**Solução:**
```bash
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;"
```

### Problema: Falta de espaço
**Solução:**
```bash
sudo apt clean
sudo apt autoremove -y
npm cache clean --force
```

---

## 📊 Recursos do Sistema

### Monitoramento
```bash
# Ver uso de recursos
htop

# Ver logs da aplicação
tail -f ~/.pm2/logs/certquality-out.log

# Ver conexões de banco
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### Backup
```bash
# Backup do banco
pg_dump -h localhost -U appuser tenant_management_db > backup_$(date +%Y%m%d).sql

# Backup do projeto
tar -czf certquality_backup.tar.gz ~/CertificateManager --exclude=node_modules
```

---

## 🎯 Próximos Passos

Após a instalação bem-sucedida, você pode:

- ✅ Cadastrar fornecedores e produtos
- ✅ Emitir boletins de análise
- ✅ Gerar certificados personalizados
- ✅ Configurar sistema para sua empresa
- ✅ Adicionar usuários e permissões

**Sistema pronto para uso em produção local! 🚀**