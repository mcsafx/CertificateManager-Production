# 💻 Setup de Desenvolvimento - CertificateManager

Guia completo para configurar um ambiente de desenvolvimento profissional para o CertificateManager.

## 🎯 Visão Geral

Este guia configurará um ambiente de desenvolvimento completo com:
- ✅ Hot reload para frontend e backend
- ✅ Debug configurado para VS Code
- ✅ TypeScript com verificação rigorosa
- ✅ Banco de dados local com dados de teste
- ✅ Feature flags para desenvolvimento
- ✅ Ferramentas de produtividade

## 📋 Pré-requisitos

### Sistema Operacional
- **Ubuntu 20.04+** (recomendado)
- **macOS 10.15+** ou **Windows 10+ com WSL2**

### Ferramentas Essenciais
```bash
# Node.js 20+
node --version  # v20.x.x

# PostgreSQL 12+
psql --version  # psql (PostgreSQL) 12+

# Git
git --version  # git version 2.x.x

# Editor recomendado: VS Code
code --version  # 1.80+
```

## 🛠️ Instalação das Ferramentas

### 1. Node.js 20
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2. PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Iniciar serviços
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### 3. VS Code (Recomendado)
```bash
# Ubuntu/Debian
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code
```

## 📁 Setup do Projeto

### 1. Clone e Configuração Inicial
```bash
# Clone o repositório
git clone https://github.com/mcsafx/CertificateManager.git
cd CertificateManager

# Verificar estrutura
ls -la
# Deve mostrar: client/ server/ shared/ docs/ scripts/
```

### 2. Configurar Banco de Dados
```bash
# Criar usuário e banco
sudo -u postgres psql << 'EOF'
-- Criar usuário para desenvolvimento
CREATE USER devuser WITH PASSWORD 'DevPassword2024';

-- Criar banco de desenvolvimento
CREATE DATABASE cert_manager_dev OWNER devuser;

-- Criar banco de teste
CREATE DATABASE cert_manager_test OWNER devuser;

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE cert_manager_dev TO devuser;
GRANT ALL PRIVILEGES ON DATABASE cert_manager_test TO devuser;

-- Sair
\q
EOF
```

### 3. Configurar Variáveis de Ambiente
```bash
# Criar arquivo de desenvolvimento
cat > .env.development << 'EOF'
# Database
DATABASE_URL="postgresql://devuser:DevPassword2024@localhost:5432/cert_manager_dev"

# Application
NODE_ENV=development
PORT=5000
DEBUG=true

# Session
SESSION_SECRET="super-secret-dev-key-change-in-production"

# Frontend
VITE_API_URL=http://localhost:5000
VITE_DEBUG=true

# Development
NODE_OPTIONS="--max-old-space-size=1024"
ENABLE_SOURCE_MAPS=true
EOF

# Criar arquivo de teste
cat > .env.test << 'EOF'
DATABASE_URL="postgresql://devuser:DevPassword2024@localhost:5432/cert_manager_test"
NODE_ENV=test
SESSION_SECRET="test-secret"
EOF

# Criar link para .env padrão
ln -sf .env.development .env
```

### 4. Instalar Dependências
```bash
# Instalar dependências de produção e desenvolvimento
npm install

# Verificar se todas foram instaladas
npm ls --depth=0
```

### 5. Configurar Banco de Dados
```bash
# Aplicar migrações
npm run db:push

# Verificar se tabelas foram criadas
psql -h localhost -U devuser -d cert_manager_dev -c "\dt"

# Inserir dados iniciais (se script existir)
# npm run db:seed
```

## 🔧 Configuração do VS Code

### 1. Extensões Recomendadas
Instale estas extensões para melhor experiência:

```bash
# Instalar via comando
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension ms-vscode.vscode-json
code --install-extension ms-python.python
code --install-extension humao.rest-client
```

**Lista de extensões:**
- **ES7+ React/Redux/React-Native snippets**: Snippets para React
- **TypeScript Hero**: Auto import e organização
- **Prettier**: Formatação automática de código
- **Tailwind CSS IntelliSense**: Autocomplete para Tailwind
- **REST Client**: Testar APIs diretamente no VS Code
- **GitLens**: Melhor integração com Git

### 2. Configuração do Workspace
```bash
# Criar pasta de configuração do VS Code
mkdir -p .vscode

# Configurações do workspace
cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
EOF

# Configurações de debug
cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "tsx/cjs"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
EOF

# Tarefas do VS Code
cat > .vscode/tasks.json << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Server",
      "type": "shell",
      "command": "npm run dev",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      },
      "isBackground": true
    },
    {
      "label": "TypeScript Check",
      "type": "shell",
      "command": "npx tsc --noEmit",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    }
  ]
}
EOF
```

## 🚀 Execução em Modo Desenvolvimento

### 1. Método Tradicional
```bash
# Terminal 1: Backend + Frontend integrado
npm run dev

# A aplicação estará disponível em:
# http://localhost:5000
```

### 2. Método Separado (Recomendado para Debug)
```bash
# Terminal 1: Backend
cd server
npm run dev:server

# Terminal 2: Frontend (se separado)
cd client
npm run dev:client
```

### 3. Via VS Code
- Pressione `Ctrl+Shift+P`
- Digite "Tasks: Run Task"
- Selecione "Start Dev Server"

## 🔍 Debug e Desenvolvimento

### 1. Debug do Backend
- Abra VS Code
- Vá em "Run and Debug" (Ctrl+Shift+D)
- Selecione "Debug Backend"
- Coloque breakpoints nos arquivos .ts
- Execute a configuração

### 2. Logs Estruturados
```typescript
// Usar console.log estruturado no desenvolvimento
console.log('[DEBUG]', {
  action: 'user_login',
  userId: user.id,
  tenantId: user.tenantId,
  timestamp: new Date().toISOString()
});
```

### 3. Hot Reload
O sistema possui hot reload configurado:
- **Frontend**: Mudanças em `client/` recarregam automaticamente
- **Backend**: Mudanças em `server/` reiniciam o servidor automaticamente

## 🧪 Testes e Qualidade

### 1. Verificação de Tipos
```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Verificar tipos continuamente
npx tsc --noEmit --watch
```

### 2. Linting (Futuro)
```bash
# Se ESLint estiver configurado
npm run lint
npm run lint:fix
```

### 3. Formatação
```bash
# Se Prettier estiver configurado
npm run format
```

## 📊 Monitoramento de Desenvolvimento

### 1. Logs da Aplicação
```bash
# Ver logs em tempo real
tail -f logs/app.log  # se configurado

# Ou usar npm run dev com output detalhado
DEBUG=* npm run dev
```

### 2. Monitorar Banco de Dados
```bash
# Ver conexões ativas
psql -h localhost -U devuser -d cert_manager_dev -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Ver tamanho do banco
psql -h localhost -U devuser -d cert_manager_dev -c "SELECT pg_size_pretty(pg_database_size('cert_manager_dev'));"
```

### 3. Performance
```bash
# Monitorar uso de recursos
htop

# Verificar uso de porta
lsof -i :5000
```

## 🔄 Workflow de Desenvolvimento Diário

### 1. Início do Dia
```bash
# Atualizar código
git pull origin main

# Verificar dependências
npm install  # se package.json mudou

# Aplicar migrações (se houver novas)
npm run db:push

# Iniciar desenvolvimento
npm run dev
```

### 2. Durante o Desenvolvimento
```bash
# Commit frequente
git add .
git commit -m "Implementar funcionalidade X"

# Push para backup
git push origin feature/minha-branch
```

### 3. Final do Dia
```bash
# Verificar qualidade
npx tsc --noEmit  # se configurado
# npm run lint     # se configurado
# npm run test     # se configurado

# Commit final
git add .
git commit -m "Finalizar trabalho do dia - funcionalidade Y"
git push origin feature/minha-branch
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar se usuário existe
sudo -u postgres psql -c "\du"

# Recriar usuário se necessário
sudo -u postgres psql -c "DROP USER IF EXISTS devuser; CREATE USER devuser WITH PASSWORD 'DevPassword2024';"
```

#### 2. Porta 5000 Ocupada
```bash
# Ver o que está usando a porta
sudo lsof -i :5000

# Matar processo
sudo kill -9 [PID]

# Ou usar porta diferente
PORT=5001 npm run dev
```

#### 3. Erro de Dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 4. Erro de TypeScript
```bash
# Verificar versão do TypeScript
npx tsc --version

# Reinstalar TypeScript
npm uninstall typescript
npm install typescript@latest --save-dev
```

## 📖 Recursos Adicionais

### Documentação
- [Guia Git](git-workflow.md) - Workflow completo com Git
- [Sistema de Módulos](../features/modules-system.md) - Como funcionam os módulos
- [API Documentation](../api/endpoints.md) - Documentação da API

### Ferramentas Úteis
- **Postman**: Para testar APIs
- **pgAdmin**: Interface gráfica para PostgreSQL  
- **Git Kraken**: Interface gráfica para Git
- **Docker**: Para containerização (opcional)

---

**🎉 Ambiente de desenvolvimento configurado com sucesso!**

Você agora tem um ambiente profissional para desenvolver no CertificateManager com hot reload, debug, e todas as ferramentas necessárias.