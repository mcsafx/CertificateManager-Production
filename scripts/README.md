# 🛠️ Scripts Utilitários - CertificateManager

Coleção de scripts para automação de tarefas comuns no CertificateManager.

## 📁 Estrutura

```
scripts/
├── setup/          # Scripts de configuração inicial
├── database/       # Scripts de banco de dados
├── deployment/     # Scripts de deploy e produção
├── maintenance/    # Scripts de manutenção
└── README.md       # Este arquivo
```

## 🚀 Scripts de Setup

### `setup/install-deps.sh`
Instala todas as dependências do sistema automaticamente.

```bash
# Executar
./scripts/setup/install-deps.sh

# O que faz:
# - Instala Node.js 20
# - Instala PostgreSQL
# - Configura usuário do banco
# - Instala dependências do projeto
```

### `setup/configure-env.sh`
Configura arquivos de ambiente automaticamente.

```bash
# Executar
./scripts/setup/configure-env.sh

# Opções:
./scripts/setup/configure-env.sh development  # Para desenvolvimento
./scripts/setup/configure-env.sh production   # Para produção
```

## 🗄️ Scripts de Banco de Dados

### `database/seed.sql`
Popula banco com dados iniciais (planos, módulos, usuário admin).

```bash
# Executar
psql -h localhost -U appuser -d tenant_management_db -f scripts/database/seed.sql
```

### `database/backup.sh`
Cria backup completo do banco de dados.

```bash
# Backup com timestamp
./scripts/database/backup.sh

# Backup com nome específico
./scripts/database/backup.sh meu_backup
```

### `database/restore.sh`
Restaura backup do banco de dados.

```bash
# Restaurar backup específico
./scripts/database/restore.sh backup_20241224_120000.sql
```

## 🚀 Scripts de Deploy

### `deployment/deploy.sh`
Script completo de deploy para produção.

```bash
# Deploy completo
./scripts/deployment/deploy.sh

# Deploy com build apenas
./scripts/deployment/deploy.sh --build-only
```

### `deployment/health-check.sh`
Verifica se aplicação está funcionando corretamente.

```bash
# Verificação completa
./scripts/deployment/health-check.sh

# Verificação silenciosa (para CI/CD)
./scripts/deployment/health-check.sh --silent
```

## 🔧 Scripts de Manutenção

### `maintenance/cleanup.sh`
Limpa arquivos temporários e cache.

```bash
# Limpeza básica
./scripts/maintenance/cleanup.sh

# Limpeza profunda (inclui logs antigos)
./scripts/maintenance/cleanup.sh --deep
```

### `maintenance/update-deps.sh`
Atualiza dependências do projeto.

```bash
# Atualização segura (minor/patch apenas)
./scripts/maintenance/update-deps.sh

# Atualização completa (incluindo major)
./scripts/maintenance/update-deps.sh --major
```

## 📋 Como Usar

### 1. Dar Permissão de Execução
```bash
# Dar permissão a todos os scripts
find scripts/ -name "*.sh" -exec chmod +x {} \;

# Ou individualmente
chmod +x scripts/setup/install-deps.sh
```

### 2. Executar Scripts
```bash
# Da raiz do projeto
./scripts/setup/install-deps.sh

# Ou de qualquer lugar
/caminho/para/CertificateManager/scripts/setup/install-deps.sh
```

### 3. Ver Ajuda de um Script
```bash
# A maioria dos scripts aceita --help
./scripts/setup/install-deps.sh --help
```

## 🎯 Workflows Comuns

### Setup Inicial (Primeira Vez)
```bash
# 1. Instalar dependências do sistema
./scripts/setup/install-deps.sh

# 2. Configurar ambiente
./scripts/setup/configure-env.sh development

# 3. Popular banco com dados iniciais
psql -h localhost -U appuser -d tenant_management_db -f scripts/database/seed.sql

# 4. Verificar se tudo está funcionando
./scripts/deployment/health-check.sh
```

### Deploy para Produção
```bash
# 1. Fazer backup do banco
./scripts/database/backup.sh

# 2. Deploy da aplicação
./scripts/deployment/deploy.sh

# 3. Verificar se deploy foi bem-sucedido
./scripts/deployment/health-check.sh
```

### Manutenção Semanal
```bash
# 1. Backup do banco
./scripts/database/backup.sh

# 2. Limpeza de arquivos temporários
./scripts/maintenance/cleanup.sh

# 3. Verificar atualizações de dependências
./scripts/maintenance/update-deps.sh
```

## ⚠️ Importantes

### Segurança
- **Nunca** commite senhas ou tokens nos scripts
- Use variáveis de ambiente para dados sensíveis
- Scripts de produção devem validar entrada do usuário

### Compatibilidade
- Scripts testados no Ubuntu 20.04+
- Podem precisar de adaptação para outros sistemas
- Sempre teste em ambiente de desenvolvimento primeiro

### Logs
- Scripts geram logs em `scripts/logs/` (se aplicável)
- Use `--verbose` para output detalhado
- Use `--silent` para execução em CI/CD

## 🐛 Troubleshooting

### Script não executa
```bash
# Verificar permissões
ls -la scripts/setup/install-deps.sh

# Dar permissão
chmod +x scripts/setup/install-deps.sh
```

### Erro de dependência
```bash
# Verificar se script tem todas dependências
./scripts/setup/install-deps.sh --check-deps
```

### Script trava
```bash
# Matar processo
pkill -f "install-deps.sh"

# Ver processos relacionados
ps aux | grep "scripts"
```

## 📞 Suporte

- **Issues**: [GitHub Issues](../../issues)
- **Documentação**: [docs/](../docs/)
- **Scripts personalizados**: Adicione em pasta apropriada

---

**💡 Dica**: Use `--help` em qualquer script para ver opções disponíveis.