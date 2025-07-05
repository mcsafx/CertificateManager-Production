# Exemplos de NFe para Teste

Este diretório contém arquivos XML de NFe (Nota Fiscal Eletrônica) que podem ser utilizados para testar o sistema de importação automática de certificados.

## Arquivos Disponíveis

### NFe-7410.xml
- **Número**: 7410/1
- **Emitente**: BIOCOL - IMPORTADORA E DISTRIBUIDORA S/A
- **Destinatário**: EMANUEL COLAGENS INDUSTRIAIS EIRELI - 424
- **Produto**: OE 0019 (25 KG)
- **Valor**: R$ 4.146,00
- **Data**: 04/07/2025

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