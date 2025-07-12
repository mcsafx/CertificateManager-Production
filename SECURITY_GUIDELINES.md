# Diretrizes de Segurança - CertificateManager

## ⚠️ IMPORTANTE: Dados Fictícios e Segurança

### 🚫 **O QUE NÃO FAZER**
- **NUNCA** comitar arquivos NFe reais ou com dados comerciais
- **NUNCA** incluir informações de clientes, fornecedores ou produtos reais
- **NUNCA** usar CNPJs, CPFs ou dados pessoais verdadeiros
- **NUNCA** incluir senhas, tokens ou chaves de API reais

### ✅ **PRÁTICAS SEGURAS PARA DESENVOLVIMENTO**

#### **1. Dados de Teste**
- Use apenas dados completamente fictícios
- Para CNPJs: Use geradores de CNPJ falso (ex: 11.111.111/0001-11)
- Para CPFs: Use geradores de CPF falso (ex: 111.111.111-11)
- Para empresas: Use nomes claramente fictícios (ex: "EMPRESA TESTE LTDA")

#### **2. Arquivos NFe de Exemplo**
Se precisar criar arquivos NFe para teste:
- Use apenas dados fictícios
- Marque claramente como "EXEMPLO" ou "TESTE"
- Não inclua no commit - use apenas localmente

#### **3. Banco de Dados**
- **PRODUÇÃO**: Sem dados de exemplo ou demonstração
- **DESENVOLVIMENTO**: Use dados claramente fictícios
- **TESTES**: Limpe sempre após os testes

#### **4. Configurações**
- Use variáveis de ambiente para configurações sensíveis
- Mantenha `.env.example` sem valores reais
- Documente apenas o formato, não os valores

### 🔍 **CHECKLIST ANTES DO COMMIT**

- [ ] Não há arquivos NFe reais no projeto
- [ ] Não há dados comerciais ou pessoais verdadeiros
- [ ] Arquivos de configuração não contêm credenciais
- [ ] Dados de teste são claramente fictícios
- [ ] Screenshots não mostram dados reais
- [ ] Documentação não expõe informações sensíveis

### 🛡️ **VERIFICAÇÃO DE SEGURANÇA**

Para verificar se o projeto está limpo:

```bash
# Verificar arquivos NFe
find . -name "*.xml" -type f

# Verificar dados sensíveis
grep -r "CNPJ\|CPF" --include="*.ts" --include="*.js" .

# Verificar credenciais
grep -r "password\|secret\|key" --include="*.env*" .
```

### 📋 **RESPONSABILIDADES**

#### **Desenvolvedor**
- Seguir estas diretrizes rigorosamente
- Revisar código antes de comitar
- Reportar qualquer exposição acidental

#### **Revisor de Código**
- Verificar ausência de dados reais
- Confirmar uso apenas de dados fictícios
- Aprovar apenas código seguro

#### **Administrador do Projeto**
- Manter estas diretrizes atualizadas
- Treinar equipe sobre segurança
- Monitorar compliance

---

**🔒 Lembre-se: A segurança dos dados é responsabilidade de todos!**