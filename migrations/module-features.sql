-- Criar tabela para armazenar as funcionalidades dos módulos
CREATE TABLE IF NOT EXISTS module_features (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  feature_path TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Inserir funcionalidades básicas para os módulos principais
-- Core (ID 1)
INSERT INTO module_features (module_id, feature_path, feature_name, description)
VALUES 
  (1, '/api/user', 'Perfil de Usuário', 'Acesso ao perfil do usuário atual'),
  (1, '/api/login', 'Autenticação', 'Login e verificação de credenciais'),
  (1, '/api/logout', 'Logout', 'Encerramento de sessão'),
  (1, '/api/files', 'Arquivos Básicos', 'Acesso a arquivos gerais do sistema');

-- Certificates (ID 2)
INSERT INTO module_features (module_id, feature_path, feature_name, description)
VALUES 
  (2, '/api/entry-certificates*', 'Boletins de Entrada', 'Gerenciamento de boletins de entrada'),
  (2, '/api/issued-certificates*', 'Boletins Emitidos', 'Gerenciamento de boletins emitidos'),
  (2, '/api/certificates/view*', 'Visualização de Certificados', 'Visualização de certificados em formato HTML/PDF');

-- Products (ID 3)
INSERT INTO module_features (module_id, feature_path, feature_name, description)
VALUES 
  (3, '/api/products*', 'Produtos', 'Gerenciamento de produtos'),
  (3, '/api/product-categories*', 'Categorias de Produtos', 'Gerenciamento de categorias de produtos'),
  (3, '/api/product-subcategories*', 'Subcategorias de Produtos', 'Gerenciamento de subcategorias de produtos'),
  (3, '/api/product-base*', 'Produtos Base', 'Gerenciamento de produtos base'),
  (3, '/api/package-types*', 'Tipos de Embalagem', 'Gerenciamento de tipos de embalagem');

-- Customers (ID 4)
INSERT INTO module_features (module_id, feature_path, feature_name, description)
VALUES 
  (4, '/api/clients*', 'Clientes', 'Gerenciamento de clientes'),
  (4, '/api/suppliers*', 'Fornecedores', 'Gerenciamento de fornecedores'),
  (4, '/api/manufacturers*', 'Fabricantes', 'Gerenciamento de fabricantes');

-- Reports (ID 5)
INSERT INTO module_features (module_id, feature_path, feature_name, description)
VALUES 
  (5, '/api/reports*', 'Relatórios', 'Geração e visualização de relatórios'),
  (5, '/api/dashboard/stats*', 'Estatísticas do Dashboard', 'Visualização de estatísticas no dashboard'),
  (5, '/api/traceability*', 'Rastreabilidade', 'Rastreabilidade de produtos e certificados');

-- Advanced (ID 6)
INSERT INTO module_features (module_id, feature_path, feature_name, description)
VALUES 
  (6, '/api/settings*', 'Configurações Avançadas', 'Configurações avançadas do tenant'),
  (6, '/api/templates*', 'Modelos Personalizados', 'Personalização de modelos de certificados'),
  (6, '/api/integrations*', 'Integrações', 'Integração com sistemas externos');

-- Criar índice para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_module_features_module_id ON module_features(module_id);
CREATE INDEX IF NOT EXISTS idx_module_features_feature_path ON module_features(feature_path);