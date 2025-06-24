# 🚀 Quick Start - CertificateManager

Guia rápido para colocar o CertificateManager funcionando em poucos minutos.

## ⚡ Setup Rápido (5 minutos)

### 1. Pré-requisitos
Certifique-se de ter instalado:
```bash
node --version  # v20+
psql --version  # PostgreSQL 12+
```

### 2. Clone e Configure
```bash
# Clone o projeto
git clone https://github.com/mcsafx/CertificateManager.git
cd CertificateManager

# Instale dependências
npm install

# Configure banco de dados
sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'DevLocal2024';"
sudo -u postgres psql -c "CREATE DATABASE tenant_management_db OWNER appuser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;"
```

### 3. Variáveis de Ambiente
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

### 4. Inicialize e Execute
```bash
# Aplicar migrações
npm run db:push

# Iniciar aplicação
npm run dev
```

### 5. Acesse o Sistema
```
🌐 URL: http://localhost:5000
👤 Usuário: admin
🔑 Senha: admin123
```

## ✅ Verificação Rápida

Execute este comando para verificar se tudo está funcionando:

```bash
echo "=== VERIFICAÇÃO RÁPIDA ==="
echo "Node.js: $(node --version)"
echo "PostgreSQL: $(sudo systemctl is-active postgresql 2>/dev/null || echo 'manual')"
echo "Aplicação: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000 2>/dev/null || echo 'offline')"
echo "========================="
```

**Resultado esperado:**
```
=== VERIFICAÇÃO RÁPIDA ===
Node.js: v20.19.3
PostgreSQL: active
Aplicação: 200
=========================
```

## 🎯 Primeiros Passos no Sistema

### 1. Login Inicial
- Acesse http://localhost:5000
- Use as credenciais admin/admin123
- Você será direcionado para o dashboard

### 2. Configurar Empresa (Tenant)
- No menu lateral, vá em **Configurações**
- Preencha dados da sua empresa
- Configure logo e informações básicas

### 3. Criar Usuários
- Vá em **Usuários** no menu lateral
- Clique em **Novo Usuário**
- Defina permissões conforme necessário

### 4. Cadastrar Produtos
- Menu **Produtos > Categorias**: Crie categorias de produtos químicos
- Menu **Produtos**: Cadastre seus produtos
- Adicione características técnicas e FISPQ

### 5. Emitir Primeiro Certificado
- Menu **Certificados > Boletins de Entrada**: Registre análises recebidas
- Menu **Certificados > Emitir Certificado**: Gere certificado para cliente
- Baixe o PDF gerado

## 📁 Estrutura do Projeto

```
CertificateManager/
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Código compartilhado
├── docs/           # Documentação (você está aqui!)
├── scripts/        # Scripts utilitários
└── migrations/     # Migrações do banco
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar em modo desenvolvimento
npm run build            # Build para produção
npm run start            # Executar build de produção

# Banco de dados
npm run db:push          # Aplicar mudanças no schema
npm run db:generate      # Gerar migrations (se houver)

# Verificações
npm run check            # TypeScript type checking (se configurado)
```

## 🆘 Problemas Comuns

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conexão manual
psql -h localhost -U appuser -d tenant_management_db -c "SELECT 1;"
```

### Erro: "Port 5000 already in use"
```bash
# Ver o que está usando a porta
sudo lsof -i :5000

# Matar processo se necessário
sudo kill -9 [PID]
```

### Erro: "Module not found"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

## 🎓 Próximos Passos

### Para Desenvolvimento
- [Setup Completo de Desenvolvimento](../development/setup.md)
- [Workflow Git](../development/git-workflow.md)
- [Sistema de Módulos](../features/modules-system.md)

### Para Deploy
- [Instalação Local Completa](../deployment/local-installation.md)
- [Deploy em VPS](../deployment/vps-deployment.md)
- [Deploy na AWS](../deployment/aws-deployment.md)

### Para Usuários
- [Visão Geral Completa](overview.md)
- [Sistema de Permissões](../features/permissions-system.md)
- [Guia de Funcionalidades](../features/)

---

**🎉 Parabéns! Você tem o CertificateManager rodando localmente.**

Para dúvidas ou problemas, consulte a [documentação completa](../README.md) ou abra uma [issue](../../issues).