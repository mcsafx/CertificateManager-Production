# Guia Completo: Git para Desenvolvimento

## 🎯 Conceitos Fundamentais

### O que é Git?
Git é um **sistema de controle de versão** que:
- **Rastreia mudanças** no seu código ao longo do tempo
- **Cria snapshots** (fotos) do projeto em momentos específicos
- **Permite voltar** a versões anteriores se algo der errado
- **Facilita colaboração** entre desenvolvedores

### Analogia Prática
Imagine que você está escrevendo um livro:
- **Commit** = Salvar uma versão completa do capítulo
- **Branch** = Escrever uma versão alternativa da história
- **Merge** = Combinar duas versões diferentes
- **Repository** = A pasta onde está todo o livro

---

## 🔍 Verificar se Git está Instalado

### Passo 1: Testar Instalação
```bash
git --version
```

**Resposta Esperada:**
```
git version 2.34.1
```

**Se não estiver instalado:**
```
Command 'git' not found
```

### Passo 2: Instalar Git (se necessário)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y git

# Verificar instalação
git --version
```

---

## 👤 Configurar Credenciais do Git

### Passo 1: Configurar Nome e Email
```bash
# Configurar seu nome (aparece nos commits)
git config --global user.name "Seu Nome Completo"

# Configurar seu email (mesmo do GitHub)
git config --global user.email "seu.email@exemplo.com"

# Configurar editor padrão
git config --global core.editor "nano"
```

### Passo 2: Verificar Configurações
```bash
# Ver todas as configurações
git config --list

# Ver configurações específicas
git config user.name
git config user.email
```

**Exemplo de saída:**
```
user.name=Magnus Silva
user.email=magnus@exemplo.com
core.editor=nano
```

---

## 🏗️ Inicializar Git no Projeto

### Se é um projeto NOVO:
```bash
# Navegar para o projeto
cd ~/CertificateManager

# Inicializar repositório Git
git init

# Verificar status
git status
```

### Se você CLONOU do GitHub:
```bash
# O Git já está configurado
cd ~/CertificateManager

# Verificar origem remota
git remote -v
```

---

## 📝 Workflow Básico: Suas Primeiras Mudanças

### Passo 1: Verificar Status (sempre primeiro!)
```bash
git status
```

**Interpretando as cores:**
- 🔴 **Vermelho** = Arquivos modificados, não adicionados
- 🟢 **Verde** = Arquivos prontos para commit
- ⚪ **Branco** = Nada para commitar

### Passo 2: Adicionar Arquivos para Commit
```bash
# Adicionar arquivo específico
git add caminho/do/arquivo.ts

# Adicionar TODOS os arquivos modificados
git add .

# Adicionar apenas arquivos com determinada extensão
git add *.ts

# Ver o que foi adicionado
git status
```

### Passo 3: Criar Commit (snapshot)
```bash
# Commit com mensagem descritiva
git commit -m "Descrição clara do que foi alterado"

# Exemplos de boas mensagens:
git commit -m "Adicionar autenticação de usuários"
git commit -m "Corrigir bug no cálculo de certificados"
git commit -m "Melhorar interface do dashboard"
```

### Passo 4: Enviar para GitHub
```bash
# Enviar para a branch principal
git push origin main

# Ou se usar 'master'
git push origin master
```

---

## 🔄 Workflow Diário Recomendado

### Antes de Começar a Trabalhar:
```bash
# 1. Baixar últimas mudanças do GitHub
git pull origin main

# 2. Verificar status
git status

# 3. Ver em qual branch você está
git branch
```

### Após Fazer Mudanças Significativas:
```bash
# 1. Verificar o que mudou
git status
git diff  # Ver mudanças linha por linha

# 2. Adicionar mudanças
git add .

# 3. Commitar
git commit -m "Descrição das mudanças"

# 4. Enviar para GitHub
git push origin main
```

---

## 🌳 Trabalhando com Branches

### Conceito de Branch
Uma **branch** é como uma "linha do tempo" paralela onde você pode:
- Desenvolver features novas sem afetar o código principal
- Testar mudanças experimentais
- Trabalhar em equipe sem conflitos

### Comandos de Branch
```bash
# Ver todas as branches
git branch

# Criar nova branch
git branch feature/nova-funcionalidade

# Trocar para a branch
git checkout feature/nova-funcionalidade

# Criar E trocar em um comando
git checkout -b feature/nova-funcionalidade

# Voltar para main
git checkout main

# Excluir branch (depois de fazer merge)
git branch -d feature/nova-funcionalidade
```

### Workflow com Branches
```bash
# 1. Criar branch para nova feature
git checkout -b feature/melhorar-dashboard

# 2. Fazer suas alterações...
# (editar código)

# 3. Commitar na branch
git add .
git commit -m "Melhorar layout do dashboard"

# 4. Enviar branch para GitHub
git push origin feature/melhorar-dashboard

# 5. Voltar para main
git checkout main

# 6. Fazer merge da feature
git merge feature/melhorar-dashboard

# 7. Enviar main atualizada
git push origin main
```

---

## 🔗 Conectar com GitHub

### Se ainda não conectou:
```bash
# Adicionar repositório remoto
git remote add origin https://github.com/seususuario/seuprojeto.git

# Verificar
git remote -v

# Enviar pela primeira vez
git push -u origin main
```

### Se já está conectado:
```bash
# Verificar conexão
git remote -v

# Deve mostrar algo como:
# origin  https://github.com/mcsafx/CertificateManager.git (fetch)
# origin  https://github.com/mcsafx/CertificateManager.git (push)
```

---

## 📚 Comandos Essenciais Diários

### Consulta e Status
```bash
git status                    # Status atual
git log --oneline            # Histórico de commits
git diff                     # Ver mudanças não commitadas
git diff HEAD~1              # Ver mudanças do último commit
git branch                   # Ver branches locais
git remote -v                # Ver repositórios remotos
```

### Operações Básicas
```bash
git add .                    # Adicionar todos os arquivos
git commit -m "mensagem"     # Criar commit
git push origin main         # Enviar para GitHub
git pull origin main         # Baixar do GitHub
git checkout -b nova-branch  # Criar e trocar branch
git merge branch-name        # Fazer merge
```

### Comandos de Emergência
```bash
# Desfazer mudanças não commitadas
git checkout -- arquivo.ts

# Voltar ao último commit (CUIDADO!)
git reset --hard HEAD

# Ver histórico detalhado
git log --graph --oneline --all

# Desfazer último commit (mantendo mudanças)
git reset HEAD~1
```

---

## 🎯 Boas Práticas

### Mensagens de Commit
**✅ Boas mensagens:**
```bash
git commit -m "Adicionar sistema de login"
git commit -m "Corrigir bug na validação de certificados"
git commit -m "Atualizar dependências do projeto"
git commit -m "Melhorar performance do dashboard"
```

**❌ Mensagens ruins:**
```bash
git commit -m "fix"
git commit -m "changes"
git commit -m "update stuff"
git commit -m "working"
```

### Quando Fazer Commit
**✅ Commit quando:**
- Implementou uma funcionalidade completa
- Corrigiu um bug
- Adicionou configuração importante
- Fez refatoração significativa
- Antes de tentar algo experimental

**❌ Evite commits:**
- Com código que não compila
- Com muitas mudanças não relacionadas
- Apenas para "backup" diário sem mudanças reais

### Frequência de Push
```bash
# Pelo menos:
git push origin main  # No final do dia
git push origin main  # Após implementar feature importante
git push origin main  # Antes de mudanças experimentais
```

---

## 🚨 Resolução de Problemas Comuns

### Problema: "Merge Conflict"
```bash
# Quando há conflitos ao fazer pull
git pull origin main

# Git mostra arquivos com conflito
# Edite os arquivos, escolha qual versão manter
# Depois:
git add .
git commit -m "Resolver conflitos de merge"
git push origin main
```

### Problema: Esqueceu de fazer pull
```bash
# Se deu erro ao fazer push
git pull origin main --rebase
git push origin main
```

### Problema: Quer desfazer mudanças
```bash
# Desfazer arquivo específico
git checkout -- arquivo.ts

# Desfazer todas as mudanças não commitadas
git reset --hard HEAD

# Voltar para commit anterior (CUIDADO!)
git reset --hard HEAD~1
```

---

## 🔄 Exemplo Prático Completo

### Cenário: Você quer adicionar nova funcionalidade

```bash
# 1. Verificar status atual
cd ~/CertificateManager
git status
git pull origin main

# 2. Criar branch para a feature
git checkout -b feature/novo-relatorio

# 3. Fazer suas alterações...
# (editar arquivos no VS Code, Claude Code, etc.)

# 4. Verificar mudanças
git status
git diff

# 5. Adicionar e commitar
git add .
git commit -m "Adicionar relatório de certificados emitidos"

# 6. Enviar branch para GitHub
git push origin feature/novo-relatorio

# 7. Voltar para main e fazer merge
git checkout main
git merge feature/novo-relatorio

# 8. Enviar main atualizada
git push origin main

# 9. Limpar branch (opcional)
git branch -d feature/novo-relatorio
```

---

## 📋 Checklist Diário

### Antes de começar:
- [ ] `git status` - verificar estado
- [ ] `git pull origin main` - baixar atualizações
- [ ] `git branch` - conferir branch atual

### Durante o trabalho:
- [ ] Fazer commits frequentes com mensagens claras
- [ ] `git status` antes de cada commit
- [ ] Testar código antes de commitar

### Ao final do dia:
- [ ] `git add .` - adicionar todas as mudanças
- [ ] `git commit -m "Resumo do que foi feito hoje"`
- [ ] `git push origin main` - enviar para GitHub
- [ ] Verificar no GitHub se chegou

---

## 🎓 Próximos Passos

Após dominar esses comandos básicos, você pode aprender:

1. **GitHub Desktop** - Interface gráfica para Git
2. **Pull Requests** - Revisão de código em equipe  
3. **Git Flow** - Metodologia avançada de branches
4. **Hooks** - Automações no Git
5. **Submodules** - Projetos dentro de projetos

**Lembre-se:** Git parece complicado no início, mas com prática diária fica natural. Comece com o workflow básico e vá evoluindo gradualmente!

---

**💡 Dica final:** Use `git status` SEMPRE antes de qualquer operação. É seu melhor amigo para entender o estado atual do projeto!