# 🤝 Contribuindo para o CertificateManager

Obrigado por seu interesse em contribuir para o CertificateManager! Este documento fornece diretrizes e informações para contribuidores.

## 📋 Índice

- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Documentação](#documentação)
- [Reportar Issues](#reportar-issues)
- [Pull Requests](#pull-requests)

## 🚀 Como Contribuir

Existem várias maneiras de contribuir com o projeto:

### 1. Reportar Bugs
- Verifique se o bug já foi reportado nas [Issues](../../issues)
- Use o template de bug report
- Forneça informações detalhadas sobre o problema

### 2. Sugerir Funcionalidades
- Abra uma issue com o template de feature request
- Descreva claramente a funcionalidade desejada
- Explique o caso de uso e benefícios

### 3. Contribuir com Código
- Implemente correções de bugs
- Desenvolva novas funcionalidades
- Melhore a performance
- Adicione testes

### 4. Melhorar Documentação
- Corrija erros na documentação
- Adicione exemplos e casos de uso
- Traduza documentação
- Melhore a clareza das explicações

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- Node.js 20+ 
- PostgreSQL 12+
- Git
- Editor de código (VS Code recomendado)

### Setup Local
```bash
# 1. Fork e clone o repositório
git clone https://github.com/SEU_USUARIO/CertificateManager.git
cd CertificateManager

# 2. Instalar dependências
npm install

# 3. Configurar banco de dados PostgreSQL
sudo -u postgres psql << 'EOF'
CREATE USER appuser WITH PASSWORD 'DevLocal2024';
CREATE DATABASE tenant_management_db OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;
\q
EOF

# 4. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# 5. Aplicar migrações
npm run db:push

# 6. Iniciar aplicação
npm run dev
```

### Verificação da Instalação
```bash
# Verificar se a aplicação está rodando
curl http://localhost:5000

# Verificar conexão com banco
npm run db:push
```

## 🔄 Workflow de Desenvolvimento

### 1. Criar Branch para Feature
```bash
# Atualizar main
git checkout main
git pull origin main

# Criar branch descritiva
git checkout -b feature/nome-da-funcionalidade
# ou
git checkout -b fix/nome-do-bug
# ou
git checkout -b docs/melhoria-documentacao
```

### 2. Desenvolvimento
```bash
# Fazer mudanças incrementais
git add .
git commit -m "Adicionar funcionalidade X"

# Push frequente para backup
git push origin feature/nome-da-funcionalidade
```

### 3. Finalização
```bash
# Verificar se tudo funciona
npm run dev
npm run build  # se existir
npm run test   # se existir

# Commit final
git add .
git commit -m "Finalizar implementação da funcionalidade X"
git push origin feature/nome-da-funcionalidade
```

### 4. Pull Request
- Abra PR no GitHub
- Use template de PR
- Descreva mudanças claramente
- Adicione screenshots se aplicável

## 📝 Padrões de Código

### TypeScript
```typescript
// ✅ Bom: Interfaces claras
interface TenantData {
  id: number;
  name: string;
  planId: number;
  storageUsed: number;
}

// ✅ Bom: Tipos explícitos
const createTenant = async (data: TenantData): Promise<Tenant> => {
  // implementação
};

// ❌ Evitar: any types
const createTenant = (data: any): any => {
  // implementação
};
```

### React Components
```tsx
// ✅ Bom: Componente funcional tipado
interface ProductCardProps {
  product: Product;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-medium">{product.name}</h3>
      <p className="text-gray-600">{product.description}</p>
      
      <div className="mt-4 space-x-2">
        <Button onClick={() => onEdit(product.id)}>
          Editar
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => onDelete(product.id)}
        >
          Excluir
        </Button>
      </div>
    </div>
  );
};
```

### Backend API
```typescript
// ✅ Bom: Middleware + validação + tratamento de erro
app.post("/api/products", 
  isAuthenticated,
  checkFeatureAccess,
  async (req: Request, res: Response) => {
    try {
      // Validar dados
      const productData = productSchema.parse(req.body);
      
      // Adicionar tenantId para isolamento
      const newProduct = await db.insert(products).values({
        ...productData,
        tenantId: req.user.tenantId
      }).returning();
      
      res.json(newProduct[0]);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);
```

### Commits
```bash
# ✅ Boas mensagens de commit
git commit -m "Adicionar validação de CNPJ no cadastro de tenant"
git commit -m "Corrigir bug na calculadora de storage usado"
git commit -m "Melhorar performance da query de produtos"
git commit -m "Atualizar documentação do sistema de módulos"

# ❌ Mensagens ruins
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
git commit -m "working version"
```

## 🧪 Testes

### Estrutura de Testes (Futuro)
```bash
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── e2e/           # Testes end-to-end
└── fixtures/      # Dados de teste
```

### Rodar Testes
```bash
# Testes unitários
npm run test

# Testes de integração
npm run test:integration

# Testes end-to-end
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📚 Documentação

### Atualizar Documentação
- Sempre atualize documentação relevante
- Adicione exemplos práticos
- Mantenha links funcionando
- Use linguagem clara e objetiva

### Estrutura da Documentação
```
docs/
├── getting-started/    # Para usuários iniciantes
├── development/       # Para desenvolvedores
├── deployment/        # Para deploy e produção
├── features/         # Funcionalidades do sistema
├── database/         # Esquema e migrações
└── api/             # Documentação da API
```

## 🐛 Reportar Issues

### Template de Bug Report
```markdown
**Descreva o bug**
Descrição clara e concisa do problema.

**Para Reproduzir**
Passos para reproduzir o comportamento:
1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

**Comportamento Esperado**
Descrição clara do que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
 - OS: [ex: Ubuntu 20.04]
 - Navegador: [ex: Chrome, Safari]
 - Versão: [ex: 22]
 - Node.js: [ex: 20.10.0]
 - PostgreSQL: [ex: 15.3]

**Contexto Adicional**
Qualquer informação adicional sobre o problema.
```

## 🔄 Pull Requests

### Checklist do PR
- [ ] Código segue os padrões do projeto
- [ ] Testes passam (quando aplicável)
- [ ] Documentação atualizada
- [ ] Feature Gates implementados corretamente
- [ ] Isolamento multi-tenant respeitado
- [ ] Não quebra funcionalidades existentes
- [ ] Commit messages são descritivas

### Template de PR
```markdown
## Descrição
Descrição clara das mudanças implementadas.

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação (mudanças apenas na documentação)

## Como foi testado?
Descreva os testes realizados.

## Screenshots (se aplicável)
Adicione screenshots das mudanças visuais.

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes passam
- [ ] Documentação atualizada
- [ ] Feature Gates implementados
- [ ] Multi-tenancy respeitado
```

## 🎯 Áreas de Contribuição

### 🔥 Prioridade Alta
- Correções de bugs de segurança
- Melhorias de performance
- Feature Gates missing
- Isolamento multi-tenant

### 🚀 Funcionalidades Desejadas
- Sistema de notificações
- API pública documentada
- Webhooks
- Relatórios avançados
- Integração com ERPs

### 📖 Documentação
- Exemplos de uso da API
- Guias de integração
- Tutoriais passo-a-passo
- Tradução para outros idiomas

### 🧪 Testes
- Testes unitários
- Testes de integração
- Testes end-to-end
- Testes de performance

## 💬 Comunicação

### Canais
- **Issues**: Para bugs e feature requests
- **Discussions**: Para perguntas e discussões gerais
- **Email**: Para questões sensíveis

### Etiqueta
- Seja respeitoso e construtivo
- Forneça contexto suficiente
- Use linguagem clara e objetiva
- Seja paciente com revisões

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

**Obrigado por contribuir para o CertificateManager! 🚀**

Sua contribuição ajuda a melhorar a gestão de certificados de qualidade para distribuidores químicos em todo o Brasil.