# Claude Code Configuration - CertificateManager
# Sistema de Gestão de Certificados de Qualidade para Distribuidores Químicos

## Contexto do Projeto
Este é um sistema SaaS multi-tenant para gestão de certificados de qualidade, boletins de análise e controle de produtos químicos. O sistema utiliza arquitetura moderna com React + TypeScript no frontend e Node.js + Express + PostgreSQL no backend.

## Perfil do Desenvolvedor
- **Nome**: Magnus, 31 anos
- **Especialidade**: Desenvolvimento web, sistemas SaaS
- **Domínio**: Logística e controle de qualidade em produtos químicos
- **Nível**: Desenvolvedor experiente que prefere soluções "copia e cola" com explicações claras

## Preferências de Código

### Estilo de Explicação
- Forneça explicações claras dos conceitos técnicos
- Mantenha o código em nível "copia e cola" funcional
- Inclua comentários explicativos inline
- Use analogias para conceitos complexos quando relevante

### Nível de Detalhe
- Instruções detalhadas passo a passo
- Soluções completas, não apenas direcionamentos
- Priorize explicações práticas sobre teoria extensa
- Sempre inclua verificações de funcionamento

### Stack Tecnológica Preferida
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco**: PostgreSQL + Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui
- **Deploy**: VPS Ubuntu, AWS EC2, Docker

## Estrutura do Projeto

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
│   ├── db.ts             # Configuração do banco
│   ├── middlewares/      # Middlewares personalizados
│   └── index.ts          # Ponto de entrada
├── shared/               # Código compartilhado
│   └── schema.ts         # Schema Drizzle ORM
└── .env                  # Variáveis de ambiente
```

## Padrões de Código

### TypeScript
- Sempre usar TypeScript rigoroso
- Definir interfaces claras para APIs
- Usar tipos do Drizzle para queries
- Validação com Zod quando necessário

### React
- Componentes funcionais com hooks
- Estados gerenciados com TanStack Query para server state
- Formulários com react-hook-form + shadcn
- Roteamento com React Router

### Backend
- Express com middlewares personalizados
- Autenticação com Passport.js + Express Session
- Autorização baseada em funcionalidades específicas
- Queries otimizadas com Drizzle ORM

### Banco de Dados
- PostgreSQL com isolamento completo entre tenants
- Schema definido em shared/schema.ts
- Migrações com Drizzle Kit
- Relacionamentos bem definidos

## Contexto do Domínio

### Sistema Multi-Tenant
- Isolamento completo entre empresas (tenants)
- Planos flexíveis (Básico R$99,90, Intermediário R$199,90, Completo R$399,90)
- Controle de limites de armazenamento e usuários
- Sistema de assinaturas com verificação automática

### Módulos do Sistema
- **core**: Dashboard, usuários, configurações básicas
- **products**: Gestão de produtos e categorias químicas
- **certificates**: Emissão de certificados básicos
- **certificates_advanced**: Certificados com assinatura digital
- **multi_user**: Gestão avançada de usuários
- **traceability**: Rastreamento end-to-end
- **settings**: Configurações avançadas
- **reports**: Relatórios customizáveis
- **integrations**: APIs e webhooks

### Feature Gates
Sistema de controle granular de acesso a funcionalidades:

```tsx
// Proteger componente
<FeatureGate featurePath="products/create">
  <CreateProductButton />
</FeatureGate>

// Proteger rota
<FeatureProtectedRoute 
  path="/products/create" 
  component={CreateProductPage}
  featurePath="products/create"
/>
```

## Configurações Específicas

### Variáveis de Ambiente Padrão
```env
DATABASE_URL="postgresql://appuser:password@localhost:5432/tenant_management_db"
NODE_ENV=development
PORT=5000
SESSION_SECRET="secure-session-key"
VITE_API_URL=http://localhost:5000
```

### Scripts NPM Essenciais
```json
{
  "dev": "tsx server/index.ts",
  "build": "vite build && tsc -p server",
  "start": "node dist/index.js",
  "db:push": "drizzle-kit push",
  "db:generate": "drizzle-kit generate"
}
```

## Instruções para Claude Code

### Quando Analisar Código
- Sempre considere o contexto multi-tenant
- Verifique se Feature Gates estão sendo utilizados corretamente
- Confirme se tipos TypeScript estão consistentes
- Valide se queries do banco respeitam isolamento por tenant

### Quando Sugerir Melhorias
- Otimizações de performance para PostgreSQL
- Melhores práticas de segurança para SaaS
- Componentes reutilizáveis com shadcn/ui
- Implementações de cache quando apropriado

### Quando Criar Código Novo
- Sempre incluir tratamento de erros completo
- Implementar validações tanto no frontend quanto backend
- Seguir padrões de nomenclatura existentes
- Incluir comentários explicativos para lógicas complexas

### Padrões de Resposta Preferidos
- Sempre explicar o "porquê" além do "como"
- Fornecer código completo e funcional
- Incluir passos de verificação/teste
- Adaptar exemplos ao contexto de produtos químicos quando relevante

## Problemas Comuns e Soluções

### Migração de Projetos Replit
- Sempre trocar @neondatabase/serverless por pg
- Configurar dotenv corretamente
- Ajustar server/db.ts para PostgreSQL local
- Verificar imports e paths

### Deploy em Produção
- Configurar PM2 para gerenciamento de processos
- Nginx como proxy reverso
- PostgreSQL com backup automático
- Monitoramento de recursos (RAM, CPU, storage)

### Debugging
- Logs detalhados para troubleshooting
- Feature Gates com modo debug
- Verificação de permissões em tempo real
- Monitoramento de uso de recursos por tenant

## Comandos de Desenvolvimento Frequentes

```bash
# Desenvolvimento local
npm run dev

# Migração do banco
npm run db:push

# Build para produção
npm run build

# Deploy com PM2
pm2 start start.sh --name certificate-manager

# Verificar logs
pm2 logs certificate-manager

# Backup do banco
pg_dump -h localhost -U appuser tenant_management_db > backup.sql
```

## Contexto de Deploy

### Ambientes Suportados
- **Desenvolvimento**: localhost com PostgreSQL local
- **VPS Ubuntu**: Nginx + PM2 + PostgreSQL
- **AWS EC2**: t2.micro com Free Tier otimizado
- **Docker**: Container multi-stage para produção

### Verificações de Saúde
- Conectividade com PostgreSQL
- Feature Gates funcionando
- Autenticação de usuários
- Isolamento entre tenants
- Limites de armazenamento respeitados

## Notas Importantes
- Este sistema lida com dados sensíveis de análises químicas
- Compliance e auditoria são fundamentais
- Performance é crítica devido ao multi-tenancy
- Segurança deve ser prioridade em todas as implementações
- Sempre considerar escalabilidade horizontal

---

**Use esta configuração como contexto principal para todas as interações relacionadas ao CertificateManager.**