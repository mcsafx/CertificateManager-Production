-- =============================================================================
-- CertificateManager - Script de População de Dados Iniciais
-- =============================================================================
-- Popula o banco de dados com dados essenciais para funcionamento do sistema
-- Execute: psql -h localhost -U appuser -d tenant_management_db -f scripts/database/seed.sql
-- =============================================================================

-- Verificar se já existem dados
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM plans LIMIT 1) THEN
        RAISE NOTICE '⚠️  Dados já existem no banco. Pulando inserção de planos.';
    ELSE
        RAISE NOTICE '📊 Inserindo dados iniciais...';
    END IF;
END
$$;

-- =============================================================================
-- PLANOS DE ASSINATURA
-- =============================================================================

INSERT INTO plans (code, name, description, price, storage_limit, max_users, active) 
VALUES
    ('A', 'Plano Básico', 'Funcionalidades essenciais para pequenas empresas', 99.90, 1000, 5, true),
    ('B', 'Plano Intermediário', 'Recursos avançados para empresas em crescimento', 199.90, 5000, 15, true),
    ('C', 'Plano Completo', 'Todas as funcionalidades para grandes empresas', 399.90, 20000, 50, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    storage_limit = EXCLUDED.storage_limit,
    max_users = EXCLUDED.max_users,
    updated_at = NOW();

-- =============================================================================
-- MÓDULOS DO SISTEMA
-- =============================================================================

INSERT INTO modules (code, name, description, active, is_core) 
VALUES
    ('core', 'Módulo Core', 'Funcionalidades básicas do sistema (dashboard, usuários)', true, true),
    ('products', 'Módulo Produtos', 'Gestão completa de produtos e categorias químicas', true, false),
    ('certificates', 'Módulo Certificados', 'Emissão de certificados básicos de qualidade', true, false),
    ('certificates_advanced', 'Certificados Avançados', 'Recursos avançados: assinatura digital, templates customizados', true, false),
    ('multi_user', 'Multi-usuário', 'Gestão avançada de usuários e permissões granulares', true, false),
    ('traceability', 'Rastreabilidade', 'Sistema completo de rastreabilidade end-to-end', true, false),
    ('settings', 'Configurações', 'Configurações avançadas e personalizações do sistema', true, false),
    ('reports', 'Relatórios', 'Relatórios customizáveis e dashboard executivo', true, false),
    ('integrations', 'Integrações', 'APIs externas, webhooks e conectores', true, false)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    is_core = EXCLUDED.is_core;

-- =============================================================================
-- FUNCIONALIDADES DOS MÓDULOS
-- =============================================================================

-- Módulo Core (ID será 1)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (1, '/api/user', 'Perfil de Usuário', 'Acesso ao perfil do usuário atual', true),
    (1, '/api/auth/*', 'Autenticação', 'Sistema de login e autenticação', true),
    (1, '/api/logout', 'Logout', 'Encerramento de sessão', true),
    (1, '/api/files/basic', 'Arquivos Básicos', 'Upload e download de arquivos gerais', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Módulo Produtos (ID será 2)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (2, '/api/products', 'Listagem de Produtos', 'Visualizar lista de produtos', true),
    (2, '/api/products/*', 'Gestão de Produtos', 'CRUD completo de produtos', true),
    (2, '/api/product-categories', 'Listagem de Categorias', 'Visualizar categorias de produtos', true),
    (2, '/api/product-categories/*', 'Gestão de Categorias', 'CRUD de categorias de produtos', true),
    (2, '/api/product-subcategories', 'Listagem de Subcategorias', 'Visualizar subcategorias', true),
    (2, '/api/product-subcategories/*', 'Gestão de Subcategorias', 'CRUD de subcategorias', true),
    (2, '/api/product-base', 'Listagem Produtos Base', 'Visualizar produtos base', true),
    (2, '/api/product-base/*', 'Gestão Produtos Base', 'CRUD de produtos base', true),
    (2, '/api/manufacturers', 'Listagem de Fabricantes', 'Visualizar fabricantes', true),
    (2, '/api/manufacturers/*', 'Gestão de Fabricantes', 'CRUD de fabricantes', true),
    (2, '/api/suppliers', 'Listagem de Fornecedores', 'Visualizar fornecedores', true),
    (2, '/api/suppliers/*', 'Gestão de Fornecedores', 'CRUD de fornecedores', true),
    (2, '/api/package-types', 'Tipos de Embalagem', 'Gestão de tipos de embalagem', true),
    (2, '/api/package-types/*', 'Gestão Tipos Embalagem', 'CRUD de tipos de embalagem', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Módulo Certificados (ID será 3)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (3, '/api/entry-certificates', 'Listagem Boletins Entrada', 'Visualizar boletins de entrada', true),
    (3, '/api/entry-certificates/*', 'Gestão Boletins Entrada', 'CRUD de boletins de entrada', true),
    (3, '/api/certificates/view/*', 'Visualização Certificados', 'Visualizar certificados em HTML/PDF', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Módulo Certificados Avançados (ID será 4)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (4, '/api/issued-certificates', 'Listagem Boletins Emitidos', 'Visualizar certificados emitidos', true),
    (4, '/api/issued-certificates/*', 'Gestão Boletins Emitidos', 'CRUD de certificados emitidos', true),
    (4, '/api/certificates/templates/*', 'Templates Certificados', 'Gestão de templates personalizados', true),
    (4, '/api/certificates/digital-signature/*', 'Assinatura Digital', 'Certificados com assinatura digital', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Módulo Multi-usuário (ID será 5)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (5, '/api/users', 'Listagem de Usuários', 'Visualizar usuários do tenant', true),
    (5, '/api/users/*', 'Gestão de Usuários', 'CRUD completo de usuários', true),
    (5, '/api/admin/users/*', 'Administração Usuários', 'Gestão administrativa de usuários', true),
    (5, '/api/user-permissions/*', 'Permissões Usuários', 'Gestão granular de permissões', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Módulo Rastreabilidade (ID será 6)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (6, '/api/clients', 'Listagem de Clientes', 'Visualizar clientes', true),
    (6, '/api/clients/*', 'Gestão de Clientes', 'CRUD de clientes', true),
    (6, '/api/traceability/*', 'Sistema Rastreabilidade', 'Rastreabilidade completa de produtos', true),
    (6, '/api/lots/*', 'Gestão de Lotes', 'Controle de lotes de produção', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Módulo Configurações (ID será 7)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (7, '/api/settings/*', 'Configurações Avançadas', 'Personalização avançada do sistema', true),
    (7, '/api/tenant/settings/*', 'Configurações Tenant', 'Configurações específicas da empresa', true),
    (7, '/api/system/config/*', 'Configuração Sistema', 'Configurações de sistema', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Módulo Relatórios (ID será 8)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (8, '/api/reports/*', 'Relatórios Customizados', 'Geração de relatórios personalizados', true),
    (8, '/api/dashboard/stats/*', 'Estatísticas Dashboard', 'Métricas e estatísticas avançadas', true),
    (8, '/api/analytics/*', 'Analytics', 'Análises avançadas de dados', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Módulo Integrações (ID será 9)
INSERT INTO module_features (module_id, feature_path, feature_name, description, active) 
VALUES
    (9, '/api/webhooks/*', 'Webhooks', 'Configuração e gestão de webhooks', true),
    (9, '/api/external/*', 'API Externa', 'Acesso à API externa do sistema', true),
    (9, '/api/integrations/*', 'Integrações', 'Conectores e integrações com terceiros', true)
ON CONFLICT (module_id, feature_path) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- =============================================================================
-- ASSOCIAÇÃO PLANOS-MÓDULOS
-- =============================================================================

-- Plano Básico (A) - Módulos: Core, Produtos, Certificados
INSERT INTO plan_modules (plan_id, module_id) 
VALUES
    (1, 1),  -- Core
    (1, 2),  -- Produtos
    (1, 3)   -- Certificados
ON CONFLICT (plan_id, module_id) DO NOTHING;

-- Plano Intermediário (B) - Adiciona: Certificados Avançados, Multi-usuário
INSERT INTO plan_modules (plan_id, module_id) 
VALUES
    (2, 1),  -- Core
    (2, 2),  -- Produtos
    (2, 3),  -- Certificados
    (2, 4),  -- Certificados Avançados
    (2, 5)   -- Multi-usuário
ON CONFLICT (plan_id, module_id) DO NOTHING;

-- Plano Completo (C) - Todos os módulos
INSERT INTO plan_modules (plan_id, module_id) 
VALUES
    (3, 1),  -- Core
    (3, 2),  -- Produtos
    (3, 3),  -- Certificados
    (3, 4),  -- Certificados Avançados
    (3, 5),  -- Multi-usuário
    (3, 6),  -- Rastreabilidade
    (3, 7),  -- Configurações
    (3, 8),  -- Relatórios
    (3, 9)   -- Integrações
ON CONFLICT (plan_id, module_id) DO NOTHING;

-- =============================================================================
-- TENANT ADMINISTRATIVO (Sistema)
-- =============================================================================

INSERT INTO tenants (
    name, 
    cnpj, 
    address, 
    phone, 
    active, 
    plan_id, 
    storage_used, 
    plan_start_date, 
    plan_end_date, 
    payment_status
) VALUES (
    'Administração do Sistema', 
    '00.000.000/0000-00', 
    'Sistema CertificateManager', 
    '(00) 0000-0000', 
    true, 
    3,  -- Plano Completo
    0, 
    CURRENT_DATE, 
    CURRENT_DATE + INTERVAL '1 year', 
    'active'
)
ON CONFLICT (cnpj) DO UPDATE SET
    name = EXCLUDED.name,
    plan_id = EXCLUDED.plan_id,
    updated_at = NOW();

-- =============================================================================
-- USUÁRIO ADMINISTRADOR
-- =============================================================================

-- Senha 'admin123' hasheada com bcrypt
INSERT INTO users (
    username, 
    password, 
    name, 
    role, 
    tenant_id, 
    active
) VALUES (
    'admin', 
    '$2b$10$K8BVJKxe9XBHjQp9ZLwZIejhQ8fBpO1WH2.GgTkWZL7XJ5fGWXHCa',  -- admin123
    'Administrador do Sistema', 
    'system_admin', 
    1,  -- Tenant administrativo
    true
)
ON CONFLICT (username) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = NOW();

-- =============================================================================
-- DADOS DE DEMONSTRAÇÃO (Opcional)
-- =============================================================================

-- Categoria de produto exemplo
INSERT INTO product_categories (name, description, tenant_id, active) 
VALUES (
    'Produtos Químicos Industriais', 
    'Categoria para produtos químicos de uso industrial', 
    1, 
    true
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFICAÇÕES FINAIS
-- =============================================================================

-- Verificar quantos registros foram inseridos
DO $$
DECLARE
    plans_count INTEGER;
    modules_count INTEGER;
    features_count INTEGER;
    tenants_count INTEGER;
    users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plans_count FROM plans;
    SELECT COUNT(*) INTO modules_count FROM modules;
    SELECT COUNT(*) INTO features_count FROM module_features;
    SELECT COUNT(*) INTO tenants_count FROM tenants;
    SELECT COUNT(*) INTO users_count FROM users;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DADOS INSERIDOS COM SUCESSO!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Planos: %', plans_count;
    RAISE NOTICE 'Módulos: %', modules_count;
    RAISE NOTICE 'Funcionalidades: %', features_count;
    RAISE NOTICE 'Tenants: %', tenants_count;
    RAISE NOTICE 'Usuários: %', users_count;
    RAISE NOTICE '================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 CREDENCIAIS DE ACESSO:';
    RAISE NOTICE 'Usuário: admin';
    RAISE NOTICE 'Senha: admin123';
    RAISE NOTICE 'URL: http://localhost:5000';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Execute: npm run dev';
    RAISE NOTICE '2. Acesse: http://localhost:5000';
    RAISE NOTICE '3. Faça login com admin/admin123';
    RAISE NOTICE '';
END
$$;