# 📚 Documentação do CertificateManager

Sistema de Gestão de Certificados de Qualidade para Distribuidores Químicos - Uma plataforma SaaS multi-tenant completa.

## 🗂️ Índice da Documentação

### 🚀 Primeiros Passos
- [**Visão Geral**](getting-started/overview.md) - Introdução ao sistema e suas funcionalidades
- [**Instalação**](getting-started/installation.md) - Guia de instalação do zero
- [**Quick Start**](getting-started/quick-start.md) - Como começar rapidamente

### 💻 Desenvolvimento
- [**Setup de Desenvolvimento**](development/setup.md) - Configurar ambiente de desenvolvimento
- [**Workflow Git**](development/git-workflow.md) - Guia completo de Git para o projeto
- [**Configuração Claude Code**](development/claude-code-config.md) - Configurações para Claude Code
- [**Contribuindo**](development/contributing.md) - Como contribuir para o projeto

### 🚀 Deploy e Produção
- [**Instalação Local**](deployment/local-installation.md) - Deploy em máquina local
- [**Instalação Local (Versão Completa)**](deployment/local-installation-legacy.md) - Guia detalhado passo-a-passo
- [**Guia VirtualBox**](deployment/virtualbox-guide.md) - Instalação em VirtualBox/VM
- [**Deploy VPS**](deployment/vps-deployment.md) - Deploy em servidor VPS
- [**Deploy AWS**](deployment/aws-deployment.md) - Deploy na Amazon Web Services
- [**Fluxo de Deploy**](deployment/deployment-flow.md) - Lógica completa do processo de deploy
- [**Conceitos de Deploy**](deployment/deployment-flow-concepts.md) - Entendendo Replit vs Produção
- [**Startup Diário**](deployment/daily-startup.md) - Como iniciar o sistema diariamente

### ⚙️ Funcionalidades
- [**Sistema de Módulos**](features/modules-system.md) - Como funcionam os módulos do sistema
- [**Sistema de Permissões**](features/permissions-system.md) - Controle de acesso e permissões
- [**Importação NFe**](features/nfe-import-system.md) - Sistema automático de importação de NFe
- [**Multi-tenancy**](features/multi-tenant.md) - Arquitetura multi-tenant
- [**Planos de Assinatura**](features/subscription-plans.md) - Sistema de planos e cobrança

### 🗄️ Banco de Dados
- [**Esquema do Banco**](database/schema.md) - Estrutura completa do banco de dados
- [**Migrações**](database/migrations.md) - Como aplicar e criar migrações

### 🔌 API
- [**Endpoints**](api/endpoints.md) - Documentação completa da API REST

## 🎯 Links Rápidos

### Para Desenvolvedores
- [Setup Rápido de Desenvolvimento](development/setup.md)
- [Workflow Git](development/git-workflow.md)
- [Sistema de Módulos](features/modules-system.md)

### Para Deploy
- [Instalação Local](deployment/local-installation.md)
- [Deploy VPS](deployment/vps-deployment.md)
- [Fluxo de Deploy](deployment/deployment-flow.md)

### Para Usuários
- [Visão Geral do Sistema](getting-started/overview.md)
- [Guia de Instalação](getting-started/installation.md)
- [Sistema de Permissões](features/permissions-system.md)

## 📖 Sobre o Projeto

O **CertificateManager** é um sistema SaaS multi-tenant para gestão de certificados de qualidade, desenvolvido especialmente para distribuidores de produtos químicos. O sistema oferece:

- ✅ **Multi-tenancy completo** com isolamento entre empresas
- ✅ **Sistema de módulos flexível** baseado em planos de assinatura
- ✅ **Controle granular de permissões** por funcionalidade
- ✅ **Importação automática de NFe** com geração automática de certificados
- ✅ **Interface moderna** com React + TypeScript
- ✅ **API robusta** com Node.js + Express + PostgreSQL
- ✅ **Deploy flexível** em VPS, AWS ou local

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Drizzle ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Passport.js + Express Sessions
- **Deploy**: VPS Ubuntu, AWS EC2, Docker

## 📞 Suporte e Contribuição

- **Documentação**: Você está aqui! 📍
- **Issues**: [GitHub Issues](../../issues)
- **Contribuições**: Veja [Como Contribuir](development/contributing.md)
- **Deploy**: Consulte os [guias de deployment](deployment/)

---

**🚀 Desenvolvido para escalabilidade empresarial e segurança em ambiente multi-tenant**