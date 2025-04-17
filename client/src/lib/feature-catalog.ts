/**
 * Catálogo de funcionalidades disponíveis no sistema
 * 
 * Cada módulo possui um conjunto de funcionalidades que podem ser habilitadas
 * As funcionalidades são organizadas por módulo para melhor visualização
 */

// Tipo que representa uma funcionalidade no catálogo
export interface CatalogFeature {
  id: string;        // Identificador único da funcionalidade
  name: string;      // Nome amigável da funcionalidade
  path: string;      // Caminho usado para verificação de permissões
  description: string; // Descrição da funcionalidade
  moduleCode: string;  // Código do módulo ao qual pertence
}

// Módulos disponíveis no sistema
export interface ModuleInfo {
  code: string;        // Código único do módulo
  name: string;        // Nome do módulo 
  description: string; // Descrição do módulo
}

// Catálogo de módulos disponíveis
export const MODULES: ModuleInfo[] = [
  {
    code: "core",
    name: "Core",
    description: "Funcionalidades básicas do sistema"
  },
  {
    code: "certificates", 
    name: "Certificados",
    description: "Gestão de certificados de qualidade"
  },
  {
    code: "products",
    name: "Produtos",
    description: "Gestão de produtos e suas características"
  },
  {
    code: "clients",
    name: "Clientes",
    description: "Gestão de clientes e destinatários de certificados"
  },
  {
    code: "suppliers",
    name: "Fornecedores",
    description: "Gestão de fornecedores e fabricantes"
  },
  {
    code: "reports",
    name: "Relatórios",
    description: "Relatórios e análises gerenciais"
  },
  {
    code: "settings",
    name: "Configurações",
    description: "Configurações do sistema e da conta"
  }
];

// Catálogo de funcionalidades disponíveis
export const FEATURES: CatalogFeature[] = [
  // Módulo Core
  {
    id: "core_dashboard",
    name: "Dashboard",
    path: "core/dashboard",
    description: "Visualização do painel principal",
    moduleCode: "core"
  },
  {
    id: "core_profile",
    name: "Perfil do Usuário",
    path: "core/profile",
    description: "Gerenciamento do perfil do usuário",
    moduleCode: "core"
  },
  
  // Módulo Certificados
  {
    id: "certificates_view_entry",
    name: "Visualizar Certificados de Entrada",
    path: "certificates/view-entry",
    description: "Visualização de certificados de entrada",
    moduleCode: "certificates"
  },
  {
    id: "certificates_create_entry",
    name: "Criar Certificados de Entrada",
    path: "certificates/create-entry",
    description: "Criação de certificados de entrada",
    moduleCode: "certificates"
  },
  {
    id: "certificates_view_issued",
    name: "Visualizar Certificados Emitidos",
    path: "certificates/view-issued",
    description: "Visualização de certificados emitidos",
    moduleCode: "certificates"
  },
  {
    id: "certificates_create_issued",
    name: "Emitir Certificados",
    path: "certificates/create-issued",
    description: "Emissão de certificados para clientes",
    moduleCode: "certificates"
  },
  
  // Módulo Produtos
  {
    id: "products_view",
    name: "Visualizar Produtos",
    path: "products/view",
    description: "Visualização do catálogo de produtos",
    moduleCode: "products"
  },
  {
    id: "products_create",
    name: "Criar Produtos",
    path: "products/create",
    description: "Criação de novos produtos",
    moduleCode: "products"
  },
  {
    id: "products_edit",
    name: "Editar Produtos",
    path: "products/edit",
    description: "Edição de produtos existentes",
    moduleCode: "products"
  },
  {
    id: "products_characteristics",
    name: "Gerenciar Características",
    path: "products/characteristics",
    description: "Gerenciamento de características de produtos",
    moduleCode: "products"
  },
  
  // Módulo Clientes
  {
    id: "clients_view",
    name: "Visualizar Clientes",
    path: "clients/view",
    description: "Visualização da lista de clientes",
    moduleCode: "clients"
  },
  {
    id: "clients_create",
    name: "Criar Clientes",
    path: "clients/create",
    description: "Criação de novos clientes",
    moduleCode: "clients"
  },
  {
    id: "clients_edit",
    name: "Editar Clientes",
    path: "clients/edit",
    description: "Edição de clientes existentes",
    moduleCode: "clients"
  },
  
  // Módulo Fornecedores
  {
    id: "suppliers_view",
    name: "Visualizar Fornecedores",
    path: "suppliers/view",
    description: "Visualização da lista de fornecedores",
    moduleCode: "suppliers"
  },
  {
    id: "suppliers_create",
    name: "Criar Fornecedores",
    path: "suppliers/create",
    description: "Criação de novos fornecedores",
    moduleCode: "suppliers"
  },
  {
    id: "suppliers_edit",
    name: "Editar Fornecedores",
    path: "suppliers/edit",
    description: "Edição de fornecedores existentes",
    moduleCode: "suppliers"
  },
  {
    id: "suppliers_manufacturers",
    name: "Gerenciar Fabricantes",
    path: "suppliers/manufacturers",
    description: "Gerenciamento de fabricantes",
    moduleCode: "suppliers"
  },
  
  // Módulo Relatórios
  {
    id: "reports_certificates",
    name: "Relatórios de Certificados",
    path: "reports/certificates",
    description: "Relatórios sobre certificados emitidos",
    moduleCode: "reports"
  },
  {
    id: "reports_clients",
    name: "Relatórios de Clientes",
    path: "reports/clients",
    description: "Relatórios sobre clientes",
    moduleCode: "reports"
  },
  {
    id: "reports_exports",
    name: "Exportação de Dados",
    path: "reports/exports",
    description: "Exportação de dados para formatos externos",
    moduleCode: "reports"
  },
  
  // Módulo Configurações
  {
    id: "settings_company",
    name: "Configurações da Empresa",
    path: "settings/company",
    description: "Configurações gerais da empresa",
    moduleCode: "settings"
  },
  {
    id: "settings_users",
    name: "Gerenciar Usuários",
    path: "settings/users",
    description: "Gerenciamento de usuários do sistema",
    moduleCode: "settings"
  },
  {
    id: "settings_roles",
    name: "Gerenciar Perfis",
    path: "settings/roles",
    description: "Gerenciamento de perfis e permissões",
    moduleCode: "settings"
  },
  {
    id: "settings_customization",
    name: "Personalização",
    path: "settings/customization",
    description: "Personalização da plataforma",
    moduleCode: "settings"
  }
];

/**
 * Retorna todas as funcionalidades de um determinado módulo
 */
export function getFeaturesByModule(moduleCode: string): CatalogFeature[] {
  return FEATURES.filter(feature => feature.moduleCode === moduleCode);
}

/**
 * Agrupa as funcionalidades por módulo
 */
export function getFeaturesByModuleGrouped(): Record<string, CatalogFeature[]> {
  const result: Record<string, CatalogFeature[]> = {};
  
  MODULES.forEach(module => {
    result[module.code] = getFeaturesByModule(module.code);
  });
  
  return result;
}

/**
 * Encontra uma funcionalidade pelo seu ID
 */
export function findFeatureById(id: string): CatalogFeature | undefined {
  return FEATURES.find(feature => feature.id === id);
}

/**
 * Encontra uma funcionalidade pelo seu caminho
 */
export function findFeatureByPath(path: string): CatalogFeature | undefined {
  return FEATURES.find(feature => feature.path === path);
}

/**
 * Encontra um módulo pelo seu código
 */
export function findModuleByCode(code: string): ModuleInfo | undefined {
  return MODULES.find(module => module.code === code);
}