---
layout: default
title: "CertificateManager - Sistema de Gestão de Certificados"
description: "Sistema SaaS multi-tenant para gestão de certificados de qualidade - Distribuidores químicos"
---

# 🏭 CertificateManager

Sistema de Gestão de Certificados de Qualidade para Distribuidores Químicos

## 🚀 O que é o CertificateManager?

O **CertificateManager** é uma plataforma SaaS multi-tenant completa, desenvolvida especialmente para distribuidores de produtos químicos que precisam gerenciar certificados de qualidade, boletins de análise e documentação de segurança com máxima eficiência e compliance.

### ✨ Principais Funcionalidades

- **🏢 Multi-tenancy Completo**: Isolamento total entre empresas
- **📊 Sistema de Módulos**: Funcionalidades organizadas por planos de assinatura
- **🔐 Controle Granular**: Permissões por funcionalidade específica
- **📱 Interface Moderna**: React + TypeScript + shadcn/ui
- **⚡ API Robusta**: Node.js + Express + PostgreSQL + Drizzle ORM
- **🚀 Deploy Flexível**: VPS, AWS, Docker ou local

## 🎯 Para Quem é Este Sistema?

### 🧪 Distribuidores Químicos
- Gestão de FISPQ (Fichas de Segurança)
- Controle de certificados de análise
- Rastreabilidade de produtos químicos
- Compliance regulatório automático

### 💼 Empresas SaaS
- Arquitetura multi-tenant escalável
- Sistema de planos e assinaturas
- Feature flags granulares
- Controle de recursos por tenant

### 👨‍💻 Desenvolvedores
- Stack moderna e bem documentada
- Padrões de código claros
- API REST completa
- Ambiente de desenvolvimento profissional

## 📚 Documentação

### 🚀 [Primeiros Passos](getting-started/)
- [Visão Geral do Sistema](getting-started/overview.md)
- [Guia de Instalação](getting-started/installation.md)
- [Quick Start (5 minutos)](getting-started/quick-start.md)

### 💻 [Desenvolvimento](development/)
- [Setup do Ambiente](development/setup.md)
- [Workflow Git](development/git-workflow.md)
- [Como Contribuir](development/contributing.md)
- [Configuração Claude Code](development/claude-code-config.md)

### 🚀 [Deploy e Produção](deployment/)
- [Instalação Local](deployment/local-installation.md)
- [Deploy em VPS](deployment/vps-deployment.md)
- [Deploy na AWS](deployment/aws-deployment.md)
- [Guia VirtualBox](deployment/virtualbox-guide.md)

### ⚙️ [Funcionalidades](features/)
- [Sistema de Módulos](features/modules-system.md)
- [Sistema de Permissões](features/permissions-system.md)
- [Arquitetura Multi-tenant](features/multi-tenant.md)

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│   React 18      │◄──►│   Node.js       │◄──►│   Multi-tenant  │
│   TypeScript    │    │   Express       │    │   Isolado       │
│   shadcn/ui     │    │   Drizzle ORM   │    │   Feature Gates │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | React + TypeScript | 18+ |
| **Build** | Vite | 5+ |
| **UI** | shadcn/ui + Tailwind CSS | Latest |
| **Backend** | Node.js + Express | 20+ |
| **ORM** | Drizzle ORM | Latest |
| **Banco** | PostgreSQL | 12+ |
| **Auth** | Passport.js + Sessions | Latest |

## 🎯 Planos de Assinatura

### 💎 Plano Básico - R$ 99,90/mês
- 1GB de armazenamento
- Até 5 usuários
- Módulos: Core, Produtos, Certificados

### 🚀 Plano Intermediário - R$ 199,90/mês
- 5GB de armazenamento
- Até 15 usuários
- Adiciona: Certificados Avançados, Multi-usuário

### 🏆 Plano Completo - R$ 399,90/mês
- 20GB de armazenamento
- Até 50 usuários
- Todos os módulos: Rastreabilidade, Relatórios, Integrações

## 🔧 Links Rápidos

### Para Novos Usuários
- [🚀 Quick Start](getting-started/quick-start.md) - Em funcionamento em 5 minutos
- [📖 Visão Geral](getting-started/overview.md) - Entenda o sistema completo
- [⚙️ Instalação](getting-started/installation.md) - Instalação passo a passo

### Para Desenvolvedores
- [💻 Setup de Desenvolvimento](development/setup.md) - Ambiente profissional
- [🔄 Workflow Git](development/git-workflow.md) - Boas práticas de Git
- [🤝 Como Contribuir](development/contributing.md) - Guia de contribuição

### Para Deploy
- [🏠 Instalação Local](deployment/local-installation.md) - Deploy em casa
- [☁️ Deploy VPS](deployment/vps-deployment.md) - Servidor na nuvem
- [🚀 Deploy AWS](deployment/aws-deployment.md) - Amazon Web Services

## 📊 Status do Projeto

- ✅ **Sistema Multi-tenant** - Completo
- ✅ **Feature Gates** - Implementado
- ✅ **Interface Administrativa** - Funcional
- ✅ **Sistema de Planos** - Operacional
- ✅ **API REST** - Documentada
- ✅ **Deploy Automatizado** - Scripts prontos

## 🤝 Comunidade e Suporte

### 💬 Canais de Comunicação
- **Issues**: [GitHub Issues](https://github.com/mcsafx/CertificateManager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mcsafx/CertificateManager/discussions)
- **Email**: contato@certificatemanager.com.br

### 📖 Recursos
- [📋 Changelog](../CHANGELOG.md) - Histórico de mudanças
- [🤝 Guia de Contribuição](../CONTRIBUTING.md) - Como contribuir
- [🔍 Troubleshooting](deployment/local-installation.md#troubleshooting) - Resolução de problemas

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](../LICENSE) para detalhes.

---

<div style="text-align: center; margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
  <h3>🚀 Pronto para começar?</h3>
  <p>
    <a href="getting-started/quick-start.md" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">🚀 Quick Start</a>
    <a href="getting-started/installation.md" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">📖 Instalação Completa</a>
    <a href="https://github.com/mcsafx/CertificateManager" style="background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">📂 Ver Código</a>
  </p>
</div>

**Desenvolvido com ❤️ para a indústria química brasileira**