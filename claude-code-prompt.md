# Prompt para Claude Code - Organização de Documentação

## Instrução Principal

Preciso que você analise o arquivo `documentation-organization-guide.md` que está na raiz do projeto e organize a documentação e estrutura do projeto CertificateManager de acordo com as melhores práticas descritas no guia, **SEM QUEBRAR** funcionalidades existentes.

## Análise Necessária

1. **Leia o arquivo** `documentation-organization-guide.md` completamente
2. **Analise a estrutura atual** do projeto CertificateManager
3. **Identifique arquivos** de documentação existentes que precisam ser reorganizados
4. **Verifique dependências** para não quebrar imports ou referências

## Tarefas a Executar

### 1. Criar Estrutura de Pastas
```bash
# Criar estrutura conforme o guia, mas adaptada ao projeto atual
mkdir -p docs/{getting-started,development,deployment,api,features,database}
mkdir -p scripts/{setup,database,deployment,maintenance}
mkdir -p examples/{api-calls,configurations}
```

### 2. Reorganizar Documentação Existente
- Mover arquivos de documentação para `docs/` mantendo conteúdo
- Renomear arquivos seguindo convenção `kebab-case.md`
- Atualizar links internos se necessário
- **NÃO DELETAR** nenhum arquivo sem verificar dependências

### 3. Criar Arquivos Essenciais
- `CHANGELOG.md` na raiz
- `CONTRIBUTING.md` na raiz  
- `docs/README.md` como índice da documentação
- `docs/_config.yml` para GitHub Pages
- `scripts/README.md` documentando scripts existentes

### 4. Verificações de Segurança
- **Verificar** se algum arquivo de documentação é referenciado em código
- **Manter** todos os arquivos `.md` existentes (apenas mover/renomear)
- **Não alterar** configurações de build ou runtime
- **Não modificar** arquivos de código fonte (`.ts`, `.js`, `.tsx`)

### 5. Preservar Configurações
- **Manter** `.env.example` na raiz
- **Manter** `package.json` e `tsconfig.json` inalterados
- **Manter** estruturas de `client/`, `server/`, `shared/`

## Mapeamento Sugerido

Com base no que observei, organize assim:

```
# Arquivos que provavelmente existem → Novo local
README.md → manter na raiz (atualizar com links para docs/)
README (1).md → docs/getting-started/overview.md
DEPLOY_LOCALHOST.md → docs/deployment/local-installation.md  
deploy_local_guide.md → docs/deployment/virtualbox-guide.md
*.pdf → docs/deployment/ (manter nomes descritivos)
```

## Scripts a Criar

1. **scripts/database/seed.sql** - Para popular banco inicial
2. **scripts/setup/install-deps.sh** - Instalação automatizada
3. **scripts/deployment/health-check.sh** - Verificar aplicação

## Resultados Esperados

Após a execução:
1. ✅ Projeto com estrutura profissional
2. ✅ Documentação organizada e navegável
3. ✅ Links funcionando corretamente
4. ✅ Todas as funcionalidades preservadas
5. ✅ Pronto para GitHub Pages
6. ✅ Scripts documentados e utilizáveis

## Validação Final

Antes de confirmar, execute:
```bash
# Verificar se aplicação ainda funciona
npm install
npm run dev

# Verificar se todos os arquivos importantes estão presentes
ls -la docs/
ls -la scripts/
```

## Observações Importantes

- **PRIORIDADE MÁXIMA**: Não quebrar nada que já funciona
- **Fazer backup** mental dos arquivos movidos
- **Testar funcionamento** após reorganização
- **Documentar** as mudanças no commit
- **Criar** estrutura escalável para futuro crescimento

## Exemplo de Commit Message

```
docs: reorganizar documentação seguindo melhores práticas

- Criar estrutura docs/ organizada por funcionalidade
- Mover documentação existente para locais apropriados  
- Adicionar CHANGELOG.md e CONTRIBUTING.md
- Configurar estrutura para GitHub Pages
- Criar scripts organizados em scripts/
- Manter funcionalidades existentes intactas
```

Execute essas tarefas com cuidado e atenção aos detalhes. Em caso de dúvida sobre algum arquivo, pergunte antes de mover ou alterar.