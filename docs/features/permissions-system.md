# Sistema de Permissões e Módulos - CertificateManager

## Visão Geral

O CertificateManager utiliza um sistema de permissões baseado em **Planos → Módulos → Funcionalidades**, onde cada tenant (empresa) tem acesso a funcionalidades específicas baseadas no plano contratado.

## Estrutura do Sistema

### 1. Planos (`plans`)

Os planos definem diferentes níveis de serviço oferecidos:

| ID | Código | Nome | Descrição | Preço | Limite Storage | Max Usuários |
|----|--------|------|-----------|-------|----------------|--------------|
| 1 | A | Básico | Funcionalidades essenciais | R$ 99,00 | 500 MB | 3 usuários |
| 2 | B | Intermediário | Recursos intermediários | R$ 199,00 | 2 GB | 10 usuários |
| 3 | C | Completo | Acesso total ao sistema | R$ 399,00 | 10 GB | Ilimitado |

### 2. Módulos (`modules`)

Os módulos agrupam funcionalidades relacionadas do sistema:

| ID | Código | Nome | Descrição | Core |
|----|--------|------|-----------|------|
| 1 | core | Core | Funcionalidades básicas do sistema | ✓ |
| 2 | products | Produtos | Gerenciamento completo de produtos | ✗ |
| 3 | certificates | Certificados | Gerenciamento básico de certificados | ✗ |
| 4 | certificates_advanced | Certificados Avançados | Recursos avançados de certificados | ✗ |
| 5 | traceability | Rastreabilidade | Sistema de rastreabilidade completo | ✗ |
| 6 | analytics | Análises | Relatórios e dashboards avançados | ✗ |
| 7 | multi_user | Multi-usuário | Permissões de usuários avançadas | ✗ |
| 8 | api | API | Acesso à API do sistema | ✗ |

### 3. Funcionalidades (`module_features`)

As funcionalidades são endpoints específicos que cada módulo disponibiliza:

#### Módulo Core (ID: 1)
- `/api/auth/*` - Sistema de login e autenticação
- `/api/tenant/*` - Gerenciamento do perfil da empresa
- `/api/users` - Listagem de usuários
- `/api/users/*` - Gerenciamento completo de usuários

#### Módulo Produtos (ID: 2)
- `/api/products` - Listagem de produtos
- `/api/products/*` - CRUD completo de produtos
- `/api/product-categories` - Listagem de categorias
- `/api/product-categories/*` - CRUD de categorias
- `/api/product-subcategories` - Listagem de subcategorias
- `/api/product-subcategories/*` - CRUD de subcategorias
- `/api/product-base` - Listagem de produtos base
- `/api/product-base/*` - CRUD de produtos base
- `/api/manufacturers` - Listagem de fabricantes
- `/api/manufacturers/*` - CRUD de fabricantes
- `/api/suppliers` - Listagem de fornecedores
- `/api/suppliers/*` - CRUD de fornecedores
- `/api/clients` - Listagem de clientes
- `/api/clients/*` - CRUD de clientes

#### Módulo Certificados (ID: 3)
- `/api/entry-certificates` - Listagem de certificados de entrada
- `/api/entry-certificates/*` - CRUD de certificados de entrada
- `/api/issued-certificates` - Listagem de certificados emitidos
- `/api/issued-certificates/*` - CRUD de certificados emitidos

#### Módulo Certificados Avançados (ID: 4)
- `/api/certificates/bulk/*` - Processamento em lote
- `/api/certificates/templates/*` - Templates personalizados

#### Módulo Rastreabilidade (ID: 5)
- `/api/traceability/*` - Sistema de rastreabilidade
- `/api/lots/*` - Gerenciamento de lotes

#### Módulo Análises (ID: 6)
- `/api/analytics/*` - Análises e relatórios
- `/api/reports/*` - Geração de relatórios

#### Módulo Multi-usuário (ID: 7)
- `/api/user-permissions/*` - Permissões avançadas
- `/api/roles/*` - Papéis e funções

#### Módulo API (ID: 8)
- `/api/external/*` - API externa
- `/api/webhooks/*` - Configuração de webhooks

### 4. Associação Plano-Módulo (`plan_modules`)

Define quais módulos cada plano tem acesso:

#### Plano Básico (A)
- Core

#### Plano Intermediário (B)
- Core
- Produtos
- Certificados

#### Plano Completo (C)
- Core
- Produtos
- Certificados
- Certificados Avançados
- Rastreabilidade
- Análises
- Multi-usuário
- API

## Como Funciona o Sistema de Permissões

### Fluxo de Verificação

1. **Usuário faz requisição** para uma rota (ex: `/api/manufacturers`)
2. **Middleware `checkFeatureAccess`** intercepta a requisição
3. **Verifica se é admin** - se sim, permite acesso total
4. **Busca o tenant** do usuário logado
5. **Obtém o plano** do tenant
6. **Lista os módulos** associados ao plano
7. **Para cada módulo**, busca as funcionalidades
8. **Verifica se a rota** solicitada corresponde a alguma funcionalidade
9. **Permite ou nega** o acesso baseado na verificação

### Verificação de Padrões

O sistema suporta padrões com wildcard (`*`):
- `/api/products` - acesso apenas à listagem
- `/api/products/*` - acesso completo (GET, POST, PUT, DELETE)

Exemplos:
- `/api/products/123` ✓ corresponde a `/api/products/*`
- `/api/products/123/files` ✓ corresponde a `/api/products/*`
- `/api/users` ✗ NÃO corresponde a `/api/products/*`

## Implementação e Alterações

### Adicionando Nova Funcionalidade

#### Passo 1: Criar a rota no backend
```javascript
// Em server/routes.ts
app.get("/api/nova-funcionalidade", checkFeatureAccess, async (req, res) => {
  // Implementação
});
```

#### Passo 2: Cadastrar a funcionalidade no banco
```sql
INSERT INTO module_features (module_id, feature_path, feature_name, description) 
VALUES (2, '/api/nova-funcionalidade/*', 'Nova Funcionalidade', 'Descrição da funcionalidade');
```

#### Passo 3: Testar com diferentes planos
- Verificar se usuários de planos sem o módulo recebem erro 403
- Verificar se usuários de planos com o módulo têm acesso

### Criando Novo Módulo

#### Passo 1: Cadastrar o módulo
```sql
INSERT INTO modules (code, name, description, active, is_core) 
VALUES ('novo_modulo', 'Novo Módulo', 'Descrição do módulo', true, false);
```

#### Passo 2: Associar às funcionalidades
```sql
INSERT INTO module_features (module_id, feature_path, feature_name, description) 
VALUES (9, '/api/novo-modulo/*', 'Novo Módulo Completo', 'Todas as funcionalidades do novo módulo');
```

#### Passo 3: Associar aos planos desejados
```sql
-- Adicionar ao plano completo
INSERT INTO plan_modules (plan_id, module_id) VALUES (3, 9);
```

### Alterando Plano de um Tenant

```sql
-- Mudar tenant para plano intermediário
UPDATE tenants SET plan_id = 2 WHERE id = 1;
```

### Criando Novo Plano

#### Passo 1: Cadastrar o plano
```sql
INSERT INTO plans (code, name, description, price, storage_limit, max_users, active) 
VALUES ('D', 'Enterprise', 'Plano corporativo', '999.00', 50000, 100, true);
```

#### Passo 2: Associar módulos
```sql
-- Associar todos os módulos ao plano enterprise
INSERT INTO plan_modules (plan_id, module_id) 
SELECT 4, id FROM modules WHERE active = true;
```

## Debugging de Permissões

### Verificar permissões de um usuário
```sql
-- Ver qual plano o usuário tem
SELECT u.username, t.name as tenant_name, p.name as plan_name, p.code 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
JOIN plans p ON t.plan_id = p.id 
WHERE u.username = 'nome_usuario';

-- Ver módulos disponíveis para o usuário
SELECT m.name as module_name, m.code 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
JOIN plan_modules pm ON t.plan_id = pm.plan_id 
JOIN modules m ON pm.module_id = m.id 
WHERE u.username = 'nome_usuario';

-- Ver funcionalidades disponíveis
SELECT mf.feature_path, mf.feature_name, m.name as module_name 
FROM users u 
JOIN tenants t ON u.tenant_id = t.id 
JOIN plan_modules pm ON t.plan_id = pm.plan_id 
JOIN module_features mf ON pm.module_id = mf.module_id 
JOIN modules m ON mf.module_id = m.id 
WHERE u.username = 'nome_usuario' 
ORDER BY m.name, mf.feature_path;
```

### Logs de Debugging

O sistema gera logs úteis no console:
```
[checkFeatureAccess] Acesso negado para {username} à feature {path}
[checkFeatureAccess] Acesso permitido para {username} à feature {path}
```

## Roles de Usuário

Além dos módulos, existem roles especiais:

- **`system_admin`** - Acesso total ao sistema, incluindo área administrativa
- **`admin`** - Acesso administrativo (bypass de permissões)
- **`user`** - Usuário normal, sujeito às permissões do plano

## Middleware de Verificação

### `checkFeatureAccess`
- Verificação principal de permissões por funcionalidade
- Aplicado nas rotas que precisam controle de acesso

### `isAuthenticated`
- Verifica se o usuário está logado
- Aplicado em todas as rotas protegidas

### `isAdmin`
- Verifica se o usuário é administrador
- Usado em rotas administrativas

### `isTenantMember`
- Verifica se o usuário pertence ao tenant específico
- Usado para isolamento de dados entre tenants

## Boas Práticas

1. **Sempre use padrões com wildcard** para funcionalidades CRUD
2. **Teste com diferentes planos** antes de implementar
3. **Use logs para debugging** quando algo não funcionar
4. **Mantenha consistência** nos nomes de módulos e funcionalidades
5. **Documente novas funcionalidades** neste arquivo
6. **Verifique o isolamento** entre tenants

## Troubleshooting Comum

### Erro 403 - Acesso Negado
1. Verificar se a funcionalidade está cadastrada em `module_features`
2. Verificar se o módulo está associado ao plano em `plan_modules`
3. Verificar se o tenant tem o plano correto
4. Verificar logs do console para detalhes

### Funcionalidade não funciona para nenhum usuário
- Provavelmente a funcionalidade não está cadastrada no banco
- Verificar se o path está correto (com/sem wildcard)

### Funciona para admin mas não para usuários normais
- Problema na associação módulo-plano ou funcionalidade-módulo
- Verificar tabelas `plan_modules` e `module_features`