#!/bin/bash

# =============================================================================
# CertificateManager - Script de Instalação de Dependências
# =============================================================================
# Instala automaticamente todas as dependências necessárias para o projeto
# Testado no Ubuntu 20.04+ e Debian 11+
# =============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função de ajuda
show_help() {
    cat << EOF
🛠️  CertificateManager - Instalador de Dependências

USO:
    $0 [OPTIONS]

OPÇÕES:
    -h, --help          Mostrar esta ajuda
    -v, --verbose       Output verboso
    -y, --yes          Responder 'sim' para todas as perguntas
    --check-deps       Apenas verificar dependências existentes
    --node-only        Instalar apenas Node.js
    --postgres-only    Instalar apenas PostgreSQL

EXEMPLOS:
    $0                  # Instalação completa interativa
    $0 -y               # Instalação completa automática
    $0 --check-deps     # Verificar o que já está instalado

DEPENDÊNCIAS INSTALADAS:
    - Node.js 20+
    - PostgreSQL 12+
    - npm/npx
    - curl, git, build-essential

EOF
}

# Verificar dependências existentes
check_dependencies() {
    log "Verificando dependências existentes..."
    
    echo "=== VERIFICAÇÃO DE DEPENDÊNCIAS ==="
    
    # Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        success "Node.js: $NODE_VERSION"
    else
        warning "Node.js: Não instalado"
    fi
    
    # npm
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        success "npm: $NPM_VERSION"
    else
        warning "npm: Não instalado"
    fi
    
    # PostgreSQL
    if command -v psql >/dev/null 2>&1; then
        PSQL_VERSION=$(psql --version | head -n1)
        success "PostgreSQL: $PSQL_VERSION"
    else
        warning "PostgreSQL: Não instalado"
    fi
    
    # Git
    if command -v git >/dev/null 2>&1; then
        GIT_VERSION=$(git --version)
        success "Git: $GIT_VERSION"
    else
        warning "Git: Não instalado"
    fi
    
    # curl
    if command -v curl >/dev/null 2>&1; then
        success "curl: Instalado"
    else
        warning "curl: Não instalado"
    fi
    
    echo "=========================="
}

# Verificar se é Ubuntu/Debian
check_os() {
    if [[ ! -f /etc/os-release ]]; then
        error "Sistema operacional não suportado. Requer Ubuntu/Debian."
        exit 1
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        warning "Sistema $ID detectado. Script testado apenas no Ubuntu/Debian."
        if [[ "$AUTO_YES" != "true" ]]; then
            read -p "Continuar mesmo assim? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
}

# Atualizar sistema
update_system() {
    log "Atualizando lista de pacotes..."
    sudo apt update
    
    if [[ "$AUTO_YES" == "true" || "$VERBOSE" == "true" ]]; then
        log "Instalando atualizações básicas..."
        sudo apt upgrade -y
    else
        read -p "Atualizar pacotes do sistema? (recomendado) [Y/n]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            sudo apt upgrade -y
        fi
    fi
}

# Instalar dependências básicas
install_basic_deps() {
    log "Instalando dependências básicas..."
    
    local packages="curl git build-essential"
    
    for package in $packages; do
        if ! dpkg -l | grep -q "^ii.*$package "; then
            log "Instalando $package..."
            sudo apt install -y $package
            success "$package instalado"
        else
            success "$package já está instalado"
        fi
    done
}

# Instalar Node.js 20
install_nodejs() {
    if command -v node >/dev/null 2>&1; then
        local current_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $current_version -ge 20 ]]; then
            success "Node.js $current_version já está instalado (>=20)"
            return 0
        else
            warning "Node.js $current_version é muito antigo. Atualizando..."
        fi
    fi
    
    log "Instalando Node.js 20..."
    
    # Adicionar repositório NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    
    # Instalar Node.js
    sudo apt install -y nodejs
    
    # Verificar instalação
    if command -v node >/dev/null 2>&1; then
        local version=$(node --version)
        success "Node.js $version instalado com sucesso"
    else
        error "Falha na instalação do Node.js"
        exit 1
    fi
}

# Instalar PostgreSQL
install_postgresql() {
    if command -v psql >/dev/null 2>&1; then
        success "PostgreSQL já está instalado"
        return 0
    fi
    
    log "Instalando PostgreSQL..."
    
    sudo apt install -y postgresql postgresql-contrib
    
    # Iniciar e habilitar serviço
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Verificar se está rodando
    if sudo systemctl is-active --quiet postgresql; then
        success "PostgreSQL instalado e rodando"
    else
        error "PostgreSQL instalado mas não está rodando"
        exit 1
    fi
}

# Configurar PostgreSQL
configure_postgresql() {
    log "Configurando PostgreSQL para desenvolvimento..."
    
    # Verificar se usuário já existe
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='appuser'" | grep -q 1; then
        success "Usuário 'appuser' já existe no PostgreSQL"
    else
        log "Criando usuário 'appuser' no PostgreSQL..."
        sudo -u postgres psql << 'EOF'
CREATE USER appuser WITH PASSWORD 'DevLocal2024';
ALTER USER appuser CREATEDB;
EOF
        success "Usuário 'appuser' criado no PostgreSQL"
    fi
    
    # Verificar se banco já existe
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw tenant_management_db; then
        success "Banco 'tenant_management_db' já existe"
    else
        log "Criando banco 'tenant_management_db'..."
        sudo -u postgres psql << 'EOF'
CREATE DATABASE tenant_management_db OWNER appuser;
GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;
EOF
        success "Banco 'tenant_management_db' criado"
    fi
    
    # Configurar autenticação automática
    local pgpass_file="$HOME/.pgpass"
    if [[ ! -f "$pgpass_file" ]] || ! grep -q "appuser" "$pgpass_file"; then
        log "Configurando autenticação automática..."
        echo "localhost:5432:tenant_management_db:appuser:DevLocal2024" >> "$pgpass_file"
        chmod 600 "$pgpass_file"
        success "Autenticação automática configurada"
    else
        success "Autenticação automática já configurada"
    fi
}

# Instalar dependências do projeto
install_project_deps() {
    if [[ ! -f "package.json" ]]; then
        warning "package.json não encontrado. Pulando instalação de dependências do projeto."
        return 0
    fi
    
    log "Instalando dependências do projeto..."
    
    # Verificar se node_modules existe
    if [[ -d "node_modules" ]]; then
        log "node_modules existe. Verificando se precisa atualizar..."
        npm install
    else
        log "Instalando dependências pela primeira vez..."
        npm install
    fi
    
    success "Dependências do projeto instaladas"
}

# Verificar instalação final
verify_installation() {
    log "Verificando instalação final..."
    
    echo ""
    echo "=== VERIFICAÇÃO FINAL ==="
    
    # Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        success "Node.js: $node_version"
    else
        error "Node.js: FALHOU"
        return 1
    fi
    
    # npm
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        success "npm: $npm_version"
    else
        error "npm: FALHOU"
        return 1
    fi
    
    # PostgreSQL
    if command -v psql >/dev/null 2>&1 && sudo systemctl is-active --quiet postgresql; then
        success "PostgreSQL: Rodando"
    else
        error "PostgreSQL: FALHOU"
        return 1
    fi
    
    # Teste de conexão com banco
    if psql -h localhost -U appuser -d tenant_management_db -c "SELECT 1;" >/dev/null 2>&1; then
        success "Conexão com banco: OK"
    else
        error "Conexão com banco: FALHOU"
        return 1
    fi
    
    echo "========================="
    echo ""
    success "🎉 Instalação concluída com sucesso!"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo "   1. Configure variáveis de ambiente: ./scripts/setup/configure-env.sh"
    echo "   2. Execute migrações: npm run db:push"
    echo "   3. Inicie aplicação: npm run dev"
    echo ""
}

# Função principal
main() {
    echo "🛠️  CertificateManager - Instalador de Dependências"
    echo "=================================================="
    echo ""
    
    # Verificar sistema operacional
    check_os
    
    # Se for apenas verificação, executar e sair
    if [[ "$CHECK_ONLY" == "true" ]]; then
        check_dependencies
        exit 0
    fi
    
    # Verificar dependências atuais
    check_dependencies
    echo ""
    
    # Confirmar instalação
    if [[ "$AUTO_YES" != "true" ]]; then
        read -p "Continuar com a instalação? [Y/n]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            log "Instalação cancelada pelo usuário"
            exit 0
        fi
    fi
    
    # Executar instalação
    log "Iniciando instalação..."
    
    update_system
    install_basic_deps
    
    if [[ "$POSTGRES_ONLY" != "true" ]]; then
        install_nodejs
    fi
    
    if [[ "$NODE_ONLY" != "true" ]]; then
        install_postgresql
        configure_postgresql
    fi
    
    install_project_deps
    verify_installation
}

# Processar argumentos
AUTO_YES=false
VERBOSE=false
CHECK_ONLY=false
NODE_ONLY=false
POSTGRES_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -y|--yes)
            AUTO_YES=true
            shift
            ;;
        --check-deps)
            CHECK_ONLY=true
            shift
            ;;
        --node-only)
            NODE_ONLY=true
            shift
            ;;
        --postgres-only)
            POSTGRES_ONLY=true
            shift
            ;;
        *)
            error "Opção desconhecida: $1"
            echo "Use --help para ver opções disponíveis"
            exit 1
            ;;
    esac
done

# Executar função principal
main