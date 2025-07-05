# Sistema de Gestão de Tenants e Módulos

Um sistema completo de gestão multi-tenant com controle granular de permissões, módulos e funcionalidades para empresas SaaS.

## 🚀 Características Principais

### Arquitetura Multi-Tenant
- **Isolamento completo** entre tenants (empresas)
- **Planos flexíveis** com diferentes níveis de acesso
- **Controle de limites** de armazenamento e usuários
- **Sistema de assinaturas** com verificação automática

### Sistema de Módulos e Funcionalidades
- **Módulos dinâmicos** habilitados por plano
- **Controle granular** de funcionalidades por tenant
- **Feature Gates** para controle de acesso em tempo real
- **Catálogo de funcionalidades** organizadas por módulo

### Gestão Avançada de Permissões
- **Autenticação robusta** com sessões seguras
- **Autorização baseada em funcionalidades** específicas
- **Middleware de verificação** automática
- **Componentes protegidos** por feature gates

### Interface Moderna
- **Design responsivo** com Tailwind CSS e shadcn/ui
- **Componentes reutilizáveis** e acessíveis
- **Experiência otimizada** para desktop e mobile
- **Tema escuro/claro** configurável

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL + Drizzle ORM
- **Autenticação**: Passport.js + Express Session
- **UI**: Tailwind CSS + shadcn/ui + Radix UI

### Estrutura de Módulos

#### Módulo Core (`core`)
- Dashboard principal
- Gestão de usuários
- Configurações básicas
- Relatórios fundamentais

#### Módulo Produtos (`products`)
- Cadastro de produtos e categorias
- Gestão de subcategorias
- Controle de inventário
- Relatórios de produtos

#### Módulo Certificados (`certificates`)
- Emissão de certificados básicos
- **Importação automática de NFe** com geração de certificados
- Templates de certificados
- Gestão de certificados emitidos
- Validação de certificados

#### Módulo Certificados Avançados (`certificates_advanced`)
- Certificados com assinatura digital
- Templates avançados personalizáveis
- Integração com sistemas externos
- Auditoria completa

#### Módulo Multi-usuário (`multi_user`)
- Gestão avançada de usuários
- Controle de permissões granular
- Grupos e departamentos
- Logs de atividade

#### Módulo Rastreabilidade (`traceability`)
- Rastreamento end-to-end
- Histórico de alterações
- Auditoria completa
- Relatórios de conformidade

#### Módulo Configurações (`settings`)
- Personalização da plataforma
- Configurações avançadas
- Integrações com terceiros
- Backup e restauração

#### Módulo Relatórios (`reports`)
- Relatórios customizáveis
- Dashboard executivo
- Exportação em múltiplos formatos
- Agendamento de relatórios

#### Módulo Integração (`integrations`)
- APIs externas
- Webhooks
- Sincronização de dados
- Conectores pré-configurados

### Planos de Assinatura

#### Plano Básico (A)
- **Preço**: R$ 99,90/mês
- **Armazenamento**: 1GB
- **Usuários**: até 5
- **Módulos inclusos**:
  - Core
  - Produtos
  - Certificados

#### Plano Intermediário (B)
- **Preço**: R$ 199,90/mês
- **Armazenamento**: 5GB
- **Usuários**: até 15
- **Módulos inclusos**:
  - Core
  - Produtos
  - Certificados
  - Certificados Avançados
  - Multi-usuário

#### Plano Completo (C)
- **Preço**: R$ 399,90/mês
- **Armazenamento**: 20GB
- **Usuários**: até 50
- **Módulos inclusos**: Todos os módulos

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 20+
- PostgreSQL 12+
- Git

### Instalação Rápida
```bash
# Clonar repositório
git clone <url-do-repositorio>
cd tenant-management

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
npm run db:push

# Iniciar aplicação
npm run dev
```

### Variáveis de Ambiente
```env
DATABASE_URL="postgresql://user:password@localhost:5432/db"
SESSION_SECRET="your-secret-key"
NODE_ENV="development"
PORT=5000
```

### Scripts Disponíveis
```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run start        # Executar em produção
npm run check        # Verificar tipos TypeScript
npm run db:push      # Aplicar mudanças no banco
```

## 📖 Documentação Técnica

### Estrutura de Pastas
```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários e configurações
│   │   └── App.tsx        # Componente principal
├── server/                # Backend Express
│   ├── auth.ts           # Sistema de autenticação
│   ├── routes.ts         # Rotas da API
│   ├── storage.ts        # Interface de dados
│   ├── middlewares/      # Middlewares personalizados
│   └── services/         # Serviços do sistema
├── shared/               # Código compartilhado
│   └── schema.ts         # Schema do banco de dados
└── migrations/           # Migrações do banco
```

### Sistema de Feature Gates

O sistema utiliza Feature Gates para controlar acesso a funcionalidades:

```tsx
// Proteger uma funcionalidade
<FeatureGate featurePath="products/create">
  <CreateProductButton />
</FeatureGate>

// Proteger uma rota completa
<FeatureProtectedRoute 
  path="/products/create" 
  component={CreateProductPage}
  featurePath="products/create"
/>
```

### API Principal

#### Autenticação
- `POST /api/login` - Login do usuário
- `POST /api/logout` - Logout
- `GET /api/user` - Dados do usuário atual

#### Gestão de Tenants
- `GET /api/admin/tenants` - Listar tenants
- `POST /api/admin/tenants` - Criar tenant
- `PUT /api/admin/tenants/:id` - Atualizar tenant
- `DELETE /api/admin/tenants/:id` - Excluir tenant

#### Módulos e Funcionalidades
- `GET /api/admin/modules` - Listar módulos
- `GET /api/admin/module-features` - Listar funcionalidades
- `POST /api/admin/module-features` - Criar funcionalidade
- `GET /api/features/check-access` - Verificar acesso

#### Gestão de Usuários
- `GET /api/users` - Listar usuários do tenant
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário

### Middleware de Segurança

O sistema possui middlewares robustos para:

- **Autenticação**: Verificar login válido
- **Autorização por Funcionalidade**: Verificar acesso específico
- **Verificação de Assinatura**: Validar status do plano
- **Controle de Armazenamento**: Limitar uso de espaço
- **Proteção de Rotas**: Filtrar acesso por tenant

## 🔧 Desenvolvimento

### Adicionando Novo Módulo

1. **Definir módulo** em `shared/schema.ts`
2. **Criar funcionalidades** via admin
3. **Implementar componentes** protegidos
4. **Configurar rotas** com Feature Gates
5. **Atualizar planos** se necessário

### Adicionando Nova Funcionalidade

1. **Registrar funcionalidade** no admin
2. **Definir padrão de rota** (ex: `/products/create`)
3. **Implementar verificação** de acesso
4. **Criar componentes** com FeatureGate
5. **Testar permissões** por plano

### Padrões de Código

- **TypeScript** rigoroso em todo código
- **Componentes funcionais** com hooks
- **Validação** com Zod schemas
- **Estados** gerenciados com TanStack Query
- **Formulários** com react-hook-form + shadcn
- **Estilos** com Tailwind CSS

## 🚀 Deploy

### Replit (Recomendado)
A aplicação está otimizada para deploy no Replit:
1. Fazer push para repositório
2. Conectar ao Replit
3. Configurar variáveis de ambiente
4. Deploy automático

### Docker
```dockerfile
# Dockerfile incluído no projeto
docker build -t tenant-management .
docker run -p 5000:5000 tenant-management
```

### VPS/Servidor
Consulte `DEPLOY_LOCALHOST.md` para instruções completas de instalação em servidor próprio.

## 📝 Contribuição

### Requisitos para Contribuir
- Seguir padrões TypeScript
- Implementar testes para novas funcionalidades
- Documentar APIs e componentes
- Manter compatibilidade com sistema de módulos

### Processo de Desenvolvimento
1. Fork do repositório
2. Criar branch para feature
3. Implementar com testes
4. Enviar Pull Request
5. Review de código

## 📞 Suporte

### Recursos de Debug
- Logs detalhados no console
- Feature Gates com debug mode
- Verificação de permissões em tempo real
- Monitoramento de uso de recursos

### Troubleshooting Comum
- **Erro de permissão**: Verificar módulos do plano
- **Funcionalidade indisponível**: Conferir feature path
- **Problema de autenticação**: Validar sessão
- **Limite de armazenamento**: Verificar uso atual

## 📄 Licença

MIT License - veja arquivo LICENSE para detalhes.

## 🔄 Changelog

### Versão Atual
- ✅ Sistema completo de multi-tenancy
- ✅ Feature Gates implementados
- ✅ Interface administrativa
- ✅ Sistema de planos e assinaturas
- ✅ Controle granular de permissões
- ✅ **Sistema de importação NFe** com geração automática de certificados
- ✅ Dashboard responsivo
- ✅ Gestão de usuários e produtos
- ✅ Sistema de upload de arquivos
- ✅ Verificação automática de assinaturas

### Próximas Funcionalidades
- 🔄 Importação em lote de múltiplas NFes
- 🔄 Sistema de notificações
- 🔄 Webhooks para integrações
- 🔄 Relatórios avançados
- 🔄 API pública documentada
- 🔄 Sistema de backup automático

---

**Desenvolvido com ❤️ para escalabilidade empresarial**