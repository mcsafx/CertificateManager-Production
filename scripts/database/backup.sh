#!/bin/bash

# =============================================================================
# CertificateManager - Script de Backup do Banco de Dados
# =============================================================================
# Cria backup completo do banco PostgreSQL com timestamp
# Suporta backup comprimido e rotação automática de backups antigos
# =============================================================================

set -e  # Parar em caso de erro

# Configurações padrão
DEFAULT_HOST="localhost"
DEFAULT_USER="appuser"
DEFAULT_DB="tenant_management_db"
DEFAULT_PORT="5432"
BACKUP_DIR="backups"
MAX_BACKUPS=30  # Manter últimos 30 backups

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
💾 CertificateManager - Backup do Banco de Dados

USO:
    $0 [NOME_BACKUP] [OPTIONS]

ARGUMENTOS:
    NOME_BACKUP     Nome personalizado para o backup (opcional)
                    Se não fornecido, usa timestamp automático

OPÇÕES:
    -h, --help      Mostrar esta ajuda
    -v, --verbose   Output verboso
    -c, --compress  Comprimir backup (gzip)
    --host HOST     Host do PostgreSQL (padrão: $DEFAULT_HOST)
    --user USER     Usuário do PostgreSQL (padrão: $DEFAULT_USER)
    --db DATABASE   Nome do banco (padrão: $DEFAULT_DB)
    --port PORT     Porta do PostgreSQL (padrão: $DEFAULT_PORT)
    --dir DIRETORIO Diretório de backup (padrão: $BACKUP_DIR)
    --no-cleanup    Não limpar backups antigos
    --schema-only   Backup apenas do schema (sem dados)
    --data-only     Backup apenas dos dados (sem schema)

EXEMPLOS:
    $0                              # Backup completo com timestamp
    $0 antes_update                 # Backup com nome específico
    $0 -c --dir /backups/db         # Backup comprimido em diretório customizado
    $0 --schema-only                # Backup apenas do schema
    $0 --host prod.db.com --port 5433  # Backup de servidor remoto

ARQUIVO GERADO:
    backup_YYYYMMDD_HHMMSS.sql      # Formato padrão
    backup_nome_personalizado.sql   # Com nome personalizado

EOF
}

# Verificar dependências
check_dependencies() {
    # Verificar pg_dump
    if ! command -v pg_dump >/dev/null 2>&1; then
        error "pg_dump não está instalado. Instale PostgreSQL client tools."
        exit 1
    fi
    
    # Verificar gzip se compressão for solicitada
    if [[ "$COMPRESS" == "true" ]] && ! command -v gzip >/dev/null 2>&1; then
        error "gzip não está instalado e compressão foi solicitada."
        exit 1
    fi
    
    success "Dependências verificadas"
}

# Verificar conectividade
check_connectivity() {
    log "Verificando conectividade com o banco..."
    
    if ! pg_isready -h "$HOST" -p "$PORT" -U "$USER" >/dev/null 2>&1; then
        error "Não foi possível conectar ao PostgreSQL em $HOST:$PORT"
        error "Verifique se o serviço está rodando e se as credenciais estão corretas"
        exit 1
    fi
    
    # Testar acesso ao banco específico
    if ! psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -c "SELECT 1;" >/dev/null 2>&1; then
        error "Não foi possível acessar o banco '$DATABASE'"
        error "Verifique se o banco existe e se o usuário tem permissões"
        exit 1
    fi
    
    success "Conectividade verificada"
}

# Criar diretório de backup
create_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "Criando diretório de backup: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        success "Diretório criado: $BACKUP_DIR"
    fi
    
    # Verificar permissões de escrita
    if [[ ! -w "$BACKUP_DIR" ]]; then
        error "Sem permissão de escrita no diretório: $BACKUP_DIR"
        exit 1
    fi
}

# Gerar nome do arquivo de backup
generate_backup_filename() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    if [[ -n "$CUSTOM_NAME" ]]; then
        BACKUP_FILENAME="backup_${CUSTOM_NAME}.sql"
    else
        BACKUP_FILENAME="backup_${timestamp}.sql"
    fi
    
    # Adicionar extensão .gz se compressão estiver habilitada
    if [[ "$COMPRESS" == "true" ]]; then
        BACKUP_FILENAME="${BACKUP_FILENAME}.gz"
    fi
    
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILENAME"
}

# Executar backup
perform_backup() {
    log "Iniciando backup do banco '$DATABASE'..."
    
    # Construir comando pg_dump
    local pg_dump_cmd="pg_dump -h $HOST -p $PORT -U $USER -d $DATABASE"
    
    # Adicionar opções específicas
    if [[ "$SCHEMA_ONLY" == "true" ]]; then
        pg_dump_cmd="$pg_dump_cmd --schema-only"
        log "Modo: Schema apenas"
    elif [[ "$DATA_ONLY" == "true" ]]; then
        pg_dump_cmd="$pg_dump_cmd --data-only"
        log "Modo: Dados apenas"
    else
        log "Modo: Backup completo (schema + dados)"
    fi
    
    # Adicionar verbose se solicitado
    if [[ "$VERBOSE" == "true" ]]; then
        pg_dump_cmd="$pg_dump_cmd --verbose"
    fi
    
    # Executar backup
    local start_time=$(date +%s)
    
    if [[ "$COMPRESS" == "true" ]]; then
        log "Executando backup comprimido..."
        if eval "$pg_dump_cmd" | gzip > "$BACKUP_PATH"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            success "Backup comprimido criado em ${duration}s: $BACKUP_PATH"
        else
            error "Falha no backup comprimido"
            exit 1
        fi
    else
        log "Executando backup..."
        if eval "$pg_dump_cmd" > "$BACKUP_PATH"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            success "Backup criado em ${duration}s: $BACKUP_PATH"
        else
            error "Falha no backup"
            exit 1
        fi
    fi
}

# Verificar integridade do backup
verify_backup() {
    log "Verificando integridade do backup..."
    
    if [[ ! -f "$BACKUP_PATH" ]]; then
        error "Arquivo de backup não encontrado: $BACKUP_PATH"
        exit 1
    fi
    
    # Verificar tamanho mínimo (1KB)
    local file_size=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null)
    if [[ $file_size -lt 1024 ]]; then
        error "Arquivo de backup muito pequeno (${file_size} bytes). Pode estar corrompido."
        exit 1
    fi
    
    # Verificar se é arquivo comprimido válido
    if [[ "$COMPRESS" == "true" ]]; then
        if ! gzip -t "$BACKUP_PATH" 2>/dev/null; then
            error "Arquivo comprimido inválido ou corrompido"
            exit 1
        fi
    fi
    
    # Formatear tamanho para exibição
    local size_human
    if command -v numfmt >/dev/null 2>&1; then
        size_human=$(numfmt --to=iec-i --suffix=B "$file_size")
    else
        size_human="${file_size} bytes"
    fi
    
    success "Backup verificado: $size_human"
}

# Limpar backups antigos
cleanup_old_backups() {
    if [[ "$NO_CLEANUP" == "true" ]]; then
        log "Limpeza de backups antigos desabilitada"
        return 0
    fi
    
    log "Limpando backups antigos (mantendo $MAX_BACKUPS)..."
    
    # Contar backups atuais
    local backup_count=$(find "$BACKUP_DIR" -name "backup_*.sql*" -type f | wc -l)
    
    if [[ $backup_count -le $MAX_BACKUPS ]]; then
        success "Número de backups ($backup_count) dentro do limite ($MAX_BACKUPS)"
        return 0
    fi
    
    # Remover backups mais antigos
    local to_remove=$((backup_count - MAX_BACKUPS))
    local removed=0
    
    # Listar backups por data de modificação (mais antigos primeiro)
    find "$BACKUP_DIR" -name "backup_*.sql*" -type f -printf '%T@ %p\n' | sort -n | head -n "$to_remove" | while read -r line; do
        local file_path=$(echo "$line" | cut -d' ' -f2-)
        if [[ -f "$file_path" ]]; then
            rm "$file_path"
            log "Removido backup antigo: $(basename "$file_path")"
            ((removed++))
        fi
    done
    
    success "Limpeza concluída"
}

# Mostrar resumo final
show_summary() {
    echo ""
    echo "📊 RESUMO DO BACKUP"
    echo "==================="
    echo "🗄️  Banco: $DATABASE"
    echo "🖥️  Host: $HOST:$PORT"
    echo "👤 Usuário: $USER"
    echo "📁 Arquivo: $BACKUP_FILENAME"
    echo "📍 Caminho: $BACKUP_PATH"
    
    if [[ -f "$BACKUP_PATH" ]]; then
        local file_size=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null)
        local size_human
        if command -v numfmt >/dev/null 2>&1; then
            size_human=$(numfmt --to=iec-i --suffix=B "$file_size")
        else
            size_human="${file_size} bytes"
        fi
        echo "💾 Tamanho: $size_human"
    fi
    
    if [[ "$COMPRESS" == "true" ]]; then
        echo "🗜️  Compressão: Ativada"
    fi
    
    echo "⏰ Data: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "==================="
    echo ""
    success "✅ Backup concluído com sucesso!"
    echo ""
    echo "💡 COMO RESTAURAR:"
    if [[ "$COMPRESS" == "true" ]]; then
        echo "   gunzip -c \"$BACKUP_PATH\" | psql -h $HOST -U $USER -d $DATABASE"
    else
        echo "   psql -h $HOST -U $USER -d $DATABASE < \"$BACKUP_PATH\""
    fi
    echo ""
}

# Função principal
main() {
    echo "💾 CertificateManager - Backup do Banco de Dados"
    echo "==============================================="
    echo ""
    
    # Verificar dependências
    check_dependencies
    
    # Verificar conectividade
    check_connectivity
    
    # Criar diretório de backup
    create_backup_dir
    
    # Gerar nome do arquivo
    generate_backup_filename
    
    # Verificar se arquivo já existe
    if [[ -f "$BACKUP_PATH" ]]; then
        warning "Arquivo já existe: $BACKUP_PATH"
        read -p "Sobrescrever? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Backup cancelado pelo usuário"
            exit 0
        fi
    fi
    
    # Executar backup
    perform_backup
    
    # Verificar integridade
    verify_backup
    
    # Limpar backups antigos
    cleanup_old_backups
    
    # Mostrar resumo
    show_summary
}

# Valores padrão
HOST="$DEFAULT_HOST"
USER="$DEFAULT_USER"
DATABASE="$DEFAULT_DB"
PORT="$DEFAULT_PORT"
VERBOSE=false
COMPRESS=false
NO_CLEANUP=false
SCHEMA_ONLY=false
DATA_ONLY=false
CUSTOM_NAME=""

# Processar argumentos
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
        -c|--compress)
            COMPRESS=true
            shift
            ;;
        --host)
            HOST="$2"
            shift 2
            ;;
        --user)
            USER="$2"
            shift 2
            ;;
        --db)
            DATABASE="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --no-cleanup)
            NO_CLEANUP=true
            shift
            ;;
        --schema-only)
            SCHEMA_ONLY=true
            shift
            ;;
        --data-only)
            DATA_ONLY=true
            shift
            ;;
        -*)
            error "Opção desconhecida: $1"
            echo "Use --help para ver opções disponíveis"
            exit 1
            ;;
        *)
            # Primeiro argumento posicional é nome do backup
            if [[ -z "$CUSTOM_NAME" ]]; then
                CUSTOM_NAME="$1"
            else
                error "Muitos argumentos posicionais: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validar opções conflitantes
if [[ "$SCHEMA_ONLY" == "true" && "$DATA_ONLY" == "true" ]]; then
    error "As opções --schema-only e --data-only são mutuamente exclusivas"
    exit 1
fi

# Executar função principal
main