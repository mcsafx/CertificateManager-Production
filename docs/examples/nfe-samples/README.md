# Exemplos de NFe para Teste

Este diretório contém arquivos XML de NFe (Nota Fiscal Eletrônica) fictícios que podem ser utilizados para testar o sistema de importação automática de certificados.

## Arquivos Disponíveis

### NFe-EXEMPLO-001.xml
- **Número**: 1/1
- **Emitente**: COCA-COLA FEMSA BRASIL LTDA
- **Destinatário**: CARREFOUR COMERCIO E INDUSTRIA LTDA
- **Produtos**: 
  - COCA-COLA 350ML LATA (240 unidades)
  - FANTA LARANJA 350ML LATA (120 unidades)
- **Valor Total**: R$ 876,00
- **Data**: 15/01/2025

**Observação**: Este é um exemplo fictício criado apenas para demonstração e teste do sistema.

## Como Usar

1. Acesse a página **Importar NFe** no sistema
2. Faça upload de um dos arquivos XML
3. O sistema irá:
   - Validar a estrutura da NFe
   - Resolver automaticamente o cliente (buscar existente ou criar novo)
   - Tentar mapear os produtos da NFe com o catálogo do sistema
   - Apresentar uma tela de revisão para confirmação
4. Após confirmar, certificados de qualidade serão gerados automaticamente

## Estrutura da NFe

Os arquivos seguem o padrão nacional de NFe v4.00 e contêm:
- Dados do emitente e destinatário
- Produtos com códigos, descrições, quantidades e valores
- Informações fiscais (ICMS, IPI, PIS, COFINS)
- Dados de transporte e pagamento
- Assinatura digital

## Observações

- Estes são exemplos reais anonimizados para fins de teste
- Use apenas em ambiente de desenvolvimento/teste
- Não compartilhe arquivos com dados sensíveis reais