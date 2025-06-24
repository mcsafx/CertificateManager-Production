# Guia de Inicialização Diária: CertificateManager

## 🌅 Ao Ligar o Computador

Quando você liga o computador, todos os serviços estão parados. Siga este guia rápido para colocar tudo em funcionamento.

## 🚀 Inicialização Rápida (2 minutos)

### Passo 1: Verificar e Iniciar PostgreSQL
```bash
# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Se estiver parado (inactive), iniciar:
sudo systemctl start postgresql

# Verificar novamente
sudo systemctl status postgresql
```
**Resultado esperado**: Active (running) em verde

### Passo 2: Navegar até o Projeto
```bash
# Ir para a pasta do projeto
cd ~/CertificateManager

# Verificar se está na pasta certa
pwd
# Deve mostrar: /home/seu-usuario/CertificateManager
```

### Passo 3: Iniciar a Aplicação
```bash
# Executar em modo desenvolvimento
npm run dev
```
**Resultado esperado**: 
- "serving on port 5000"
- "Verificador de assinaturas iniciado"

### Passo 4: Acessar o Sistema
1. Abrir o navegador
2. Acessar: http://localhost:5000
3. Fazer login normalmente

## 🔧 Comandos Úteis Durante o Uso

### Para Parar a Aplicação
No terminal onde está rodando: `CTRL + C`

### Para Reiniciar a Aplicação
```bash
# CTRL + C para parar
npm run dev
```

### Para Ver Logs em Tempo Real
A aplicação já mostra logs no terminal onde está rodando

### Para Abrir Novo Terminal
`CTRL + ALT + T` (mantém a aplicação rodando)

## 🎯 Atalho Opcional: Script de Inicialização

Para facilitar, crie um script que faz tudo automaticamente:

### Criar o Script
```bash
nano ~/iniciar-certificate-manager.sh
```

Adicione o conteúdo:
```bash
#!/bin/bash
echo "🚀 Iniciando Certificate Manager..."

# Iniciar PostgreSQL se necessário
if ! systemctl is-active --quiet postgresql; then
    echo "📦 Iniciando PostgreSQL..."
    sudo systemctl start postgresql
    sleep 2
fi

# Ir para o diretório do projeto
cd ~/CertificateManager

# Limpar terminal
clear

echo "✅ PostgreSQL: $(systemctl is-active postgresql)"
echo "📂 Diretório: $(pwd)"
echo "🌐 Acesse em: http://localhost:5000"
echo ""
echo "🛑 Para parar: CTRL+C"
echo "="
echo ""

# Iniciar aplicação
npm run dev
```

### Tornar Executável
```bash
chmod +x ~/iniciar-certificate-manager.sh
```

### Usar o Script
```bash
# Agora basta executar:
~/iniciar-certificate-manager.sh
```

## 📋 Checklist Diário

- [ ] PostgreSQL está rodando
- [ ] Estou na pasta correta (~/CertificateManager)
- [ ] npm run dev executado sem erros
- [ ] Consigo acessar http://localhost:5000

## ❗ Troubleshooting Rápido

### "Erro de conexão com banco"
```bash
sudo systemctl restart postgresql
```

### "Porta 5000 em uso"
```bash
# Ver o que está usando
sudo lsof -i :5000
# Matar se necessário
sudo kill -9 [PID]
```

### "npm: command not found"
```bash
# Recarregar PATH
source ~/.bashrc
```

### "Cannot find module"
```bash
# Reinstalar dependências
npm install
```

## 💡 Dicas Pro

1. **Manter Terminal Aberto**: A aplicação precisa do terminal rodando
2. **Múltiplas Abas**: Use abas do terminal (CTRL+SHIFT+T) para outros comandos
3. **Performance**: Se ficar lento, reinicie com CTRL+C e npm run dev

## 🔄 Configurar Inicialização Automática (Opcional)

Se quiser que o PostgreSQL inicie automaticamente ao ligar:
```bash
sudo systemctl enable postgresql
```

Para a aplicação, é melhor iniciar manualmente para ver os logs e ter controle.

---

**Tempo para iniciar**: 30 segundos com script, 1-2 minutos manual
**Nível**: Básico