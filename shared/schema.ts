import { pgTable, text, serial, integer, boolean, jsonb, varchar, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User and Auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  tenantId: integer("tenant_id").notNull(),
  active: boolean("active").notNull().default(true),
});

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  address: text("address").notNull(),
  logoUrl: text("logo_url"),
  active: boolean("active").notNull().default(true),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  technicalName: text("technical_name").notNull(),
  commercialName: text("commercial_name"),
  internalCode: text("internal_code"),
  defaultMeasureUnit: text("default_measure_unit").notNull(),
  tenantId: integer("tenant_id").notNull(),
});

export const productCharacteristics = pgTable("product_characteristics", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  minValue: numeric("min_value"),
  maxValue: numeric("max_value"),
  analysisMethod: text("analysis_method"),
  tenantId: integer("tenant_id").notNull(),
});

// Suppliers, Manufacturers, Clients
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull(),
  phone: text("phone"),
  address: text("address"),
  internalCode: text("internal_code"),
  tenantId: integer("tenant_id").notNull(),
});

export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  tenantId: integer("tenant_id").notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull(),
  phone: text("phone"),
  address: text("address"),
  internalCode: text("internal_code"),
  tenantId: integer("tenant_id").notNull(),
});

// Certificates
export const entryCertificates = pgTable("entry_certificates", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  manufacturerId: integer("manufacturer_id").notNull(),
  referenceDocument: text("reference_document").notNull(),
  entryDate: date("entry_date").notNull(),
  enteredAt: timestamp("entered_at").notNull().defaultNow(),
  productId: integer("product_id").notNull(),
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
  tenantId: integer("tenant_id").notNull(),
});

export const entryCertificateResults = pgTable("entry_certificate_results", {
  id: serial("id").primaryKey(),
  entryCertificateId: integer("entry_certificate_id").notNull(),
  characteristicName: text("characteristic_name").notNull(),
  unit: text("unit").notNull(),
  minValue: numeric("min_value"),
  maxValue: numeric("max_value"),
  obtainedValue: numeric("obtained_value").notNull(),
  analysisMethod: text("analysis_method"),
  tenantId: integer("tenant_id").notNull(),
});

export const issuedCertificates = pgTable("issued_certificates", {
  id: serial("id").primaryKey(),
  entryCertificateId: integer("entry_certificate_id").notNull(),
  clientId: integer("client_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  issueDate: date("issue_date").notNull(),
  soldQuantity: numeric("sold_quantity").notNull(),
  measureUnit: text("measure_unit").notNull(),
  customLot: text("custom_lot").notNull(),
  tenantId: integer("tenant_id").notNull(),
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
});

export const insertProductSchema = createInsertSchema(products).pick({
  technicalName: true,
  commercialName: true,
  internalCode: true,
  defaultMeasureUnit: true,
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
    tenantId: true,
  })
  .extend({
    // Aceita tanto string quanto número para campos numéricos
    receivedQuantity: z.union([z.string(), z.number()]),
    conversionFactor: z.union([z.string(), z.number(), z.null()]).optional(),
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
  tenantId: integer("tenant_id").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertPackageTypeSchema = createInsertSchema(packageTypes).pick({
  name: true,
  tenantId: true,
  active: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
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
