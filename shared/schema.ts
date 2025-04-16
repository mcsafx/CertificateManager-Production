import { pgTable, text, serial, integer, boolean, jsonb, varchar, timestamp, numeric, date, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Tenants (Empresas)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  address: text("address").notNull(),
  logoUrl: text("logo_url"),
  active: boolean("active").notNull().default(true),
  // Campos relacionados aos planos de assinatura
  plan: text("plan", { enum: ["A", "B", "C"] }).notNull().default("A"),
  storageLimit: integer("storage_limit").notNull().default(5), // Em GB (5GB para plano A por padrão)
  storageUsed: integer("storage_used").notNull().default(0), // Em MB
  planStartDate: date("plan_start_date"),
  planEndDate: date("plan_end_date"),
});

// Users (Usuários)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  active: boolean("active").notNull().default(true),
});

// Categories and Subcategories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  active: boolean("active").notNull().default(true),
});

export const productSubcategories = pgTable("product_subcategories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull().references(() => productCategories.id),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  active: boolean("active").notNull().default(true),
});

// Products Base and Variants
export const productBase = pgTable("product_base", {
  id: serial("id").primaryKey(),
  technicalName: text("technical_name").notNull(),
  commercialName: text("commercial_name"),
  description: text("description"),
  subcategoryId: integer("subcategory_id").notNull().references(() => productSubcategories.id),
  internalCode: text("internal_code"),
  defaultMeasureUnit: text("default_measure_unit").notNull(),
  
  // Informações de classificação e segurança
  riskClass: text("risk_class"), // Classe ou Subclasse de Risco
  riskNumber: text("risk_number"), // Número do Risco
  unNumber: text("un_number"), // Número ONU
  packagingGroup: text("packaging_group"), // Grupo de Embalagem
  
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  active: boolean("active").notNull().default(true),
});

// Produto variante (antigo "products")
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  baseProductId: integer("base_product_id").notNull().references(() => productBase.id),
  sku: text("sku"), // Código único para esta variante específica
  technicalName: text("technical_name").notNull(),
  commercialName: text("commercial_name"),
  internalCode: text("internal_code"),
  defaultMeasureUnit: text("default_measure_unit").notNull(),
  conversionFactor: numeric("conversion_factor"), // Fator de conversão para esta variante
  netWeight: numeric("net_weight"), // Peso líquido
  grossWeight: numeric("gross_weight"), // Peso bruto
  specifications: jsonb("specifications"), // Especificações adicionais em formato JSON
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  active: boolean("active").notNull().default(true),
});

// Product Files - Arquivos anexados aos produtos (variantes)
export const productFiles = pgTable("product_files", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(), // tamanho em KB
  fileType: text("file_type").notNull(), // MIME type
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  description: text("description"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

// Product Base Files - Arquivos anexados aos produtos base (como FISPQ/SDS e Fichas Técnicas)
export const productBaseFiles = pgTable("product_base_files", {
  id: serial("id").primaryKey(),
  baseProductId: integer("base_product_id").notNull().references(() => productBase.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(), // tamanho em KB
  fileType: text("file_type").notNull(), // MIME type
  fileCategory: text("file_category").notNull(), // Ex: "fispq", "technical_sheet"
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  description: text("description"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const productCharacteristics = pgTable("product_characteristics", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  minValue: numeric("min_value"),
  maxValue: numeric("max_value"),
  analysisMethod: text("analysis_method"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

// Suppliers, Manufacturers, Clients
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull(),
  phone: text("phone"),
  address: text("address"),
  internalCode: text("internal_code"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull(),
  phone: text("phone"),
  address: text("address"),
  internalCode: text("internal_code"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

// Certificates
export const entryCertificates = pgTable("entry_certificates", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  manufacturerId: integer("manufacturer_id").notNull().references(() => manufacturers.id),
  referenceDocument: text("reference_document").notNull(),
  entryDate: date("entry_date").notNull(),
  enteredAt: timestamp("entered_at").notNull().defaultNow(),
  productId: integer("product_id").notNull().references(() => products.id),
  receivedQuantity: numeric("received_quantity").notNull(),
  measureUnit: text("measure_unit").notNull(),
  packageType: text("package_type").notNull(),
  conversionFactor: numeric("conversion_factor"),
  supplierLot: text("supplier_lot").notNull(),
  manufacturingDate: date("manufacturing_date").notNull(),
  inspectionDate: date("inspection_date").notNull(),
  expirationDate: date("expiration_date").notNull(),
  internalLot: text("internal_lot").notNull(),
  status: text("status").notNull(),
  originalFileUrl: text("original_file_url"),
  originalFileName: text("original_file_name"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const entryCertificateResults = pgTable("entry_certificate_results", {
  id: serial("id").primaryKey(),
  entryCertificateId: integer("entry_certificate_id").notNull().references(() => entryCertificates.id),
  characteristicName: text("characteristic_name").notNull(),
  unit: text("unit").notNull(),
  minValue: numeric("min_value"),
  maxValue: numeric("max_value"),
  obtainedValue: numeric("obtained_value").notNull(),
  analysisMethod: text("analysis_method"),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const issuedCertificates = pgTable("issued_certificates", {
  id: serial("id").primaryKey(),
  entryCertificateId: integer("entry_certificate_id").notNull().references(() => entryCertificates.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  invoiceNumber: text("invoice_number").notNull(),
  issueDate: date("issue_date").notNull(),
  soldQuantity: numeric("sold_quantity").notNull(),
  measureUnit: text("measure_unit").notNull(),
  customLot: text("custom_lot").notNull(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  tenantId: true,
  active: true,
});

export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  cnpj: true,
  address: true,
  logoUrl: true,
  active: true,
  plan: true,
  storageLimit: true,
  storageUsed: true,
  planStartDate: true,
  planEndDate: true,
});

// Novos schemas para inserção
export const insertProductCategorySchema = createInsertSchema(productCategories).pick({
  name: true,
  description: true,
  tenantId: true,
  active: true,
});

export const insertProductSubcategorySchema = createInsertSchema(productSubcategories).pick({
  name: true,
  description: true,
  categoryId: true,
  tenantId: true,
  active: true,
});

export const insertProductBaseSchema = createInsertSchema(productBase).pick({
  technicalName: true,
  commercialName: true,
  description: true,
  subcategoryId: true,
  internalCode: true,
  defaultMeasureUnit: true,
  riskClass: true,
  riskNumber: true,
  unNumber: true,
  packagingGroup: true,
  tenantId: true,
  active: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  baseProductId: true,
  sku: true,
  technicalName: true,
  commercialName: true,
  internalCode: true,
  defaultMeasureUnit: true,
  conversionFactor: true,
  netWeight: true,
  grossWeight: true,
  specifications: true,
  tenantId: true,
  active: true,
}).extend({
  // Aceita tanto string quanto número para campos numéricos
  conversionFactor: z.union([z.string(), z.number(), z.null()]).optional(),
  netWeight: z.union([z.string(), z.number(), z.null()]).optional(),
  grossWeight: z.union([z.string(), z.number(), z.null()]).optional(),
  specifications: z.any().optional(),
});

export const insertProductFileSchema = createInsertSchema(productFiles).pick({
  productId: true,
  fileName: true,
  fileUrl: true,
  fileSize: true,
  fileType: true,
  description: true,
  tenantId: true,
});

export const insertProductBaseFileSchema = createInsertSchema(productBaseFiles).pick({
  baseProductId: true,
  fileName: true,
  fileUrl: true,
  fileSize: true,
  fileType: true,
  fileCategory: true,
  description: true,
  tenantId: true,
});

export const insertProductCharacteristicSchema = createInsertSchema(productCharacteristics)
  .pick({
    productId: true,
    name: true,
    unit: true,
    minValue: true,
    maxValue: true,
    analysisMethod: true,
    tenantId: true,
  })
  .extend({
    // Aceita tanto string quanto número para campos numéricos
    minValue: z.union([z.string(), z.number(), z.null()]).optional(),
    maxValue: z.union([z.string(), z.number(), z.null()]).optional(),
  });

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  cnpj: true,
  phone: true,
  address: true,
  internalCode: true,
  tenantId: true,
});

export const insertManufacturerSchema = createInsertSchema(manufacturers).pick({
  name: true,
  country: true,
  tenantId: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  cnpj: true,
  phone: true,
  address: true,
  internalCode: true,
  tenantId: true,
});

export const insertEntryCertificateSchema = createInsertSchema(entryCertificates)
  .pick({
    supplierId: true,
    manufacturerId: true,
    referenceDocument: true,
    entryDate: true,
    productId: true,
    receivedQuantity: true,
    measureUnit: true,
    packageType: true,
    conversionFactor: true,
    supplierLot: true,
    manufacturingDate: true,
    inspectionDate: true,
    expirationDate: true,
    internalLot: true,
    status: true,
    originalFileUrl: true,
    originalFileName: true,
    tenantId: true,
  })
  .extend({
    // Aceita tanto string quanto número para campos numéricos
    receivedQuantity: z.union([z.string(), z.number()]),
    conversionFactor: z.union([z.string(), z.number(), z.null()]).optional(),
    originalFileName: z.string().optional(),
  });

export const insertEntryCertificateResultSchema = createInsertSchema(entryCertificateResults)
  .pick({
    entryCertificateId: true,
    characteristicName: true,
    unit: true,
    minValue: true,
    maxValue: true,
    obtainedValue: true,
    analysisMethod: true,
    tenantId: true,
  })
  .extend({
    // Aceita tanto string quanto número para campos numéricos
    minValue: z.union([z.string(), z.number(), z.null()]).optional(),
    maxValue: z.union([z.string(), z.number(), z.null()]).optional(),
    obtainedValue: z.union([z.string(), z.number()]),
  });

export const insertIssuedCertificateSchema = createInsertSchema(issuedCertificates)
  .pick({
    entryCertificateId: true,
    clientId: true,
    invoiceNumber: true,
    issueDate: true,
    soldQuantity: true,
    measureUnit: true,
    customLot: true,
    tenantId: true,
  })
  .extend({
    // Aceita tanto string quanto número para campos numéricos
    soldQuantity: z.union([z.string(), z.number()]),
  });

// Package Types
export const packageTypes = pgTable("package_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  active: boolean("active").notNull().default(true),
});

export const insertPackageTypeSchema = createInsertSchema(packageTypes).pick({
  name: true,
  tenantId: true,
  active: true,
});

// Relações entre tabelas
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  productCategories: many(productCategories),
  products: many(products),
  productBase: many(productBase),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [productCategories.tenantId],
    references: [tenants.id],
  }),
  subcategories: many(productSubcategories),
}));

export const productSubcategoriesRelations = relations(productSubcategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [productSubcategories.tenantId],
    references: [tenants.id],
  }),
  category: one(productCategories, {
    fields: [productSubcategories.categoryId],
    references: [productCategories.id],
  }),
  productBases: many(productBase),
}));

export const productBaseRelations = relations(productBase, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [productBase.tenantId],
    references: [tenants.id],
  }),
  subcategory: one(productSubcategories, {
    fields: [productBase.subcategoryId],
    references: [productSubcategories.id],
  }),
  variants: many(products),
  files: many(productBaseFiles),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  base: one(productBase, {
    fields: [products.baseProductId],
    references: [productBase.id],
  }),
  files: many(productFiles),
  characteristics: many(productCharacteristics),
  entryCertificates: many(entryCertificates),
}));

export const productFilesRelations = relations(productFiles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productFiles.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [productFiles.productId],
    references: [products.id],
  }),
}));

export const productBaseFilesRelations = relations(productBaseFiles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productBaseFiles.tenantId],
    references: [tenants.id],
  }),
  productBase: one(productBase, {
    fields: [productBaseFiles.baseProductId],
    references: [productBase.id],
  }),
}));

export const productCharacteristicsRelations = relations(productCharacteristics, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productCharacteristics.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [productCharacteristics.productId],
    references: [products.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [suppliers.tenantId],
    references: [tenants.id],
  }),
  entryCertificates: many(entryCertificates),
}));

export const manufacturersRelations = relations(manufacturers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [manufacturers.tenantId],
    references: [tenants.id],
  }),
  entryCertificates: many(entryCertificates),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [clients.tenantId],
    references: [tenants.id],
  }),
  issuedCertificates: many(issuedCertificates),
}));

export const entryCertificatesRelations = relations(entryCertificates, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [entryCertificates.tenantId],
    references: [tenants.id],
  }),
  supplier: one(suppliers, {
    fields: [entryCertificates.supplierId],
    references: [suppliers.id],
  }),
  manufacturer: one(manufacturers, {
    fields: [entryCertificates.manufacturerId],
    references: [manufacturers.id],
  }),
  product: one(products, {
    fields: [entryCertificates.productId],
    references: [products.id],
  }),
  results: many(entryCertificateResults),
  issuedCertificates: many(issuedCertificates),
}));

export const entryCertificateResultsRelations = relations(entryCertificateResults, ({ one }) => ({
  tenant: one(tenants, {
    fields: [entryCertificateResults.tenantId],
    references: [tenants.id],
  }),
  entryCertificate: one(entryCertificates, {
    fields: [entryCertificateResults.entryCertificateId],
    references: [entryCertificates.id],
  }),
}));

export const issuedCertificatesRelations = relations(issuedCertificates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [issuedCertificates.tenantId],
    references: [tenants.id],
  }),
  entryCertificate: one(entryCertificates, {
    fields: [issuedCertificates.entryCertificateId],
    references: [entryCertificates.id],
  }),
  client: one(clients, {
    fields: [issuedCertificates.clientId],
    references: [clients.id],
  }),
}));

export const packageTypesRelations = relations(packageTypes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [packageTypes.tenantId],
    references: [tenants.id],
  }),
}));

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

// Novas exportações de tipos para a estrutura hierárquica de produtos
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductSubcategory = typeof productSubcategories.$inferSelect;
export type InsertProductSubcategory = z.infer<typeof insertProductSubcategorySchema>;
export type ProductBase = typeof productBase.$inferSelect;
export type InsertProductBase = z.infer<typeof insertProductBaseSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductFile = typeof productFiles.$inferSelect;
export type InsertProductFile = z.infer<typeof insertProductFileSchema>;
export type ProductBaseFile = typeof productBaseFiles.$inferSelect;
export type InsertProductBaseFile = z.infer<typeof insertProductBaseFileSchema>;

export type ProductCharacteristic = typeof productCharacteristics.$inferSelect;
export type InsertProductCharacteristic = z.infer<typeof insertProductCharacteristicSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type EntryCertificate = typeof entryCertificates.$inferSelect;
export type InsertEntryCertificate = z.infer<typeof insertEntryCertificateSchema>;
export type EntryCertificateResult = typeof entryCertificateResults.$inferSelect;
export type InsertEntryCertificateResult = z.infer<typeof insertEntryCertificateResultSchema>;
export type IssuedCertificate = typeof issuedCertificates.$inferSelect;
export type InsertIssuedCertificate = z.infer<typeof insertIssuedCertificateSchema>;
export type PackageType = typeof packageTypes.$inferSelect;
export type InsertPackageType = z.infer<typeof insertPackageTypeSchema>;
