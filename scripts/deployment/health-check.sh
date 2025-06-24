#!/bin/bash

# =============================================================================
# CertificateManager - Script de Verificação de Saúde
# =============================================================================
# Verifica se a aplicação está funcionando corretamente
# Testa conectividade, APIs, banco de dados e recursos do sistema
# =============================================================================

set -e  # Parar em caso de erro

# Configurações padrão
DEFAULT_URL="http://localhost:5000"
DEFAULT_TIMEOUT=10
DEFAULT_DB_HOST="localhost"
DEFAULT_DB_USER="appuser"
DEFAULT_DB_NAME="tenant_management_db"
DEFAULT_DB_PORT="5432"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    if [[ "$SILENT" != "true" ]]; then
        echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    fi
}

success() {
    if [[ "$SILENT" != "true" ]]; then
        echo -e "${GREEN}✅ $1${NC}"
    fi
}

warning() {
    if [[ "$SILENT" != "true" ]]; then
        echo -e "${YELLOW}⚠️  $1${NC}"
    fi
}

error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

# Contadores para estatísticas
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNINGS=0

# Função para registrar resultado de teste
test_result() {
    local status="$1"
    local message="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    case "$status" in
        "pass")
            TESTS_PASSED=$((TESTS_PASSED + 1))
            success "$message"
            ;;
        "fail")
            TESTS_FAILED=$((TESTS_FAILED + 1))
            error "$message"
            ;;
        "warn")
            TESTS_WARNINGS=$((TESTS_WARNINGS + 1))
            warning "$message"
            ;;
    esac
}

# Função de ajuda
show_help() {
    cat << EOF
🔍 CertificateManager - Verificação de Saúde

USO:
    $0 [OPTIONS]

OPÇÕES:
    -h, --help          Mostrar esta ajuda
    -s, --silent        Modo silencioso (apenas erros)
    -v, --verbose       Output verboso
    --url URL           URL da aplicação (padrão: $DEFAULT_URL)
    --timeout SECONDS   Timeout para requisições (padrão: $DEFAULT_TIMEOUT)
    --db-host HOST      Host do PostgreSQL (padrão: $DEFAULT_DB_HOST)
    --db-user USER      Usuário do PostgreSQL (padrão: $DEFAULT_DB_USER)
    --db-name DATABASE  Nome do banco (padrão: $DEFAULT_DB_NAME)
    --db-port PORT      Porta do PostgreSQL (padrão: $DEFAULT_DB_PORT)
    --skip-db          Pular verificações do banco de dados
    --skip-api         Pular verificações da API
    --skip-system      Pular verificações do sistema
    --fail-fast        Parar no primeiro erro

EXEMPLOS:
    $0                              # Verificação completa
    $0 --silent                     # Modo silencioso para CI/CD
    $0 --url http://prod.com:5000   # Verificar servidor remoto
    $0 --skip-db                    # Pular verificações de banco
    $0 --fail-fast                  # Parar no primeiro erro

CÓDIGOS DE SAÍDA:
    0   Todos os testes passaram
    1   Alguns testes falharam
    2   Erro crítico ou configuração inválida

EOF
}

# Verificar se curl está disponível
check_curl() {
    if ! command -v curl >/dev/null 2>&1; then
        test_result "fail" "curl não está instalado"
        exit 2
    fi
}

# Verificar conectividade com a aplicação
check_app_connectivity() {
    if [[ "$SKIP_API" == "true" ]]; then
        return 0
    fi
    
    log "Verificando conectividade com a aplicação..."
    
    local response
    local http_code
    
    # Tentar conectar à aplicação
    if response=$(curl -s -w "%{http_code}" --connect-timeout "$TIMEOUT" --max-time "$TIMEOUT" "$APP_URL" 2>/dev/null); then
        http_code="${response: -3}"
        
        if [[ "$http_code" =~ ^[2-3][0-9][0-9]$ ]]; then
            test_result "pass" "Aplicação respondendo (HTTP $http_code)"
        else
            test_result "fail" "Aplicação retornou HTTP $http_code"
            [[ "$FAIL_FAST" == "true" ]] && exit 1
        fi
    else
        test_result "fail" "Não foi possível conectar à aplicação em $APP_URL"
        [[ "$FAIL_FAST" == "true" ]] && exit 1
    fi
}

# Verificar endpoints específicos da API
check_api_endpoints() {
    if [[ "$SKIP_API" == "true" ]]; then
        return 0
    fi
    
    log "Verificando endpoints da API..."
    
    # Lista de endpoints para verificar
    local endpoints=(
        "/api/health"
        "/api/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="$APP_URL$endpoint"
        local response
        local http_code
        
        if response=$(curl -s -w "%{http_code}" --connect-timeout "$TIMEOUT" --max-time "$TIMEOUT" "$url" 2>/dev/null); then
            http_code="${response: -3}"
            
            if [[ "$http_code" =~ ^[2-3][0-9][0-9]$ ]]; then
                test_result "pass" "Endpoint $endpoint OK (HTTP $http_code)"
            else
                test_result "warn" "Endpoint $endpoint retornou HTTP $http_code"
            fi
        else
            test_result "warn" "Endpoint $endpoint não acessível"
        fi
    done
}

# Verificar conectividade com PostgreSQL
check_database_connectivity() {
    if [[ "$SKIP_DB" == "true" ]]; then
        return 0
    fi
    
    log "Verificando conectividade com PostgreSQL..."
    
    # Verificar se PostgreSQL está rodando
    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
            test_result "pass" "PostgreSQL está rodando em $DB_HOST:$DB_PORT"
        else
            test_result "fail" "PostgreSQL não está acessível em $DB_HOST:$DB_PORT"
            [[ "$FAIL_FAST" == "true" ]] && exit 1
        fi
    else
        test_result "warn" "pg_isready não disponível - pulando verificação de PostgreSQL"
    fi
}

# Verificar acesso ao banco de dados
check_database_access() {
    if [[ "$SKIP_DB" == "true" ]]; then
        return 0
    fi
    
    log "Verificando acesso ao banco de dados..."
    
    if command -v psql >/dev/null 2>&1; then
        # Testar conexão simples
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            test_result "pass" "Acesso ao banco '$DB_NAME' OK"
        else
            test_result "fail" "Não foi possível acessar o banco '$DB_NAME'"
            [[ "$FAIL_FAST" == "true" ]] && exit 1
        fi
        
        # Verificar tabelas principais
        local table_count
        if table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null); then
            if [[ "$table_count" -gt 0 ]]; then
                test_result "pass" "Banco contém $table_count tabelas"
            else
                test_result "warn" "Banco não possui tabelas ou schema não aplicado"
            fi
        else
            test_result "warn" "Não foi possível verificar tabelas do banco"
        fi
    else
        test_result "warn" "psql não disponível - pulando verificação de acesso ao banco"
    fi
}

# Verificar recursos do sistema
check_system_resources() {
    if [[ "$SKIP_SYSTEM" == "true" ]]; then
        return 0
    fi
    
    log "Verificando recursos do sistema..."
    
    # Verificar uso de memória
    if command -v free >/dev/null 2>&1; then
        local mem_usage
        mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        
        if [[ "$mem_usage" -lt 80 ]]; then
            test_result "pass" "Uso de memória: ${mem_usage}%"
        elif [[ "$mem_usage" -lt 90 ]]; then
            test_result "warn" "Uso de memória alto: ${mem_usage}%"
        else
            test_result "fail" "Uso de memória crítico: ${mem_usage}%"
        fi
    fi
    
    # Verificar espaço em disco
    if command -v df >/dev/null 2>&1; then
        local disk_usage
        disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
        
        if [[ "$disk_usage" -lt 80 ]]; then
            test_result "pass" "Uso de disco: ${disk_usage}%"
        elif [[ "$disk_usage" -lt 90 ]]; then
            test_result "warn" "Uso de disco alto: ${disk_usage}%"
        else
            test_result "fail" "Uso de disco crítico: ${disk_usage}%"
        fi
    fi
    
    # Verificar se porta está sendo usada
    if command -v lsof >/dev/null 2>&1; then
        local port=$(echo "$APP_URL" | sed 's/.*://' | sed 's/\/.*//')
        if [[ "$port" =~ ^[0-9]+$ ]]; then
            if lsof -i ":$port" >/dev/null 2>&1; then
                test_result "pass" "Porta $port está em uso"
            else
                test_result "warn" "Porta $port não está em uso"
            fi
        fi
    fi
}

# Verificar processos da aplicação
check_application_processes() {
    if [[ "$SKIP_SYSTEM" == "true" ]]; then
        return 0
    fi
    
    log "Verificando processos da aplicação..."
    
    # Verificar processo Node.js
    if pgrep -f "node.*index" >/dev/null 2>&1; then
        local node_count
        node_count=$(pgrep -f "node.*index" | wc -l)
        test_result "pass" "Processo Node.js rodando ($node_count processo(s))"
    else
        test_result "warn" "Processo Node.js não encontrado"
    fi
    
    # Verificar processo PostgreSQL (se local)
    if [[ "$DB_HOST" == "localhost" || "$DB_HOST" == "127.0.0.1" ]]; then
        if pgrep -f postgres >/dev/null 2>&1; then
            test_result "pass" "Processo PostgreSQL rodando"
        else
            test_result "fail" "Processo PostgreSQL não encontrado"
        fi
    fi
}

# Verificar configuração do sistema
check_system_configuration() {
    if [[ "$SKIP_SYSTEM" == "true" ]]; then
        return 0
    fi
    
    log "Verificando configuração do sistema..."
    
    # Verificar variáveis de ambiente importantes
    if [[ -n "$DATABASE_URL" ]]; then
        test_result "pass" "DATABASE_URL está configurada"
    else
        test_result "warn" "DATABASE_URL não está configurada"
    fi
    
    if [[ -n "$NODE_ENV" ]]; then
        test_result "pass" "NODE_ENV está configurada ($NODE_ENV)"
    else
        test_result "warn" "NODE_ENV não está configurada"
    fi
    
    # Verificar arquivo .env (se existir)
    if [[ -f ".env" ]]; then
        test_result "pass" "Arquivo .env encontrado"
    else
        test_result "warn" "Arquivo .env não encontrado"
    fi
    
    # Verificar package.json
    if [[ -f "package.json" ]]; then
        test_result "pass" "package.json encontrado"
    else
        test_result "fail" "package.json não encontrado"
    fi
}

# Mostrar resumo final
show_summary() {
    if [[ "$SILENT" == "true" ]]; then
        return 0
    fi
    
    echo ""
    echo "📊 RESUMO DA VERIFICAÇÃO DE SAÚDE"
    echo "=================================="
    echo "🎯 Total de testes: $TESTS_TOTAL"
    echo "✅ Testes passaram: $TESTS_PASSED"
    echo "⚠️  Avisos: $TESTS_WARNINGS"
    echo "❌ Testes falharam: $TESTS_FAILED"
    echo ""
    
    local success_rate=0
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi
    
    echo "📈 Taxa de sucesso: ${success_rate}%"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        if [[ $TESTS_WARNINGS -eq 0 ]]; then
            success "🎉 Sistema completamente saudável!"
        else
            warning "Sistema funcional com alguns avisos"
        fi
        echo ""
        echo "🔗 URL da aplicação: $APP_URL"
        echo "🗄️  Banco de dados: $DB_HOST:$DB_PORT/$DB_NAME"
        echo "⏰ Verificação em: $(date +'%Y-%m-%d %H:%M:%S')"
    else
        error "🚨 Sistema apresenta problemas críticos"
        echo ""
        echo "💡 PRÓXIMAS AÇÕES RECOMENDADAS:"
        echo "1. Verificar logs da aplicação"
        echo "2. Verificar conectividade de rede"
        echo "3. Verificar serviços (PostgreSQL, Node.js)"
        echo "4. Verificar configurações (.env, credenciais)"
    fi
    
    echo ""
}

# Função principal
main() {
    if [[ "$SILENT" != "true" ]]; then
        echo "🔍 CertificateManager - Verificação de Saúde"
        echo "==========================================="
        echo ""
    fi
    
    # Verificar dependências básicas
    check_curl
    
    # Executar verificações
    check_app_connectivity
    check_api_endpoints
    check_database_connectivity
    check_database_access
    check_system_resources
    check_application_processes
    check_system_configuration
    
    # Mostrar resumo
    show_summary
    
    # Determinar código de saída
    if [[ $TESTS_FAILED -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Valores padrão
APP_URL="$DEFAULT_URL"
TIMEOUT="$DEFAULT_TIMEOUT"
DB_HOST="$DEFAULT_DB_HOST"
DB_USER="$DEFAULT_DB_USER"
DB_NAME="$DEFAULT_DB_NAME"
DB_PORT="$DEFAULT_DB_PORT"
SILENT=false
VERBOSE=false
SKIP_DB=false
SKIP_API=false
SKIP_SYSTEM=false
FAIL_FAST=false

# Processar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--silent)
            SILENT=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --url)
            APP_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --db-host)
            DB_HOST="$2"
            shift 2
            ;;
        --db-user)
            DB_USER="$2"
            shift 2
            ;;
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        --db-port)
            DB_PORT="$2"
            shift 2
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --skip-api)
            SKIP_API=true
            shift
            ;;
        --skip-system)
            SKIP_SYSTEM=true
            shift
            ;;
        --fail-fast)
            FAIL_FAST=true
            shift
            ;;
        *)
            error "Opção desconhecida: $1"
            echo "Use --help para ver opções disponíveis"
            exit 2
            ;;
    esac
done

# Executar função principal
main