# Guia Ubuntu VirtualBox - CertificateManager

## 🎯 O que vamos fazer:
Configurar completamente o Ubuntu 24.04 na VirtualBox e rodar seu projeto perfeitamente.

---

## **ETAPA 1: Configurar Ubuntu na VirtualBox**

### 1.1 **Configurações Recomendadas da VM:**
- **RAM**: Mínimo 4GB (8GB se possível)
- **HD**: Mínimo 25GB
- **Processadores**: 2 ou mais cores
- **Rede**: NAT (padrão)

### 1.2 **Instalar Ubuntu:**
- Siga a instalação normal do Ubuntu
- **Nome de usuário**: escolha um (ex: `magnus`)
- **Senha**: escolha uma senha forte
- **Instalar atualizações**: marque as opções

---

## **ETAPA 2: Primeira configuração do Ubuntu**

### 2.1 **Abrir Terminal:**
- Pressione `Ctrl + Alt + T`
- Ou clique no ícone do Terminal

### 2.2 **Atualizar sistema:**
```bash
sudo apt update && sudo apt upgrade -y
```
**⏰ Aguarde:** Pode demorar alguns minutos

### 2.3 **Instalar essenciais:**
```bash
sudo apt install -y curl wget git build-essential
```

---

## **ETAPA 3: Instalar Node.js**

### 3.1 **Instalar Node.js 18+ (recomendado):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3.2 **Verificar instalação:**
```bash
node --version
npm --version
```
**✅ Resultado esperado:** Node v18+ e npm 8+

---

## **ETAPA 4: Instalar Docker**

### 4.1 **Instalar Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 4.2 **Configurar usuário:**
```bash
sudo usermod -aG docker $USER
```

### 4.3 **Reiniciar sessão:**
```bash
# Feche o terminal e abra novamente
# Ou faça logout/login
```

### 4.4 **Verificar Docker:**
```bash
docker --version
docker ps
```

---

## **ETAPA 5: Transferir projeto para Ubuntu**

### **Opção A: Download direto do GitHub (Recomendado)**

### 5.1 **Clonar projeto:**
```bash
cd ~
git clone https://github.com/mcsafx/CertificateManager.git
cd CertificateManager
```

### **Opção B: Transferir do Windows**

### 5.1 **Instalar Guest Additions (para compartilhar arquivos):**
- No menu da VM: **Dispositivos** → **Inserir imagem do CD Guest Additions**
- No Ubuntu: abrir o CD e executar autorun

### 5.2 **Configurar pasta compartilhada:**
- VM → **Configurações** → **Pastas Compartilhadas**
- Adicionar: **C:\dev** (Windows) → **dev** (Ubuntu)

### 5.3 **Copiar projeto:**
```bash
mkdir ~/dev
cp -r /media/sf_dev/CertificateManager ~/CertificateManager
cd ~/CertificateManager
```

---

## **ETAPA 6: Configurar PostgreSQL com Docker**

### 6.1 **Criar container PostgreSQL:**
```bash
docker run --name certificate-postgres \
  -e POSTGRES_DB=certificate_manager \
  -e POSTGRES_USER=cert_user \
  -e POSTGRES_PASSWORD=MinhaSenh@123 \
  -p 5432:5432 \
  -d postgres:15
```

### 6.2 **Verificar container:**
```bash
docker ps
```
**✅ Resultado esperado:** Container `certificate-postgres` rodando

### 6.3 **Aguardar inicialização:**
```bash
sleep 10
```

---

## **ETAPA 7: Configurar variáveis de ambiente**

### 7.1 **Criar arquivo .env:**
```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://cert_user:MinhaSenh@123@localhost:5432/certificate_manager
SESSION_SECRET=certificate_manager_super_secret_key_2024_ubuntu
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
LOG_LEVEL=debug
EOF
```

### 7.2 **Verificar arquivo:**
```bash
cat .env
```

---

## **ETAPA 8: Instalar dependências do projeto**

### 8.1 **Limpar instalações anteriores:**
```bash
rm -rf node_modules package-lock.json
```

### 8.2 **Instalar dependências:**
```bash
npm install
```
**⏰ Aguarde:** Pode demorar alguns minutos

### 8.3 **Verificar instalação:**
```bash
npm list --depth=0
```

---

## **ETAPA 9: Configurar banco de dados**

### 9.1 **Verificar se container está rodando:**
```bash
docker logs certificate-postgres
```

### 9.2 **Aplicar schema do banco:**
```bash
npx drizzle-kit push --force
```
**✅ Resultado esperado:** Mensagens sobre criação de tabelas

### 9.3 **Verificar tabelas criadas:**
```bash
docker exec -it certificate-postgres psql -U cert_user -d certificate_manager -c "\dt"
```

---

## **ETAPA 10: Preparar ambiente de desenvolvimento**

### 10.1 **Criar diretório de uploads:**
```bash
mkdir -p uploads
chmod 755 uploads
```

### 10.2 **Verificar estrutura do projeto:**
```bash
ls -la
```
**✅ Deve mostrar:** client/, server/, shared/, .env, package.json, etc.

---

## **ETAPA 11: EXECUTAR A APLICAÇÃO**

### 11.1 **Iniciar aplicação:**
```bash
npm run dev
```

**🎉 Resultado esperado:**
```
> rest-express@1.0.0 dev
> tsx server/index.ts

Server running on http://localhost:3000
Frontend available at http://localhost:5173
```

---

## **ETAPA 12: Testar no navegador Ubuntu**

### 12.1 **Abrir Firefox no Ubuntu:**
- Clique no ícone do Firefox na barra lateral

### 12.2 **Acessar aplicação:**
- Digite: `http://localhost:5173`
- Pressione Enter

**🎉 SUCESSO:** Interface do CertificateManager deve aparecer!

---

## **ETAPA 13: Configurar VS Code (Opcional)**

### 13.1 **Instalar VS Code:**
```bash
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code
```

### 13.2 **Abrir projeto no VS Code:**
```bash
cd ~/CertificateManager
code .
```

---

## 🛠️ **Comandos úteis para gerenciar**

### **Parar aplicação:**
```bash
# No terminal onde está rodando, pressione:
Ctrl + C
```

### **Parar/Iniciar PostgreSQL:**
```bash
# Parar
docker stop certificate-postgres

# Iniciar
docker start certificate-postgres
```

### **Ver logs:**
```bash
# Logs da aplicação aparecem no terminal
# Logs do PostgreSQL:
docker logs certificate-postgres
```

### **Resetar banco de dados:**
```bash
docker stop certificate-postgres
docker rm certificate-postgres
# Depois executar novamente o comando de criar container
```

---

## 🎯 **Vantagens desta configuração:**

✅ **Performance nativa** - Sem overhead do Windows  
✅ **Ambiente isolado** - Não afeta o Windows  
✅ **Desenvolvimento real** - Igual à produção  
✅ **Docker nativo** - Performance máxima  
✅ **Debugging fácil** - Logs claros no Linux  
✅ **Escalabilidade** - Fácil replicar em servidores  

---

## 📋 **Checklist final:**

- [ ] Ubuntu 24.04 instalado na VirtualBox
- [ ] Node.js 18+ funcionando
- [ ] Docker funcionando
- [ ] Projeto clonado/copiado
- [ ] PostgreSQL rodando em container
- [ ] Arquivo .env configurado
- [ ] Dependências instaladas
- [ ] Banco de dados criado
- [ ] Aplicação rodando
- [ ] Interface acessível no navegador

---

## ❓ **Se algo der errado:**

1. **Me diga qual etapa** você estava
2. **Qual comando** executou
3. **Qual erro** apareceu
4. **Print da tela** (se possível)

**Ubuntu vai ser MUITO mais fácil que Windows para este projeto!**