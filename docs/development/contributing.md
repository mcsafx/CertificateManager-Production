# 🤝 Guia de Contribuição - Desenvolvedores

Guia específico para desenvolvedores que querem contribuir com o CertificateManager.

## 📖 Visão Geral

Este documento complementa o [CONTRIBUTING.md](../../CONTRIBUTING.md) principal com informações técnicas específicas para desenvolvedores.

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica
- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Drizzle ORM
- **Banco**: PostgreSQL com isolamento multi-tenant
- **Auth**: Passport.js + Express Sessions
- **Build**: Vite (frontend) + TSC (backend)

### Estrutura de Pastas
```
├── client/src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/         # Páginas/rotas da aplicação
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilitários, clients, configurações
│   └── types/         # Definições de tipos TypeScript
├── server/
│   ├── auth.ts        # Configuração de autenticação
│   ├── routes.ts      # Definição de rotas da API
│   ├── db.ts          # Configuração do banco de dados
│   ├── middlewares/   # Middlewares customizados
│   └── services/      # Lógica de negócio
├── shared/
│   └── schema.ts      # Schema Drizzle compartilhado
└── migrations/        # Migrações do banco de dados
```

## 🎯 Padrões de Desenvolvimento

### 1. Multi-tenancy
**CRÍTICO**: Todo código deve respeitar isolamento entre tenants.

```typescript
// ✅ CORRETO: Filtrar por tenantId
const products = await db
  .select()
  .from(productsTable)
  .where(eq(productsTable.tenantId, req.user.tenantId));

// ❌ INCORRETO: Sem filtro de tenant
const products = await db.select().from(productsTable);
```

### 2. Feature Gates
Todas as funcionalidades devem usar Feature Gates:

```typescript
// Backend: Middleware de verificação
app.get("/api/products", checkFeatureAccess, async (req, res) => {
  // implementação
});

// Frontend: Componente protegido
<FeatureGate featurePath="products/view">
  <ProductsList />
</FeatureGate>
```

### 3. Validação de Dados
Use Zod para validação tanto no frontend quanto backend:

```typescript
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  categoryId: z.number().positive(),
  tenantId: z.number().positive(), // Sempre incluir
});

type Product = z.infer<typeof productSchema>;
```

### 4. Tratamento de Erros
```typescript
// Backend: Middleware de erro consistente
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      error: "Dados inválidos", 
      details: error.errors 
    });
  }
  
  res.status(500).json({ 
    error: "Erro interno do servidor" 
  });
});

// Frontend: Error boundaries e tratamento
const { data, error, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  onError: (error) => {
    toast.error("Erro ao carregar produtos");
    console.error("Products fetch error:", error);
  }
});
```

## 🧪 Testes (Estrutura Futura)

### Estrutura de Testes
```
tests/
├── unit/
│   ├── components/    # Testes de componentes React
│   ├── hooks/        # Testes de custom hooks
│   ├── services/     # Testes de serviços
│   └── utils/        # Testes de utilitários
├── integration/
│   ├── api/          # Testes de endpoints
│   └── database/     # Testes de queries
├── e2e/
│   ├── auth/         # Fluxos de autenticação
│   ├── products/     # Fluxos de produtos
│   └── certificates/ # Fluxos de certificados
└── fixtures/
    ├── users.json    # Dados de teste
    └── products.json # Produtos de teste
```

### Exemplos de Testes

#### Teste de Componente (Jest + Testing Library)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';

describe('ProductCard', () => {
  it('should display product information', () => {
    const mockProduct = {
      id: 1,
      name: 'Produto Teste',
      description: 'Descrição teste',
      tenantId: 1
    };

    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Produto Teste')).toBeInTheDocument();
    expect(screen.getByText('Descrição teste')).toBeInTheDocument();
  });
});
```

#### Teste de API (Supertest)
```typescript
import request from 'supertest';
import { app } from '../server/index';

describe('GET /api/products', () => {
  it('should return products for authenticated user', async () => {
    const response = await request(app)
      .get('/api/products')
      .set('Cookie', ['session=valid_session'])
      .expect(200);

    expect(response.body).toHaveProperty('length');
    expect(response.body[0]).toHaveProperty('tenantId');
  });
});
```

## 🔄 Workflow de Desenvolvimento

### 1. Configuração Inicial
```bash
# Setup completo do ambiente
npm run setup:dev  # Script que criamos

# Ou manual:
npm install
npm run db:push
npm run db:seed  # Se existir
npm run dev
```

### 2. Desenvolvimento de Feature
```bash
# 1. Criar branch
git checkout -b feature/nova-funcionalidade

# 2. Implementar seguindo padrões:
# - Sempre incluir tenantId
# - Usar Feature Gates
# - Validar com Zod
# - Tratar erros adequadamente

# 3. Testar localmente
npm run dev
# Testar funcionalidade manualmente

# 4. Commit e push
git add .
git commit -m "feat: adicionar nova funcionalidade X"
git push origin feature/nova-funcionalidade
```

### 3. Code Review Checklist
Antes de abrir PR, verificar:

- [ ] **Multi-tenancy**: Todas as queries filtram por `tenantId`
- [ ] **Feature Gates**: Funcionalidade protegida adequadamente
- [ ] **Validação**: Dados validados com Zod
- [ ] **Tratamento de Erro**: Erros tratados graciosamente
- [ ] **TypeScript**: Sem erros de tipo
- [ ] **Performance**: Queries otimizadas
- [ ] **Segurança**: Sem exposição de dados sensíveis
- [ ] **Documentação**: Código documentado se necessário

## 🛠️ Ferramentas de Desenvolvimento

### 1. Scripts NPM Úteis
```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build && tsc -p server",
    "start": "node dist/index.js",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
  }
}
```

### 2. VS Code Snippets
```json
// .vscode/snippets.json
{
  "React Component with Feature Gate": {
    "prefix": "fgcomponent",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  ${2:prop}: ${3:type};",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ ${2:prop} }) => {",
      "  return (",
      "    <FeatureGate featurePath=\"${4:feature/path}\">",
      "      <div>",
      "        ${5:// Component content}",
      "      </div>",
      "    </FeatureGate>",
      "  );",
      "};"
    ]
  }
}
```

### 3. Debug Configuration
```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "true"
      }
    }
  ]
}
```

## 📊 Monitoramento e Performance

### 1. Logging Estruturado
```typescript
// Usar logging consistente
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta);
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, { error: error?.message, stack: error?.stack, ...meta });
  },
  debug: (message: string, meta?: any) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} ${message}`, meta);
    }
  }
};
```

### 2. Performance Monitoring
```typescript
// Middleware de performance
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      duration: `${duration}ms`,
      status: res.statusCode,
      tenantId: req.user?.tenantId
    });
  });
  
  next();
};
```

## 🔐 Segurança

### 1. Validação de Input
```typescript
// Sempre validar entrada
const createProductHandler = async (req: Request, res: Response) => {
  try {
    // Validar dados
    const productData = productSchema.parse(req.body);
    
    // Forçar tenantId do usuário logado
    const safeProductData = {
      ...productData,
      tenantId: req.user.tenantId // NUNCA confiar no frontend
    };
    
    const newProduct = await db.insert(products).values(safeProductData);
    res.json(newProduct);
  } catch (error) {
    // Log detalhado para debug, resposta genérica para cliente
    logger.error('Erro ao criar produto', error, { 
      userId: req.user.id,
      tenantId: req.user.tenantId 
    });
    res.status(500).json({ error: 'Erro interno' });
  }
};
```

### 2. Autorização
```typescript
// Verificar permissões sempre
const checkResourceOwnership = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  const resource = await db
    .select()
    .from(products)
    .where(and(
      eq(products.id, parseInt(id)),
      eq(products.tenantId, req.user.tenantId)
    ));
  
  if (!resource.length) {
    return res.status(404).json({ error: 'Recurso não encontrado' });
  }
  
  next();
};
```

## 📈 Otimizações

### 1. Queries do Banco
```typescript
// ✅ Query otimizada com índices
const getProductsWithCategory = await db
  .select({
    id: products.id,
    name: products.name,
    categoryName: categories.name
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .where(eq(products.tenantId, tenantId))
  .limit(50); // Sempre limitar resultados

// ❌ Query não otimizada
const allProducts = await db.select().from(products); // Sem filtros
```

### 2. Frontend Performance
```typescript
// Usar React.memo para componentes pesados
export const ProductList = React.memo<ProductListProps>(({ products }) => {
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
});

// Usar useMemo para cálculos pesados
const expensiveValue = useMemo(() => {
  return products.reduce((sum, p) => sum + p.price, 0);
}, [products]);
```

## 📝 Documentação de Código

### 1. Comentários TSDoc
```typescript
/**
 * Cria um novo produto no sistema
 * @param productData - Dados do produto a ser criado
 * @param tenantId - ID do tenant (empresa) proprietária
 * @returns Promise com o produto criado
 * @throws {ValidationError} Quando dados são inválidos
 * @throws {DatabaseError} Quando há erro na persistência
 */
export async function createProduct(
  productData: CreateProductData, 
  tenantId: number
): Promise<Product> {
  // implementação
}
```

### 2. README de Componentes
```markdown
# ProductCard Component

Componente para exibir informações básicas de um produto.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| product | Product | Yes | Dados do produto |
| onEdit | (id: number) => void | No | Callback para edição |
| onDelete | (id: number) => void | No | Callback para exclusão |

## Example

```tsx
<ProductCard 
  product={product} 
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```
```

---

**🎯 Lembre-se: Qualidade sobre quantidade. É melhor uma feature bem implementada do que várias mal feitas.**