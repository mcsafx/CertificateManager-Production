# Estrutura de Módulos e Funcionalidades do Sistema

Este documento lista todos os módulos do sistema e suas respectivas funcionalidades (features), organizados hierarquicamente. Cada módulo representa um conjunto de funcionalidades relacionadas que podem ser habilitadas ou desabilitadas conforme o plano de assinatura do tenant.

## 1. Módulo Core (core)
**Descrição:** Funcionalidades básicas do sistema

### Features:
* **Perfil de Usuário** - `/api/user` - Acesso ao perfil do usuário atual
* **Autenticação** - `/api/login` - Login e verificação de credenciais
* **Logout** - `/api/logout` - Encerramento de sessão
* **Arquivos Básicos** - `/api/files` - Acesso a arquivos gerais do sistema

## 2. Módulo Produtos (products)
**Descrição:** Gerenciamento completo de produtos

### Features:
* **Produtos** - `/api/products*` - Gerenciamento de produtos
* **Categorias de Produtos** - `/api/product-categories*` - Gerenciamento de categorias de produtos
* **Subcategorias de Produtos** - `/api/product-subcategories*` - Gerenciamento de subcategorias de produtos
* **Produtos Base** - `/api/product-base*` - Gerenciamento de produtos base
* **Tipos de Embalagem** - `/api/package-types*` - Gerenciamento de tipos de embalagem
* **Fornecedores** - `/api/suppliers*` - Gerenciamento de fornecedores
* **Fabricantes** - `/api/manufacturers*` - Gerenciamento de fabricantes

## 3. Módulo Certificados (certificates)
**Descrição:** Gerenciamento básico de certificados

### Features:
* **Boletins de Entrada** - `/api/entry-certificates*` - Gerenciamento de boletins de entrada
* **Visualização de Certificados** - `/api/certificates/view*` - Visualização de certificados em formato HTML/PDF

## 4. Módulo Certificados Avançados (certificates_advanced)
**Descrição:** Recursos avançados de certificados

### Features:
* **Boletins Emitidos** - `/api/issued-certificates*` - Gerenciamento de boletins emitidos

## 5. Módulo Rastreabilidade (traceability)
**Descrição:** Sistema de rastreabilidade completo

### Features:
* **Clientes** - `/api/clients*` - Gerenciamento de clientes
* **Rastreabilidade** - `/api/traceability*` - Rastreabilidade de produtos e certificados

## 6. Módulo Análises (analytics)
**Descrição:** Relatórios e dashboards avançados

### Features:
* **Relatórios** - `/api/reports*` - Geração e visualização de relatórios
* **Estatísticas do Dashboard** - `/api/dashboard/stats*` - Visualização de estatísticas no dashboard

## 7. Módulo Multi-usuário (multi_user)
**Descrição:** Permissões de usuários avançadas

### Features:
* **Gerenciamento de Usuários** - `/api/admin/users*` - Criação e administração de usuários
* **Gerenciamento de Tenants** - `/api/admin/tenants*` - Administração de tenants (empresas)

## 8. Módulo API (api)
**Descrição:** Acesso à API do sistema

### Features:
* **API v1** - `/api/v1*` - Acesso à API versão 1
* **Webhooks** - `/api/webhooks*` - Criação e gerenciamento de webhooks

---

## Módulos por Plano

### Plano Básico
* Módulo Core (core)
* Módulo Produtos (products)