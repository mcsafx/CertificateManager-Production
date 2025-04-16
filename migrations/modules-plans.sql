-- Criar as novas tabelas para o sistema de módulos e planos

-- Tabela de planos
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  storage_limit INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de módulos
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  is_core BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de relação entre planos e módulos
CREATE TABLE IF NOT EXISTS plan_modules (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  module_id INTEGER NOT NULL REFERENCES modules(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_module_unique PRIMARY KEY (plan_id, module_id)
);

-- Inserir planos padrão (A=Básico, B=Intermediário, C=Completo)
INSERT INTO plans (code, name, description, price, storage_limit, max_users, active)
VALUES 
  ('A', 'Básico', 'Plano básico com funcionalidades essenciais', 99.90, 2048, 3, TRUE),
  ('B', 'Intermediário', 'Plano intermediário com mais recursos', 249.90, 5120, 10, TRUE),
  ('C', 'Completo', 'Plano completo com todos os recursos', 499.90, 10240, 30, TRUE);

-- Inserir módulos do sistema
INSERT INTO modules (code, name, description, active, is_core)
VALUES 
  ('core', 'Core', 'Funcionalidades básicas do sistema', TRUE, TRUE),
  ('products', 'Produtos', 'Gerenciamento completo de produtos', TRUE, FALSE),
  ('certificates', 'Certificados', 'Gerenciamento básico de certificados', TRUE, FALSE),
  ('certificates_advanced', 'Certificados Avançados', 'Recursos avançados de certificados', TRUE, FALSE),
  ('traceability', 'Rastreabilidade', 'Sistema de rastreabilidade completo', TRUE, FALSE),
  ('analytics', 'Análises', 'Relatórios e dashboards avançados', TRUE, FALSE),
  ('multi_user', 'Multi-usuário', 'Permissões de usuários avançadas', TRUE, FALSE),
  ('api', 'API', 'Acesso à API do sistema', TRUE, FALSE);

-- Associar módulos aos planos
-- Plano Básico (A)
INSERT INTO plan_modules (plan_id, module_id)
SELECT p.id, m.id FROM plans p, modules m
WHERE p.code = 'A' AND m.code IN ('core', 'products', 'certificates');

-- Plano Intermediário (B)
INSERT INTO plan_modules (plan_id, module_id)
SELECT p.id, m.id FROM plans p, modules m
WHERE p.code = 'B' AND m.code IN ('core', 'products', 'certificates', 'certificates_advanced', 'multi_user');

-- Plano Completo (C)
INSERT INTO plan_modules (plan_id, module_id)
SELECT p.id, m.id FROM plans p, modules m
WHERE p.code = 'C';

-- Adicionar coluna de referência ao plano na tabela de tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS plan_id INTEGER;

-- Atualizar a estrutura para usar a nova coluna plan_id em vez da coluna plan
-- Definir plan_id baseado no valor atual de plan
UPDATE tenants 
SET plan_id = (SELECT id FROM plans WHERE code = tenants.plan)
WHERE plan_id IS NULL;

-- Tornar plan_id não nulo e adicionar a referência à tabela plans
ALTER TABLE tenants 
ALTER COLUMN plan_id SET NOT NULL,
ADD CONSTRAINT tenants_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);

-- Remover a coluna plan (opcional - comentar se quiser manter temporariamente)
-- ALTER TABLE tenants DROP COLUMN IF EXISTS plan;

-- Remover a coluna storage_limit (pois agora ela vem do plano)
-- ALTER TABLE tenants DROP COLUMN IF EXISTS storage_limit;