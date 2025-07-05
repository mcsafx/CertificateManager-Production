# 🔌 API Endpoints

Documentação completa da API REST do CertificateManager.

## 🔐 Autenticação

### `POST /api/login`
**Descrição**: Autenticação do usuário no sistema

**Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "user@example.com",
    "name": "Nome do Usuário",
    "role": "user",
    "tenantId": 1
  }
}
```

### `POST /api/logout`
**Descrição**: Logout do usuário

**Response**:
```json
{
  "success": true
}
```

### `GET /api/user`
**Descrição**: Obtém dados do usuário atual

**Response**:
```json
{
  "id": 1,
  "username": "user@example.com",
  "name": "Nome do Usuário",
  "role": "user",
  "tenantId": 1
}
```

## 📄 Importação NFe

### `POST /api/nfe/validate`
**Descrição**: Validação prévia de arquivo XML NFe

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "xmlContent": "<?xml version=\"1.0\"...><!-- XML NFe completo -->"
}
```

**Response**:
```json
{
  "isValid": true,
  "summary": {
    "numeroNFe": "000000123",
    "serie": "1",
    "dataEmissao": "2024-01-15",
    "destinatario": "EMPRESA EXEMPLO LTDA",
    "cnpjDestinatario": "12.345.678/0001-90",
    "totalItens": 5,
    "valorTotal": 15678.90
  },
  "errors": []
}
```

### `POST /api/nfe/upload`
**Descrição**: Upload e processamento completo de NFe

**Headers**:
```
Content-Type: multipart/form-data
```

**Body** (FormData):
```
nfeFile: arquivo.xml
```

**Response**:
```json
{
  "nfeData": {
    "invoice": {
      "numero": "000000123",
      "serie": "1",
      "dataEmissao": "2024-01-15T10:30:00.000Z",
      "tipoOperacao": "SAIDA",
      "naturezaOperacao": "Venda",
      "chaveAcesso": "35240112345678000190550010000001231234567890",
      "observacoes": ""
    },
    "emitente": {
      "cnpj": "12345678000190",
      "razaoSocial": "DISTRIBUIDORA EXEMPLO LTDA",
      "endereco": { /* dados completos */ }
    },
    "destinatario": {
      "cnpj": "98765432000100",
      "razaoSocial": "EMPRESA CLIENTE LTDA",
      "endereco": { /* dados completos */ }
    },
    "itens": [
      {
        "codigo": "PROD001",
        "descricao": "ACIDO SULFURICO 98%",
        "quantidade": 1000,
        "unidade": "KG",
        "valorUnitario": 2.50,
        "valorTotal": 2500.00,
        "ncm": "28070010",
        "cfop": "5102"
      }
    ]
  },
  "clientResolution": {
    "action": "found", // 'found' | 'create' | 'conflict'
    "client": {
      "id": 15,
      "name": "EMPRESA CLIENTE LTDA",
      "cnpj": "98765432000100"
    }
  },
  "productMatches": [
    {
      "nfeItem": { /* item da NFe */ },
      "matches": [
        {
          "id": 42,
          "technicalName": "Ácido Sulfúrico 98%",
          "similarity": 0.95,
          "matchReasons": ["Nome técnico muito similar", "Unidade de medida idêntica"]
        }
      ],
      "hasExactMatch": true,
      "bestMatch": { /* melhor correspondência */ },
      "suggestions": {
        "createNew": false
      }
    }
  ],
  "stats": {
    "totalItems": 5,
    "exactMatches": 3,
    "goodMatches": 1,
    "needsReview": 1,
    "noMatches": 0
  }
}
```

### `POST /api/nfe/import`
**Descrição**: Confirmação final e geração de certificados

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "nfeData": { /* dados da NFe processada */ },
  "clientId": 15,
  "productMappings": {
    "0": 42, // índice do item NFe : ID do produto no sistema
    "1": 43,
    "2": 44
  }
}
```

**Response**:
```json
{
  "success": true,
  "issuedCertificates": [
    {
      "id": 125,
      "invoiceNumber": "000000123/1",
      "issueDate": "2024-01-15",
      "clientId": 15,
      "productId": 42,
      "soldQuantity": "1000",
      "measureUnit": "KG"
    }
  ],
  "clientId": 15,
  "totalProcessed": 3,
  "totalErrors": 0,
  "errors": []
}
```

### `GET /api/nfe/product-mappings`
**Descrição**: Obtém preferências de mapeamento salvas

**Response**:
```json
[
  {
    "id": 1,
    "nfeProductCode": "PROD001",
    "nfeProductName": "ACIDO SULFURICO 98%",
    "systemProductId": 42,
    "mappingConfidence": 1.00,
    "isManualMapping": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### `POST /api/nfe/product-mappings`
**Descrição**: Salva preferência de mapeamento

**Body**:
```json
{
  "nfeProductCode": "PROD001",
  "nfeProductName": "ACIDO SULFURICO 98%",
  "systemProductId": 42,
  "isManual": true
}
```

**Response**:
```json
{
  "success": true
}
```

## 📋 Certificados

### `GET /api/certificates`
**Descrição**: Lista certificados de entrada

**Query Parameters**:
- `page`: número da página (default: 1)
- `limit`: itens por página (default: 20)
- `status`: filtro por status
- `productId`: filtro por produto
- `supplierId`: filtro por fornecedor

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "referenceDocument": "CERT-001",
      "entryDate": "2024-01-15",
      "status": "APPROVED",
      "supplier": {
        "id": 1,
        "name": "Fornecedor Exemplo"
      },
      "product": {
        "id": 1,
        "technicalName": "Produto Exemplo"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

### `POST /api/certificates`
**Descrição**: Cria novo certificado de entrada

**Body**:
```json
{
  "supplierId": 1,
  "manufacturerId": 1,
  "referenceDocument": "CERT-001",
  "entryDate": "2024-01-15",
  "productId": 1,
  "receivedQuantity": "1000",
  "measureUnit": "KG",
  "packageType": "Tambor",
  "supplierLot": "LOT123",
  "manufacturingDate": "2024-01-10",
  "inspectionDate": "2024-01-12",
  "expirationDate": "2024-12-31",
  "internalLot": "INT001",
  "status": "PENDING"
}
```

### `GET /api/issued-certificates`
**Descrição**: Lista certificados emitidos

**Query Parameters**:
- `page`: número da página
- `clientId`: filtro por cliente
- `productId`: filtro por produto
- `startDate`: data inicial
- `endDate`: data final

**Response**:
```json
{
  "data": [
    {
      "id": 125,
      "invoiceNumber": "000000123/1",
      "issueDate": "2024-01-15",
      "client": {
        "id": 15,
        "name": "EMPRESA CLIENTE LTDA"
      },
      "product": {
        "id": 42,
        "technicalName": "Ácido Sulfúrico 98%"
      },
      "soldQuantity": "1000",
      "measureUnit": "KG"
    }
  ],
  "total": 89,
  "page": 1,
  "totalPages": 5
}
```

### `POST /api/issued-certificates`
**Descrição**: Emite novo certificado

**Body**:
```json
{
  "entryCertificateId": 1,
  "clientId": 15,
  "invoiceNumber": "NF-001",
  "issueDate": "2024-01-15",
  "soldQuantity": "500",
  "measureUnit": "KG",
  "customLot": "CUSTOM-001",
  "showSupplierInfo": true,
  "observations": "Observações especiais"
}
```

## 👥 Clientes

### `GET /api/clients`
**Descrição**: Lista clientes do tenant

**Response**:
```json
[
  {
    "id": 15,
    "name": "EMPRESA CLIENTE LTDA",
    "cnpj": "98765432000100",
    "phone": "(11) 1234-5678",
    "address": "Rua Exemplo, 123",
    "qualityEmail": "qualidade@cliente.com.br",
    "isNational": true,
    "country": "Brasil"
  }
]
```

### `POST /api/clients`
**Descrição**: Cria novo cliente

**Body**:
```json
{
  "name": "NOVA EMPRESA LTDA",
  "cnpj": "12345678000190",
  "phone": "(11) 9876-5432",
  "address": "Avenida Nova, 456",
  "qualityEmail": "contato@novaempresa.com.br",
  "isNational": true,
  "country": "Brasil"
}
```

## 📦 Produtos

### `GET /api/products`
**Descrição**: Lista produtos do tenant

**Response**:
```json
[
  {
    "id": 42,
    "sku": "ACID-H2SO4-98",
    "technicalName": "Ácido Sulfúrico 98%",
    "commercialName": "Ácido Sulfúrico Concentrado",
    "defaultMeasureUnit": "KG",
    "baseProduct": {
      "id": 15,
      "technicalName": "Ácido Sulfúrico",
      "subcategory": {
        "id": 3,
        "name": "Ácidos Inorgânicos",
        "category": {
          "id": 1,
          "name": "Ácidos"
        }
      }
    }
  }
]
```

### `POST /api/products`
**Descrição**: Cria novo produto

**Body**:
```json
{
  "baseProductId": 15,
  "sku": "NOVO-PROD-001",
  "technicalName": "Novo Produto Técnico",
  "commercialName": "Novo Produto Comercial",
  "defaultMeasureUnit": "L",
  "netWeight": "1.2",
  "grossWeight": "1.5"
}
```

## 🏢 Administração (Admin Only)

### `GET /api/admin/tenants`
**Descrição**: Lista todos os tenants (admin only)

**Response**:
```json
[
  {
    "id": 1,
    "name": "Empresa Exemplo Ltda",
    "cnpj": "12345678000190",
    "planId": 2,
    "storageUsed": 256,
    "paymentStatus": "active",
    "plan": {
      "id": 2,
      "name": "Plano Intermediário",
      "storageLimit": 5120,
      "maxUsers": 15
    }
  }
]
```

### `POST /api/admin/tenants`
**Descrição**: Cria novo tenant

**Body**:
```json
{
  "name": "Nova Empresa Ltda",
  "cnpj": "98765432000100",
  "address": "Endereço da empresa",
  "phone": "(11) 1234-5678",
  "planId": 1
}
```

### `GET /api/admin/modules`
**Descrição**: Lista módulos do sistema

**Response**:
```json
[
  {
    "id": 1,
    "code": "core",
    "name": "Módulo Core",
    "description": "Funcionalidades essenciais",
    "isCore": true,
    "active": true
  }
]
```

### `GET /api/admin/module-features`
**Descrição**: Lista funcionalidades por módulo

**Response**:
```json
[
  {
    "id": 1,
    "moduleId": 1,
    "featurePath": "certificates/create",
    "featureName": "Criar Certificados",
    "description": "Permite criar novos certificados"
  }
]
```

## 🔒 Controle de Acesso

### `GET /api/features/check-access`
**Descrição**: Verifica acesso a funcionalidade específica

**Query Parameters**:
- `featurePath`: caminho da funcionalidade (ex: "certificates/create")

**Response**:
```json
{
  "hasAccess": true,
  "featurePath": "certificates/create",
  "reason": "Feature available in current plan"
}
```

## 📁 Arquivos

### `POST /api/files/upload`
**Descrição**: Upload de arquivo

**Headers**:
```
Content-Type: multipart/form-data
```

**Body** (FormData):
```
file: arquivo.pdf
fileCategory: "document"
description: "Descrição do arquivo"
```

**Response**:
```json
{
  "success": true,
  "file": {
    "id": 123,
    "fileName": "arquivo.pdf",
    "fileSize": 1024576,
    "fileType": "application/pdf",
    "publicUrl": "/api/files/view/123"
  }
}
```

### `GET /api/files/view/:id`
**Descrição**: Visualizar arquivo

**Response**: Stream do arquivo

### `GET /api/files/download/:id`
**Descrição**: Download do arquivo

**Response**: Download do arquivo

## 📊 Erros Comuns

### Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Acesso negado |
| 404 | Não encontrado |
| 429 | Muitas requisições |
| 500 | Erro interno |

### Exemplos de Erro

```json
{
  "error": true,
  "message": "Dados inválidos",
  "details": [
    {
      "field": "cnpj",
      "message": "CNPJ deve ter 14 dígitos"
    }
  ]
}
```

## 🔧 Rate Limiting

- **Limite geral**: 100 requisições por minuto por IP
- **Upload de arquivos**: 10 uploads por minuto
- **Autenticação**: 5 tentativas por minuto

## 📝 Notas Importantes

### Headers Obrigatórios
```
Content-Type: application/json (para endpoints JSON)
Content-Type: multipart/form-data (para uploads)
```

### Autenticação
Todas as rotas (exceto `/api/login`) requerem autenticação via sessão.

### Multi-tenancy
Todos os dados são automaticamente filtrados pelo tenant do usuário autenticado.

### Paginação
Endpoints de listagem suportam paginação com `page` e `limit`.

### Validação
Todos os dados são validados com schemas Zod antes do processamento.

---

**Esta documentação está sempre sendo atualizada. Para dúvidas específicas, consulte o código fonte ou abra uma issue.**