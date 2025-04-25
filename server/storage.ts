import { User, InsertUser, Tenant, InsertTenant, 
         ProductCategory, InsertProductCategory, 
         ProductSubcategory, InsertProductSubcategory,
         ProductBase, InsertProductBase,
         Product, InsertProduct, 
         ProductFile, InsertProductFile,
         ProductBaseFile, InsertProductBaseFile,
         ProductCharacteristic, InsertProductCharacteristic, 
         Supplier, InsertSupplier, Manufacturer, InsertManufacturer, 
         Client, InsertClient, EntryCertificate, InsertEntryCertificate, 
         EntryCertificateResult, InsertEntryCertificateResult, 
         IssuedCertificate, InsertIssuedCertificate,
         PackageType, InsertPackageType,
         File, InsertFile,
         Module, InsertModule,
         ModuleFeature, insertModuleFeatureSchema,
         plans, modules, moduleFeatures, planModules, files,
         users, tenants, productCategories, productSubcategories, productBase, products,
         productFiles, productBaseFiles, productCharacteristics, suppliers, manufacturers,
         clients, entryCertificates, entryCertificateResults, issuedCertificates, packageTypes } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Auth & Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsersByTenant(tenantId: number): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Tenants
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByName(name: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, tenant: Partial<Tenant>): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  deleteTenant(id: number): Promise<boolean>;
  
  // Planos e Módulos
  getPlan(id: number): Promise<any | undefined>;
  getPlans(): Promise<any[]>;
  createPlan(plan: any): Promise<any>;
  updatePlan(id: number, plan: Partial<any>): Promise<any | undefined>;
  deletePlan(id: number): Promise<boolean>;
  getModule(id: number): Promise<any | undefined>;
  getModules(): Promise<any[]>;
  getModulesByPlan(planId: number): Promise<any[]>;
  
  // Armazenamento
  getAllFiles(): Promise<File[]>;
  getStorageInfo(): Promise<{totalFiles: number, totalSizeMB: number}>;
  getStorageUsageByTenant(): Promise<any[]>;
  cleanupUnusedFiles(tenantId: number): Promise<{filesRemoved: number, spaceSaved: number}>;
  
  // Product Categories
  getProductCategory(id: number, tenantId: number): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: number, tenantId: number, category: Partial<ProductCategory>): Promise<ProductCategory | undefined>;
  getProductCategoriesByTenant(tenantId: number): Promise<ProductCategory[]>;
  deleteProductCategory(id: number, tenantId: number): Promise<boolean>;
  
  // Product Subcategories
  getProductSubcategory(id: number, tenantId: number): Promise<ProductSubcategory | undefined>;
  createProductSubcategory(subcategory: InsertProductSubcategory): Promise<ProductSubcategory>;
  updateProductSubcategory(id: number, tenantId: number, subcategory: Partial<ProductSubcategory>): Promise<ProductSubcategory | undefined>;
  getProductSubcategoriesByCategory(categoryId: number, tenantId: number): Promise<ProductSubcategory[]>;
  getProductSubcategoriesByTenant(tenantId: number): Promise<ProductSubcategory[]>;
  deleteProductSubcategory(id: number, tenantId: number): Promise<boolean>;
  
  // Product Base
  getProductBase(id: number, tenantId: number): Promise<ProductBase | undefined>;
  createProductBase(productBase: InsertProductBase): Promise<ProductBase>;
  updateProductBase(id: number, tenantId: number, productBase: Partial<ProductBase>): Promise<ProductBase | undefined>;
  getProductBasesBySubcategory(subcategoryId: number, tenantId: number): Promise<ProductBase[]>;
  getProductBasesByTenant(tenantId: number): Promise<ProductBase[]>;
  deleteProductBase(id: number, tenantId: number): Promise<boolean>;
  
  // Product Variants (Products)
  getProduct(id: number, tenantId: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, tenantId: number, product: Partial<Product>): Promise<Product | undefined>;
  getProductsByBase(baseProductId: number, tenantId: number): Promise<Product[]>;
  getProductsByTenant(tenantId: number): Promise<Product[]>;
  deleteProduct(id: number, tenantId: number): Promise<boolean>;
  
  // Product Files (para variantes)
  getProductFile(id: number, tenantId: number): Promise<ProductFile | undefined>;
  createProductFile(file: InsertProductFile): Promise<ProductFile>;
  getProductFilesByProduct(productId: number, tenantId: number): Promise<ProductFile[]>;
  deleteProductFile(id: number, tenantId: number): Promise<boolean>;
  
  // Product Base Files (para FISPQ e fichas técnicas)
  getProductBaseFile(id: number, tenantId: number): Promise<ProductBaseFile | undefined>;
  createProductBaseFile(file: InsertProductBaseFile): Promise<ProductBaseFile>;
  getProductBaseFilesByBaseProduct(baseProductId: number, tenantId: number): Promise<ProductBaseFile[]>;
  getProductBaseFilesByCategory(baseProductId: number, category: string, tenantId: number): Promise<ProductBaseFile[]>;
  deleteProductBaseFile(id: number, tenantId: number): Promise<boolean>;

  // Product Characteristics
  getProductCharacteristic(id: number, tenantId: number): Promise<ProductCharacteristic | undefined>;
  createProductCharacteristic(characteristic: InsertProductCharacteristic): Promise<ProductCharacteristic>;
  updateProductCharacteristic(id: number, tenantId: number, characteristic: Partial<ProductCharacteristic>): Promise<ProductCharacteristic | undefined>;
  getCharacteristicsByProduct(productId: number, tenantId: number): Promise<ProductCharacteristic[]>;
  deleteProductCharacteristic(id: number, tenantId: number): Promise<boolean>;

  // Suppliers
  getSupplier(id: number, tenantId: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, tenantId: number, supplier: Partial<Supplier>): Promise<Supplier | undefined>;
  getSuppliersByTenant(tenantId: number): Promise<Supplier[]>;
  deleteSupplier(id: number, tenantId: number): Promise<boolean>;

  // Manufacturers
  getManufacturer(id: number, tenantId: number): Promise<Manufacturer | undefined>;
  createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer>;
  updateManufacturer(id: number, tenantId: number, manufacturer: Partial<Manufacturer>): Promise<Manufacturer | undefined>;
  getManufacturersByTenant(tenantId: number): Promise<Manufacturer[]>;
  deleteManufacturer(id: number, tenantId: number): Promise<boolean>;

  // Clients
  getClient(id: number, tenantId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, tenantId: number, client: Partial<Client>): Promise<Client | undefined>;
  getClientsByTenant(tenantId: number): Promise<Client[]>;
  deleteClient(id: number, tenantId: number): Promise<boolean>;

  // Entry Certificates
  getEntryCertificate(id: number, tenantId: number): Promise<EntryCertificate | undefined>;
  createEntryCertificate(certificate: InsertEntryCertificate): Promise<EntryCertificate>;
  updateEntryCertificate(id: number, tenantId: number, certificate: Partial<EntryCertificate>): Promise<EntryCertificate | undefined>;
  getEntryCertificatesByTenant(tenantId: number, filters?: Record<string, any>): Promise<EntryCertificate[]>;
  deleteEntryCertificate(id: number, tenantId: number): Promise<boolean>;

  // Entry Certificate Results
  getEntryCertificateResult(id: number, tenantId: number): Promise<EntryCertificateResult | undefined>;
  createEntryCertificateResult(result: InsertEntryCertificateResult): Promise<EntryCertificateResult>;
  updateEntryCertificateResult(id: number, tenantId: number, result: Partial<EntryCertificateResult>): Promise<EntryCertificateResult | undefined>;
  getResultsByEntryCertificate(certificateId: number, tenantId: number): Promise<EntryCertificateResult[]>;
  deleteEntryCertificateResult(id: number, tenantId: number): Promise<boolean>;

  // Issued Certificates
  getIssuedCertificate(id: number, tenantId: number): Promise<IssuedCertificate | undefined>;
  createIssuedCertificate(certificate: InsertIssuedCertificate): Promise<IssuedCertificate>;
  getIssuedCertificatesByTenant(tenantId: number, filters?: Record<string, any>): Promise<IssuedCertificate[]>;
  getIssuedCertificatesByEntryCertificate(entryCertificateId: number, tenantId: number): Promise<IssuedCertificate[]>;

  // Package Types
  getPackageType(id: number, tenantId: number): Promise<PackageType | undefined>;
  createPackageType(packageType: InsertPackageType): Promise<PackageType>;
  updatePackageType(id: number, tenantId: number, packageType: Partial<PackageType>): Promise<PackageType | undefined>;
  getPackageTypesByTenant(tenantId: number): Promise<PackageType[]>;
  deletePackageType(id: number, tenantId: number): Promise<boolean>;

  // Plans and Modules
  getAllPlans(): Promise<typeof plans.$inferSelect[]>;
  getPlan(id: number): Promise<typeof plans.$inferSelect | undefined>;
  getPlanByCode(code: string): Promise<typeof plans.$inferSelect | undefined>;
  createPlan(plan: any): Promise<any>;
  updatePlan(id: number, plan: Partial<any>): Promise<any | undefined>;
  deletePlan(id: number): Promise<boolean>;
  getAllModules(): Promise<typeof modules.$inferSelect[]>;
  getModule(id: number): Promise<typeof modules.$inferSelect | undefined>;
  getModules(): Promise<any[]>;
  createModule(module: InsertModule): Promise<typeof modules.$inferSelect>;
  updateModule(id: number, module: Partial<InsertModule>): Promise<typeof modules.$inferSelect | undefined>;
  deleteModule(id: number): Promise<boolean>;
  getModulesByPlan(planId: number): Promise<typeof modules.$inferSelect[]>;
  getModulesByPlanCode(code: string): Promise<typeof modules.$inferSelect[]>;
  getTenantEnabledModules(tenantId: number): Promise<typeof modules.$inferSelect[]>;
  updatePlanModules(planId: number, moduleIds: number[]): Promise<boolean>;
  
  // Module Features
  getModuleFeature(id: number): Promise<typeof moduleFeatures.$inferSelect | undefined>;
  getModuleFeatures(): Promise<typeof moduleFeatures.$inferSelect[]>;
  getModuleFeaturesByModule(moduleId: number): Promise<typeof moduleFeatures.$inferSelect[]>;
  createModuleFeature(feature: z.infer<typeof insertModuleFeatureSchema>): Promise<typeof moduleFeatures.$inferSelect>;
  updateModuleFeature(id: number, feature: Partial<z.infer<typeof insertModuleFeatureSchema>>): Promise<typeof moduleFeatures.$inferSelect | undefined>;
  deleteModuleFeature(id: number): Promise<boolean>;
  isFeatureAccessible(featurePath: string, tenantId: number): Promise<boolean>;
  
  // Files Management
  getFile(id: number, tenantId: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  getFilesByTenant(tenantId: number, fileCategory?: string): Promise<File[]>;
  getFilesByEntity(entityType: string, entityId: number, tenantId: number): Promise<File[]>;
  deleteFile(id: number, tenantId: number): Promise<boolean>;
  
  // Session Store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tenants: Map<number, Tenant>;
  
  // Hierarquia de produtos
  private productCategories: Map<number, ProductCategory>;
  private productSubcategories: Map<number, ProductSubcategory>;
  private productBases: Map<number, ProductBase>;
  private products: Map<number, Product>;
  private productFiles: Map<number, ProductFile>;
  private productBaseFiles: Map<number, ProductBaseFile>;
  
  private productCharacteristics: Map<number, ProductCharacteristic>;
  private suppliers: Map<number, Supplier>;
  private manufacturers: Map<number, Manufacturer>;
  private clients: Map<number, Client>;
  private entryCertificates: Map<number, EntryCertificate>;
  private entryCertificateResults: Map<number, EntryCertificateResult>;
  private issuedCertificates: Map<number, IssuedCertificate>;
  private packageTypes: Map<number, PackageType>;
  
  // Arquivos gerais
  private files: Map<number, File>;
  
  private userIdCounter: number;
  private tenantIdCounter: number;
  private categoryIdCounter: number;
  private subcategoryIdCounter: number;
  private productBaseIdCounter: number;
  private productIdCounter: number;
  private productFileIdCounter: number;
  private productBaseFileIdCounter: number;
  private characteristicIdCounter: number;
  private supplierIdCounter: number;
  private manufacturerIdCounter: number;
  private clientIdCounter: number;
  private entryCertificateIdCounter: number;
  private resultIdCounter: number;
  private issuedCertificateIdCounter: number;
  private packageTypeIdCounter: number;
  private fileIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.tenants = new Map();
    
    // Inicialização das novas estruturas hierárquicas
    this.productCategories = new Map();
    this.productSubcategories = new Map();
    this.productBases = new Map();
    this.products = new Map();
    this.productFiles = new Map();
    this.productBaseFiles = new Map();
    
    this.productCharacteristics = new Map();
    this.suppliers = new Map();
    this.manufacturers = new Map();
    this.clients = new Map();
    this.entryCertificates = new Map();
    this.entryCertificateResults = new Map();
    this.issuedCertificates = new Map();
    this.packageTypes = new Map();
    
    // Inicialização da estrutura de arquivos gerais
    this.files = new Map();
    
    this.userIdCounter = 1;
    this.tenantIdCounter = 1;
    this.categoryIdCounter = 1;
    this.subcategoryIdCounter = 1;
    this.productBaseIdCounter = 1;
    this.productIdCounter = 1;
    this.productFileIdCounter = 1;
    this.productBaseFileIdCounter = 1;
    this.characteristicIdCounter = 1;
    this.supplierIdCounter = 1;
    this.manufacturerIdCounter = 1;
    this.clientIdCounter = 1;
    this.entryCertificateIdCounter = 1;
    this.resultIdCounter = 1;
    this.issuedCertificateIdCounter = 1;
    this.packageTypeIdCounter = 1;
    this.fileIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create a default tenant and admin user
    this.createTenant({
      name: "Admin",
      cnpj: "00000000000000",
      address: "System Address",
      active: true,
      planId: 1,
      storageUsed: 0
    }).then(async tenant => {
      const hashedPassword = await hashPassword("admin123");
      this.createUser({
        username: "admin",
        password: hashedPassword,
        name: "System Administrator",
        role: "admin",
        tenantId: tenant.id,
        active: true
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id, 
      role: user.role ?? 'user', 
      active: user.active ?? true 
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByTenant(tenantId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.tenantId === tenantId
    );
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Tenant methods
  async getTenant(id: number): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantByName(name: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(
      (tenant) => tenant.name === name
    );
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const id = this.tenantIdCounter++;
    const newTenant: Tenant = { 
      ...tenant, 
      id,
      active: tenant.active ?? true,
      logoUrl: tenant.logoUrl ?? null,
      planId: tenant.planId ?? 1, // Plano básico por padrão
      storageUsed: tenant.storageUsed ?? 0,
      planStartDate: tenant.planStartDate ?? null,
      planEndDate: tenant.planEndDate ?? null
    };
    this.tenants.set(id, newTenant);
    return newTenant;
  }

  async updateTenant(id: number, tenantData: Partial<Tenant>): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(id);
    if (!tenant) return undefined;
    
    const updatedTenant = { ...tenant, ...tenantData };
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  // Product Category methods
  async getProductCategory(id: number, tenantId: number): Promise<ProductCategory | undefined> {
    const category = this.productCategories.get(id);
    if (category && category.tenantId === tenantId) {
      return category;
    }
    return undefined;
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const id = this.categoryIdCounter++;
    const newCategory: ProductCategory = { 
      ...category, 
      id,
      active: category.active ?? true,
      description: category.description ?? null
    };
    this.productCategories.set(id, newCategory);
    return newCategory;
  }

  async updateProductCategory(id: number, tenantId: number, categoryData: Partial<ProductCategory>): Promise<ProductCategory | undefined> {
    const category = await this.getProductCategory(id, tenantId);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.productCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async getProductCategoriesByTenant(tenantId: number): Promise<ProductCategory[]> {
    return Array.from(this.productCategories.values()).filter(
      (category) => category.tenantId === tenantId
    );
  }

  async deleteProductCategory(id: number, tenantId: number): Promise<boolean> {
    const category = await this.getProductCategory(id, tenantId);
    if (!category) return false;
    return this.productCategories.delete(id);
  }

  // Product Subcategory methods
  async getProductSubcategory(id: number, tenantId: number): Promise<ProductSubcategory | undefined> {
    const subcategory = this.productSubcategories.get(id);
    if (subcategory && subcategory.tenantId === tenantId) {
      return subcategory;
    }
    return undefined;
  }

  async createProductSubcategory(subcategory: InsertProductSubcategory): Promise<ProductSubcategory> {
    const id = this.subcategoryIdCounter++;
    const newSubcategory: ProductSubcategory = { 
      ...subcategory, 
      id,
      active: subcategory.active ?? true,
      description: subcategory.description ?? null
    };
    this.productSubcategories.set(id, newSubcategory);
    return newSubcategory;
  }

  async updateProductSubcategory(id: number, tenantId: number, subcategoryData: Partial<ProductSubcategory>): Promise<ProductSubcategory | undefined> {
    const subcategory = await this.getProductSubcategory(id, tenantId);
    if (!subcategory) return undefined;
    
    const updatedSubcategory = { ...subcategory, ...subcategoryData };
    this.productSubcategories.set(id, updatedSubcategory);
    return updatedSubcategory;
  }

  async getProductSubcategoriesByCategory(categoryId: number, tenantId: number): Promise<ProductSubcategory[]> {
    return Array.from(this.productSubcategories.values()).filter(
      (subcategory) => subcategory.categoryId === categoryId && subcategory.tenantId === tenantId
    );
  }

  async getProductSubcategoriesByTenant(tenantId: number): Promise<ProductSubcategory[]> {
    return Array.from(this.productSubcategories.values()).filter(
      (subcategory) => subcategory.tenantId === tenantId
    );
  }

  async deleteProductSubcategory(id: number, tenantId: number): Promise<boolean> {
    const subcategory = await this.getProductSubcategory(id, tenantId);
    if (!subcategory) return false;
    return this.productSubcategories.delete(id);
  }

  // Product Base methods
  async getProductBase(id: number, tenantId: number): Promise<ProductBase | undefined> {
    const productBase = this.productBases.get(id);
    if (productBase && productBase.tenantId === tenantId) {
      return productBase;
    }
    return undefined;
  }

  async createProductBase(productBase: InsertProductBase): Promise<ProductBase> {
    const id = this.productBaseIdCounter++;
    const newProductBase: ProductBase = { 
      ...productBase, 
      id,
      active: productBase.active ?? true,
      description: productBase.description ?? null,
      commercialName: productBase.commercialName ?? null,
      internalCode: productBase.internalCode ?? null,
      riskClass: productBase.riskClass ?? null,
      riskNumber: productBase.riskNumber ?? null,
      unNumber: productBase.unNumber ?? null,
      packagingGroup: productBase.packagingGroup ?? null
    };
    this.productBases.set(id, newProductBase);
    return newProductBase;
  }

  async updateProductBase(id: number, tenantId: number, productBaseData: Partial<ProductBase>): Promise<ProductBase | undefined> {
    const productBase = await this.getProductBase(id, tenantId);
    if (!productBase) return undefined;
    
    const updatedProductBase = { ...productBase, ...productBaseData };
    this.productBases.set(id, updatedProductBase);
    return updatedProductBase;
  }

  async getProductBasesBySubcategory(subcategoryId: number, tenantId: number): Promise<ProductBase[]> {
    return Array.from(this.productBases.values()).filter(
      (productBase) => productBase.subcategoryId === subcategoryId && productBase.tenantId === tenantId
    );
  }

  async getProductBasesByTenant(tenantId: number): Promise<ProductBase[]> {
    return Array.from(this.productBases.values()).filter(
      (productBase) => productBase.tenantId === tenantId
    );
  }

  async deleteProductBase(id: number, tenantId: number): Promise<boolean> {
    const productBase = await this.getProductBase(id, tenantId);
    if (!productBase) return false;
    return this.productBases.delete(id);
  }

  // Product File methods
  async getProductFile(id: number, tenantId: number): Promise<ProductFile | undefined> {
    const file = this.productFiles.get(id);
    if (file && file.tenantId === tenantId) {
      return file;
    }
    return undefined;
  }

  async createProductFile(file: InsertProductFile): Promise<ProductFile> {
    const id = this.productFileIdCounter++;
    const newFile: ProductFile = { 
      ...file, 
      id,
      description: file.description ?? null,
      uploadedAt: new Date()
    };
    this.productFiles.set(id, newFile);
    return newFile;
  }

  async getProductFilesByProduct(productId: number, tenantId: number): Promise<ProductFile[]> {
    return Array.from(this.productFiles.values()).filter(
      (file) => file.productId === productId && file.tenantId === tenantId
    );
  }

  async deleteProductFile(id: number, tenantId: number): Promise<boolean> {
    const file = await this.getProductFile(id, tenantId);
    if (!file) return false;
    return this.productFiles.delete(id);
  }
  
  // Product Base File methods
  async getProductBaseFile(id: number, tenantId: number): Promise<ProductBaseFile | undefined> {
    const file = this.productBaseFiles.get(id);
    if (file && file.tenantId === tenantId) {
      return file;
    }
    return undefined;
  }

  async createProductBaseFile(file: InsertProductBaseFile): Promise<ProductBaseFile> {
    const id = this.productBaseFileIdCounter++;
    const newFile: ProductBaseFile = { 
      ...file, 
      id,
      description: file.description ?? null,
      uploadedAt: new Date()
    };
    this.productBaseFiles.set(id, newFile);
    return newFile;
  }

  async getProductBaseFilesByBaseProduct(baseProductId: number, tenantId: number): Promise<ProductBaseFile[]> {
    return Array.from(this.productBaseFiles.values()).filter(
      (file) => file.baseProductId === baseProductId && file.tenantId === tenantId
    );
  }
  
  async getProductBaseFilesByCategory(baseProductId: number, category: string, tenantId: number): Promise<ProductBaseFile[]> {
    return Array.from(this.productBaseFiles.values()).filter(
      (file) => file.baseProductId === baseProductId && file.fileCategory === category && file.tenantId === tenantId
    );
  }

  async deleteProductBaseFile(id: number, tenantId: number): Promise<boolean> {
    const file = await this.getProductBaseFile(id, tenantId);
    if (!file) return false;
    return this.productBaseFiles.delete(id);
  }

  // Product Variant methods (antigo Product methods)
  async getProduct(id: number, tenantId: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (product && product.tenantId === tenantId) {
      return product;
    }
    return undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = { 
      ...product, 
      id,
      active: product.active ?? true,
      commercialName: product.commercialName ?? null,
      internalCode: product.internalCode ?? null,
      sku: product.sku ?? null,
      conversionFactor: product.conversionFactor ? String(product.conversionFactor) : null,
      netWeight: product.netWeight ? String(product.netWeight) : null,
      grossWeight: product.grossWeight ? String(product.grossWeight) : null,
      specifications: product.specifications ?? null
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, tenantId: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = await this.getProduct(id, tenantId);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getProductsByTenant(tenantId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.tenantId === tenantId
    );
  }
  
  async getProductsByBase(baseProductId: number, tenantId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.baseProductId === baseProductId && product.tenantId === tenantId
    );
  }

  async deleteProduct(id: number, tenantId: number): Promise<boolean> {
    const product = await this.getProduct(id, tenantId);
    if (!product) return false;
    return this.products.delete(id);
  }

  // Product Characteristic methods
  async getProductCharacteristic(id: number, tenantId: number): Promise<ProductCharacteristic | undefined> {
    const characteristic = this.productCharacteristics.get(id);
    if (characteristic && characteristic.tenantId === tenantId) {
      return characteristic;
    }
    return undefined;
  }

  async createProductCharacteristic(characteristic: InsertProductCharacteristic): Promise<ProductCharacteristic> {
    const id = this.characteristicIdCounter++;
    const newCharacteristic: ProductCharacteristic = { 
      ...characteristic, 
      id,
      minValue: characteristic.minValue ? String(characteristic.minValue) : null,
      maxValue: characteristic.maxValue ? String(characteristic.maxValue) : null,
      analysisMethod: characteristic.analysisMethod ?? null
    };
    this.productCharacteristics.set(id, newCharacteristic);
    return newCharacteristic;
  }

  async updateProductCharacteristic(id: number, tenantId: number, characteristicData: Partial<ProductCharacteristic>): Promise<ProductCharacteristic | undefined> {
    const characteristic = await this.getProductCharacteristic(id, tenantId);
    if (!characteristic) return undefined;
    
    const updatedCharacteristic = { ...characteristic, ...characteristicData };
    this.productCharacteristics.set(id, updatedCharacteristic);
    return updatedCharacteristic;
  }

  async getCharacteristicsByProduct(productId: number, tenantId: number): Promise<ProductCharacteristic[]> {
    return Array.from(this.productCharacteristics.values()).filter(
      (characteristic) => characteristic.productId === productId && characteristic.tenantId === tenantId
    );
  }

  async deleteProductCharacteristic(id: number, tenantId: number): Promise<boolean> {
    const characteristic = await this.getProductCharacteristic(id, tenantId);
    if (!characteristic) return false;
    return this.productCharacteristics.delete(id);
  }

  // Supplier methods
  async getSupplier(id: number, tenantId: number): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (supplier && supplier.tenantId === tenantId) {
      return supplier;
    }
    return undefined;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierIdCounter++;
    const newSupplier: Supplier = { 
      ...supplier, 
      id,
      address: supplier.address ?? null,
      internalCode: supplier.internalCode ?? null,
      phone: supplier.phone ?? null
    };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: number, tenantId: number, supplierData: Partial<Supplier>): Promise<Supplier | undefined> {
    const supplier = await this.getSupplier(id, tenantId);
    if (!supplier) return undefined;
    
    const updatedSupplier = { ...supplier, ...supplierData };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async getSuppliersByTenant(tenantId: number): Promise<Supplier[]> {
    return Array.from(this.suppliers.values()).filter(
      (supplier) => supplier.tenantId === tenantId
    );
  }

  async deleteSupplier(id: number, tenantId: number): Promise<boolean> {
    const supplier = await this.getSupplier(id, tenantId);
    if (!supplier) return false;
    return this.suppliers.delete(id);
  }

  // Manufacturer methods
  async getManufacturer(id: number, tenantId: number): Promise<Manufacturer | undefined> {
    const manufacturer = this.manufacturers.get(id);
    if (manufacturer && manufacturer.tenantId === tenantId) {
      return manufacturer;
    }
    return undefined;
  }

  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> {
    const id = this.manufacturerIdCounter++;
    const newManufacturer: Manufacturer = { ...manufacturer, id };
    this.manufacturers.set(id, newManufacturer);
    return newManufacturer;
  }

  async updateManufacturer(id: number, tenantId: number, manufacturerData: Partial<Manufacturer>): Promise<Manufacturer | undefined> {
    const manufacturer = await this.getManufacturer(id, tenantId);
    if (!manufacturer) return undefined;
    
    const updatedManufacturer = { ...manufacturer, ...manufacturerData };
    this.manufacturers.set(id, updatedManufacturer);
    return updatedManufacturer;
  }

  async getManufacturersByTenant(tenantId: number): Promise<Manufacturer[]> {
    return Array.from(this.manufacturers.values()).filter(
      (manufacturer) => manufacturer.tenantId === tenantId
    );
  }

  async deleteManufacturer(id: number, tenantId: number): Promise<boolean> {
    const manufacturer = await this.getManufacturer(id, tenantId);
    if (!manufacturer) return false;
    return this.manufacturers.delete(id);
  }

  // Client methods
  async getClient(id: number, tenantId: number): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (client && client.tenantId === tenantId) {
      return client;
    }
    return undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const newClient: Client = { 
      ...client, 
      id,
      address: client.address ?? null,
      internalCode: client.internalCode ?? null,
      phone: client.phone ?? null
    };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, tenantId: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = await this.getClient(id, tenantId);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async getClientsByTenant(tenantId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.tenantId === tenantId
    );
  }

  async deleteClient(id: number, tenantId: number): Promise<boolean> {
    const client = await this.getClient(id, tenantId);
    if (!client) return false;
    return this.clients.delete(id);
  }

  // Entry Certificate methods
  async getEntryCertificate(id: number, tenantId: number): Promise<EntryCertificate | undefined> {
    const certificate = this.entryCertificates.get(id);
    if (certificate && certificate.tenantId === tenantId) {
      return certificate;
    }
    return undefined;
  }

  async createEntryCertificate(certificate: InsertEntryCertificate): Promise<EntryCertificate> {
    const id = this.entryCertificateIdCounter++;
    const newCertificate: EntryCertificate = { 
      ...certificate, 
      id, 
      enteredAt: new Date(),
      originalFileUrl: certificate.originalFileUrl ?? null,
      conversionFactor: certificate.conversionFactor ? String(certificate.conversionFactor) : null,
      receivedQuantity: typeof certificate.receivedQuantity === 'number' ? 
        String(certificate.receivedQuantity) : certificate.receivedQuantity
    };
    this.entryCertificates.set(id, newCertificate);
    return newCertificate;
  }

  async updateEntryCertificate(id: number, tenantId: number, certificateData: Partial<EntryCertificate>): Promise<EntryCertificate | undefined> {
    const certificate = await this.getEntryCertificate(id, tenantId);
    if (!certificate) return undefined;
    
    const updatedCertificate = { ...certificate, ...certificateData };
    this.entryCertificates.set(id, updatedCertificate);
    return updatedCertificate;
  }

  async getEntryCertificatesByTenant(tenantId: number, filters: Record<string, any> = {}): Promise<EntryCertificate[]> {
    let certificates = Array.from(this.entryCertificates.values()).filter(
      (cert) => cert.tenantId === tenantId
    );
    
    // Apply filters if any
    if (filters.productId) {
      certificates = certificates.filter(cert => cert.productId === Number(filters.productId));
    }
    if (filters.supplierId) {
      certificates = certificates.filter(cert => cert.supplierId === Number(filters.supplierId));
    }
    if (filters.manufacturerId) {
      certificates = certificates.filter(cert => cert.manufacturerId === Number(filters.manufacturerId));
    }
    if (filters.internalLot) {
      certificates = certificates.filter(cert => cert.internalLot.includes(filters.internalLot));
    }
    if (filters.referenceDocument) {
      certificates = certificates.filter(cert => cert.referenceDocument.includes(filters.referenceDocument));
    }
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      certificates = certificates.filter(cert => new Date(cert.entryDate) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      certificates = certificates.filter(cert => new Date(cert.entryDate) <= endDate);
    }
    
    return certificates;
  }

  async deleteEntryCertificate(id: number, tenantId: number): Promise<boolean> {
    const certificate = await this.getEntryCertificate(id, tenantId);
    if (!certificate) return false;
    return this.entryCertificates.delete(id);
  }

  // Entry Certificate Result methods
  async getEntryCertificateResult(id: number, tenantId: number): Promise<EntryCertificateResult | undefined> {
    const result = this.entryCertificateResults.get(id);
    if (result && result.tenantId === tenantId) {
      return result;
    }
    return undefined;
  }

  async createEntryCertificateResult(result: InsertEntryCertificateResult): Promise<EntryCertificateResult> {
    const id = this.resultIdCounter++;
    const newResult: EntryCertificateResult = { 
      ...result, 
      id,
      minValue: result.minValue ? String(result.minValue) : null,
      maxValue: result.maxValue ? String(result.maxValue) : null,
      analysisMethod: result.analysisMethod ?? null,
      obtainedValue: typeof result.obtainedValue === 'number' ? String(result.obtainedValue) : result.obtainedValue
    };
    this.entryCertificateResults.set(id, newResult);
    return newResult;
  }

  async updateEntryCertificateResult(id: number, tenantId: number, resultData: Partial<EntryCertificateResult>): Promise<EntryCertificateResult | undefined> {
    const result = await this.getEntryCertificateResult(id, tenantId);
    if (!result) return undefined;
    
    const updatedResult = { ...result, ...resultData };
    this.entryCertificateResults.set(id, updatedResult);
    return updatedResult;
  }

  async getResultsByEntryCertificate(certificateId: number, tenantId: number): Promise<EntryCertificateResult[]> {
    return Array.from(this.entryCertificateResults.values()).filter(
      (result) => result.entryCertificateId === certificateId && result.tenantId === tenantId
    );
  }

  async deleteEntryCertificateResult(id: number, tenantId: number): Promise<boolean> {
    const result = await this.getEntryCertificateResult(id, tenantId);
    if (!result) return false;
    return this.entryCertificateResults.delete(id);
  }

  // Issued Certificate methods
  async getIssuedCertificate(id: number, tenantId: number): Promise<IssuedCertificate | undefined> {
    const certificate = this.issuedCertificates.get(id);
    if (certificate && certificate.tenantId === tenantId) {
      return certificate;
    }
    return undefined;
  }

  async createIssuedCertificate(certificate: InsertIssuedCertificate): Promise<IssuedCertificate> {
    const id = this.issuedCertificateIdCounter++;
    const newCertificate: IssuedCertificate = { 
      ...certificate, 
      id,
      soldQuantity: typeof certificate.soldQuantity === 'number' ? String(certificate.soldQuantity) : certificate.soldQuantity
    };
    this.issuedCertificates.set(id, newCertificate);
    return newCertificate;
  }

  async getIssuedCertificatesByTenant(tenantId: number, filters: Record<string, any> = {}): Promise<IssuedCertificate[]> {
    let certificates = Array.from(this.issuedCertificates.values()).filter(
      (cert) => cert.tenantId === tenantId
    );
    
    // Apply filters if any
    if (filters.clientId) {
      certificates = certificates.filter(cert => cert.clientId === Number(filters.clientId));
    }
    if (filters.entryCertificateId) {
      certificates = certificates.filter(cert => cert.entryCertificateId === Number(filters.entryCertificateId));
    }
    if (filters.invoiceNumber) {
      certificates = certificates.filter(cert => cert.invoiceNumber.includes(filters.invoiceNumber));
    }
    if (filters.customLot) {
      certificates = certificates.filter(cert => cert.customLot.includes(filters.customLot));
    }
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      certificates = certificates.filter(cert => new Date(cert.issueDate) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      certificates = certificates.filter(cert => new Date(cert.issueDate) <= endDate);
    }
    
    return certificates;
  }
  
  async getIssuedCertificatesByEntryCertificate(entryCertificateId: number, tenantId: number): Promise<IssuedCertificate[]> {
    return Array.from(this.issuedCertificates.values()).filter(
      (cert) => cert.entryCertificateId === entryCertificateId && cert.tenantId === tenantId
    );
  }

  // Package Type methods
  async getPackageType(id: number, tenantId: number): Promise<PackageType | undefined> {
    const packageType = this.packageTypes.get(id);
    if (packageType && packageType.tenantId === tenantId) {
      return packageType;
    }
    return undefined;
  }

  async createPackageType(packageType: InsertPackageType): Promise<PackageType> {
    const id = this.packageTypeIdCounter++;
    const newPackageType: PackageType = { 
      ...packageType, 
      id,
      active: packageType.active ?? true 
    };
    this.packageTypes.set(id, newPackageType);
    return newPackageType;
  }

  async updatePackageType(id: number, tenantId: number, packageTypeData: Partial<PackageType>): Promise<PackageType | undefined> {
    const packageType = await this.getPackageType(id, tenantId);
    if (!packageType) return undefined;
    
    const updatedPackageType = { ...packageType, ...packageTypeData };
    this.packageTypes.set(id, updatedPackageType);
    return updatedPackageType;
  }

  async getPackageTypesByTenant(tenantId: number): Promise<PackageType[]> {
    return Array.from(this.packageTypes.values()).filter(
      (packageType) => packageType.tenantId === tenantId && packageType.active
    );
  }

  async deletePackageType(id: number, tenantId: number): Promise<boolean> {
    const packageType = await this.getPackageType(id, tenantId);
    if (!packageType) return false;
    return this.packageTypes.delete(id);
  }
  
  // Files Management methods
  async getFile(id: number, tenantId: number): Promise<File | undefined> {
    const file = this.files.get(id);
    if (file && file.tenantId === tenantId) {
      return file;
    }
    return undefined;
  }

  async createFile(file: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const newFile: File = { 
      ...file, 
      id,
      description: file.description ?? null,
      entityType: file.entityType ?? null,
      entityId: file.entityId ?? null,
      uploadedAt: new Date()
    };
    this.files.set(id, newFile);
    
    // Atualiza o contador de armazenamento usado pelo tenant
    const tenant = await this.getTenant(file.tenantId);
    if (tenant) {
      const fileSizeMB = typeof file.fileSizeMB === 'string' 
        ? parseFloat(file.fileSizeMB) 
        : file.fileSizeMB;
      
      await this.updateTenant(tenant.id, {
        storageUsed: tenant.storageUsed + fileSizeMB
      });
    }
    
    return newFile;
  }

  async getFilesByTenant(tenantId: number, fileCategory?: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => {
        if (fileCategory) {
          return file.tenantId === tenantId && file.fileCategory === fileCategory;
        }
        return file.tenantId === tenantId;
      }
    );
  }

  async getFilesByEntity(entityType: string, entityId: number, tenantId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.entityType === entityType && 
                file.entityId === entityId && 
                file.tenantId === tenantId
    );
  }

  async deleteFile(id: number, tenantId: number): Promise<boolean> {
    const file = await this.getFile(id, tenantId);
    if (!file) return false;
    
    // Atualiza o contador de armazenamento usado pelo tenant
    const tenant = await this.getTenant(file.tenantId);
    if (tenant) {
      const fileSizeMB = typeof file.fileSizeMB === 'string' 
        ? parseFloat(file.fileSizeMB) 
        : file.fileSizeMB;
      
      await this.updateTenant(tenant.id, {
        storageUsed: Math.max(0, tenant.storageUsed - fileSizeMB)
      });
    }
    
    return this.files.delete(id);
  }

  // Plans & Modules methods (implementação in-memory simplificada)
  async getAllPlans(): Promise<typeof plans.$inferSelect[]> {
    // Na implementação in-memory, retornamos apenas um plano básico simulado
    return [{
      id: 1,
      code: "A",
      name: "Básico",
      description: "Plano Básico",
      active: true,
      price: "80.00",
      storageLimit: 2048, // 2GB
      maxUsers: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    }];
  }

  async getPlan(id: number): Promise<typeof plans.$inferSelect | undefined> {
    if (id === 1) {
      return {
        id: 1,
        code: "A",
        name: "Básico",
        description: "Plano Básico",
        active: true,
        price: "80.00",
        storageLimit: 2048, // 2GB
        maxUsers: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return undefined;
  }

  async getPlanByCode(code: string): Promise<typeof plans.$inferSelect | undefined> {
    if (code === "A") {
      return {
        id: 1,
        code: "A",
        name: "Básico",
        description: "Plano Básico",
        active: true,
        price: "80.00",
        storageLimit: 2048, // 2GB
        maxUsers: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return undefined;
  }

  async getAllModules(): Promise<typeof modules.$inferSelect[]> {
    // Simulamos módulos básicos
    return [
      {
        id: 1,
        code: "CERTIFICADOS_BASE",
        name: "Certificados Base",
        description: "Módulo básico para gestão de certificados",
        active: true,
        isCore: true,
        createdAt: new Date()
      }
    ];
  }

  async getModule(id: number): Promise<typeof modules.$inferSelect | undefined> {
    if (id === 1) {
      return {
        id: 1,
        code: "CERTIFICADOS_BASE",
        name: "Certificados Base",
        description: "Módulo básico para gestão de certificados",
        active: true,
        isCore: true,
        createdAt: new Date()
      };
    }
    return undefined;
  }

  async getModulesByPlan(planId: number): Promise<typeof modules.$inferSelect[]> {
    // No plano básico (id = 1), retornamos apenas o módulo de certificados base
    if (planId === 1) {
      return [
        {
          id: 1,
          code: "CERTIFICADOS_BASE",
          name: "Certificados Base",
          description: "Módulo básico para gestão de certificados",
          active: true,
          isCore: true,
          createdAt: new Date()
        }
      ];
    }
    return [];
  }

  async getModulesByPlanCode(code: string): Promise<typeof modules.$inferSelect[]> {
    // No plano básico (code = "A"), retornamos apenas o módulo de certificados base
    if (code === "A") {
      return [
        {
          id: 1,
          code: "CERTIFICADOS_BASE",
          name: "Certificados Base",
          description: "Módulo básico para gestão de certificados",
          active: true,
          isCore: true,
          createdAt: new Date()
        }
      ];
    }
    return [];
  }

  async getTenantEnabledModules(tenantId: number): Promise<typeof modules.$inferSelect[]> {
    // Todos os tenants no MemStorage usam o plano básico por padrão
    return this.getModulesByPlan(1);
  }
  
  async getModules(): Promise<any[]> {
    return this.getAllModules();
  }
  
  async createModule(module: InsertModule): Promise<typeof modules.$inferSelect> {
    return {
      id: 2,
      code: module.code,
      name: module.name,
      description: module.description || "",
      active: module.active || true,
      isCore: module.isCore || false,
      createdAt: new Date()
    };
  }
  
  async updateModule(id: number, module: Partial<InsertModule>): Promise<typeof modules.$inferSelect | undefined> {
    if (id === 1) {
      return {
        id: 1,
        code: module.code || "CERTIFICADOS_BASE",
        name: module.name || "Certificados Base",
        description: module.description || "Módulo básico para gestão de certificados",
        active: module.active !== undefined ? module.active : true,
        isCore: module.isCore !== undefined ? module.isCore : true,
        createdAt: new Date()
      };
    }
    return undefined;
  }
  
  async deleteModule(id: number): Promise<boolean> {
    return id !== 1; // Não permitir excluir o módulo core
  }
  
  async updatePlanModules(planId: number, moduleIds: number[]): Promise<boolean> {
    return true; // Simulação sempre bem-sucedida
  }
  
  // Implementação de ModuleFeatures para MemStorage
  async getModuleFeature(id: number): Promise<typeof moduleFeatures.$inferSelect | undefined> {
    return {
      id: id,
      moduleId: 1,
      featurePath: '/api/test',
      featureName: 'Test Feature',
      description: 'Memory implementation',
      createdAt: new Date()
    };
  }
  
  async getModuleFeatures(): Promise<typeof moduleFeatures.$inferSelect[]> {
    return [
      {
        id: 1,
        moduleId: 1,
        featurePath: '/api/user',
        featureName: 'Profile',
        description: 'User profile API',
        createdAt: new Date()
      }
    ];
  }
  
  async getModuleFeaturesByModule(moduleId: number): Promise<typeof moduleFeatures.$inferSelect[]> {
    return this.getModuleFeatures();
  }
  
  async createModuleFeature(feature: z.infer<typeof insertModuleFeatureSchema>): Promise<typeof moduleFeatures.$inferSelect> {
    return {
      id: 2,
      moduleId: feature.moduleId,
      featurePath: feature.featurePath,
      featureName: feature.featureName,
      description: feature.description,
      createdAt: new Date()
    };
  }
  
  async updateModuleFeature(id: number, feature: Partial<z.infer<typeof insertModuleFeatureSchema>>): Promise<typeof moduleFeatures.$inferSelect | undefined> {
    return {
      id,
      moduleId: feature.moduleId || 1,
      featurePath: feature.featurePath || '/api/test',
      featureName: feature.featureName || 'Test Feature',
      description: feature.description || 'Memory implementation updated',
      createdAt: new Date()
    };
  }
  
  async deleteModuleFeature(id: number): Promise<boolean> {
    return true;
  }
  
  async isFeatureAccessible(featurePath: string, tenantId: number): Promise<boolean> {
    // Obter o tenant
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }
    
    // Obter os módulos do plano do tenant
    const modules = await this.getModulesByPlan(tenant.planId);
    if (!modules || modules.length === 0) {
      return false;
    }
    
    // Na implementação em memória, simplesmente verificamos se o módulo existe
    // Em uma implementação real, verificaríamos se o módulo tem a feature específica
    return modules.length > 0;
  }
  
  // Implementação dos métodos administrativos
  async deleteTenant(id: number): Promise<boolean> {
    // Antes de remover o tenant, devemos remover todos os seus usuários
    const tenantUsers = await this.getUsersByTenant(id);
    for (const user of tenantUsers) {
      await this.deleteUser(user.id);
    }
    
    // Remover todas as entidades associadas ao tenant
    // (Em uma implementação real, seria necessário remover todas as entidades)
    
    return this.tenants.delete(id);
  }
  
  async getPlans(): Promise<any[]> {
    return [
      {
        id: 1,
        code: "BASIC",
        name: "Básico",
        description: "Plano básico com recursos limitados",
        active: true,
        price: "99.90",
        storageLimit: 2, // em MB
        maxUsers: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        maxStorage: 2 // em MB
      },
      {
        id: 2,
        code: "INTERMEDIATE",
        name: "Intermediário",
        description: "Plano intermediário com mais recursos",
        active: true,
        price: "199.90",
        storageLimit: 5, // em MB
        maxUsers: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        maxStorage: 5 // em MB
      },
      {
        id: 3,
        code: "COMPLETE",
        name: "Completo",
        description: "Plano completo com todos os recursos",
        active: true,
        price: "299.90",
        storageLimit: 10, // em MB
        maxUsers: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
        maxStorage: 10 // em MB
      }
    ];
  }
  
  async createPlan(plan: any): Promise<any> {
    // Em uma implementação real, seria adicionado ao banco de dados
    return {
      id: 4,
      ...plan,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxStorage: plan.storageLimit || 0
    };
  }
  
  async updatePlan(id: number, plan: Partial<any>): Promise<any | undefined> {
    // Em uma implementação de memória, retornamos o plano atualizado
    const plans = await this.getPlans();
    const existingPlan = plans.find(p => p.id === id);
    
    if (!existingPlan) {
      return undefined;
    }
    
    return {
      ...existingPlan,
      ...plan,
      updatedAt: new Date(),
      maxStorage: plan.storageLimit || existingPlan.maxStorage
    };
  }
  
  async deletePlan(id: number): Promise<boolean> {
    // Em uma implementação de memória, retornamos true (sucesso)
    // Não podemos realmente excluir de uma array constante
    return true;
  }
  
  async getModules(): Promise<any[]> {
    return [
      {
        id: 1,
        code: "CERTIFICADOS_BASE",
        name: "Certificados Base",
        description: "Módulo básico para gestão de certificados",
        active: true,
        isCore: true,
        createdAt: new Date()
      },
      {
        id: 2,
        code: "RASTREABILIDADE",
        name: "Rastreabilidade",
        description: "Módulo de rastreabilidade avançada",
        active: true,
        isCore: false,
        createdAt: new Date()
      },
      {
        id: 3,
        code: "RELATORIOS",
        name: "Relatórios Avançados",
        description: "Relatórios e dashboards avançados",
        active: true,
        isCore: false,
        createdAt: new Date()
      }
    ];
  }
  
  async getAllFiles(): Promise<File[]> {
    return Array.from(this.files.values());
  }
  
  async getStorageInfo(): Promise<{totalFiles: number, totalSizeMB: number}> {
    const files = Array.from(this.files.values());
    const totalSizeMB = files.reduce((acc, file) => acc + (parseFloat(file.fileSizeMB) || 0), 0);
    
    return {
      totalFiles: files.length,
      totalSizeMB
    };
  }
  
  async getStorageUsageByTenant(): Promise<any[]> {
    const files = Array.from(this.files.values());
    const tenants = await this.getAllTenants();
    const result = [];
    
    for (const tenant of tenants) {
      const tenantFiles = files.filter(f => f.tenantId === tenant.id);
      const storageUsed = tenantFiles.reduce((acc, file) => acc + (parseFloat(file.fileSizeMB) || 0), 0);
      const plan = tenant.planId === 1 ? { maxStorage: 2 } : 
                  tenant.planId === 2 ? { maxStorage: 5 } : 
                  tenant.planId === 3 ? { maxStorage: 10 } : { maxStorage: 0 };
      
      result.push({
        id: tenant.id,
        name: tenant.name,
        storageUsed,
        fileCount: tenantFiles.length,
        maxStorage: plan.maxStorage,
        planName: tenant.planId === 1 ? 'Básico' : 
                 tenant.planId === 2 ? 'Intermediário' : 
                 tenant.planId === 3 ? 'Completo' : 'Desconhecido'
      });
    }
    
    return result;
  }
  
  async cleanupUnusedFiles(tenantId: number): Promise<{filesRemoved: number, spaceSaved: number}> {
    const files = Array.from(this.files.values()).filter(f => f.tenantId === tenantId && !f.entityId);
    let filesRemoved = 0;
    let spaceSaved = 0;
    
    for (const file of files) {
      const success = await this.deleteFile(file.id, tenantId);
      if (success) {
        filesRemoved++;
        spaceSaved += parseFloat(file.fileSizeMB) || 0;
      }
    }
    
    return { filesRemoved, spaceSaved };
  }
}

// Classe DatabaseStorage que implementa a interface IStorage
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresStore = connectPgSimple(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      role: user.role ?? 'user',
      active: user.active ?? true
    }).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersByTenant(tenantId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Tenant methods
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByName(name: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.name, name));
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    // Se não for fornecido um planId, buscamos o plano básico (código A)
    let planId = tenant.planId;
    if (!planId) {
      const [basicPlan] = await db.select().from(plans).where(eq(plans.code, "A"));
      planId = basicPlan?.id || 1; // Fallback para o ID 1 se não encontrar
    }

    const [newTenant] = await db.insert(tenants).values({
      ...tenant,
      active: tenant.active ?? true,
      logoUrl: tenant.logoUrl ?? null,
      planId: planId,
      storageUsed: tenant.storageUsed ?? 0,
      planStartDate: tenant.planStartDate ?? new Date(),
      planEndDate: tenant.planEndDate ?? null
    }).returning();
    return newTenant;
  }

  async updateTenant(id: number, tenantData: Partial<Tenant>): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants)
      .set(tenantData)
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants);
  }

  // Product Category methods
  async getProductCategory(id: number, tenantId: number): Promise<ProductCategory | undefined> {
    const [category] = await db.select().from(productCategories)
      .where(and(
        eq(productCategories.id, id),
        eq(productCategories.tenantId, tenantId)
      ));
    return category;
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db.insert(productCategories).values({
      ...category,
      active: category.active ?? true,
      description: category.description ?? null
    }).returning();
    return newCategory;
  }

  async updateProductCategory(id: number, tenantId: number, categoryData: Partial<ProductCategory>): Promise<ProductCategory | undefined> {
    const [category] = await db.update(productCategories)
      .set(categoryData)
      .where(and(
        eq(productCategories.id, id),
        eq(productCategories.tenantId, tenantId)
      ))
      .returning();
    return category;
  }

  async getProductCategoriesByTenant(tenantId: number): Promise<ProductCategory[]> {
    return await db.select().from(productCategories)
      .where(eq(productCategories.tenantId, tenantId));
  }

  async deleteProductCategory(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(productCategories)
      .where(and(
        eq(productCategories.id, id),
        eq(productCategories.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Product Subcategory methods
  async getProductSubcategory(id: number, tenantId: number): Promise<ProductSubcategory | undefined> {
    const [subcategory] = await db.select().from(productSubcategories)
      .where(and(
        eq(productSubcategories.id, id),
        eq(productSubcategories.tenantId, tenantId)
      ));
    return subcategory;
  }

  async createProductSubcategory(subcategory: InsertProductSubcategory): Promise<ProductSubcategory> {
    const [newSubcategory] = await db.insert(productSubcategories).values({
      ...subcategory,
      active: subcategory.active ?? true,
      description: subcategory.description ?? null
    }).returning();
    return newSubcategory;
  }

  async updateProductSubcategory(id: number, tenantId: number, subcategoryData: Partial<ProductSubcategory>): Promise<ProductSubcategory | undefined> {
    const [subcategory] = await db.update(productSubcategories)
      .set(subcategoryData)
      .where(and(
        eq(productSubcategories.id, id),
        eq(productSubcategories.tenantId, tenantId)
      ))
      .returning();
    return subcategory;
  }

  async getProductSubcategoriesByCategory(categoryId: number, tenantId: number): Promise<ProductSubcategory[]> {
    return await db.select().from(productSubcategories)
      .where(and(
        eq(productSubcategories.categoryId, categoryId),
        eq(productSubcategories.tenantId, tenantId)
      ));
  }

  async getProductSubcategoriesByTenant(tenantId: number): Promise<ProductSubcategory[]> {
    return await db.select().from(productSubcategories)
      .where(eq(productSubcategories.tenantId, tenantId));
  }

  async deleteProductSubcategory(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(productSubcategories)
      .where(and(
        eq(productSubcategories.id, id),
        eq(productSubcategories.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Product Base methods
  async getProductBase(id: number, tenantId: number): Promise<ProductBase | undefined> {
    const [productBaseItem] = await db.select().from(productBase)
      .where(and(
        eq(productBase.id, id),
        eq(productBase.tenantId, tenantId)
      ));
    return productBaseItem;
  }

  async createProductBase(productBaseData: InsertProductBase): Promise<ProductBase> {
    const [newProductBase] = await db.insert(productBase).values({
      ...productBaseData,
      active: productBaseData.active ?? true,
      description: productBaseData.description ?? null,
      riskClass: productBaseData.riskClass ?? null,
      riskNumber: productBaseData.riskNumber ?? null,
      unNumber: productBaseData.unNumber ?? null,
      packagingGroup: productBaseData.packagingGroup ?? null
    }).returning();
    return newProductBase;
  }

  async updateProductBase(id: number, tenantId: number, productBaseData: Partial<ProductBase>): Promise<ProductBase | undefined> {
    const [productBaseItem] = await db.update(productBase)
      .set(productBaseData)
      .where(and(
        eq(productBase.id, id),
        eq(productBase.tenantId, tenantId)
      ))
      .returning();
    return productBaseItem;
  }

  async getProductBasesBySubcategory(subcategoryId: number, tenantId: number): Promise<ProductBase[]> {
    return await db.select().from(productBase)
      .where(and(
        eq(productBase.subcategoryId, subcategoryId),
        eq(productBase.tenantId, tenantId)
      ));
  }

  async getProductBasesByTenant(tenantId: number): Promise<ProductBase[]> {
    return await db.select().from(productBase)
      .where(eq(productBase.tenantId, tenantId));
  }

  async deleteProductBase(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(productBase)
      .where(and(
        eq(productBase.id, id),
        eq(productBase.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Product methods
  async getProduct(id: number, tenantId: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(and(
        eq(products.id, id),
        eq(products.tenantId, tenantId)
      ));
    return product;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values({
      ...productData,
      active: productData.active ?? true,
      specifications: productData.specifications ?? null
    }).returning();
    return newProduct;
  }

  async updateProduct(id: number, tenantId: number, productData: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(productData)
      .where(and(
        eq(products.id, id),
        eq(products.tenantId, tenantId)
      ))
      .returning();
    return product;
  }

  async getProductsByBase(baseProductId: number, tenantId: number): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.baseProductId, baseProductId),
        eq(products.tenantId, tenantId)
      ));
  }

  async getProductsByTenant(tenantId: number): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.tenantId, tenantId));
  }

  async deleteProduct(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(products)
      .where(and(
        eq(products.id, id),
        eq(products.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Product Files methods
  async getProductFile(id: number, tenantId: number): Promise<ProductFile | undefined> {
    const [file] = await db.select().from(productFiles)
      .where(and(
        eq(productFiles.id, id),
        eq(productFiles.tenantId, tenantId)
      ));
    return file;
  }

  async createProductFile(file: InsertProductFile): Promise<ProductFile> {
    const [newFile] = await db.insert(productFiles).values(file).returning();
    return newFile;
  }

  async getProductFilesByProduct(productId: number, tenantId: number): Promise<ProductFile[]> {
    return await db.select().from(productFiles)
      .where(and(
        eq(productFiles.productId, productId),
        eq(productFiles.tenantId, tenantId)
      ));
  }

  async deleteProductFile(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(productFiles)
      .where(and(
        eq(productFiles.id, id),
        eq(productFiles.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Product Base Files methods
  async getProductBaseFile(id: number, tenantId: number): Promise<ProductBaseFile | undefined> {
    const [file] = await db.select().from(productBaseFiles)
      .where(and(
        eq(productBaseFiles.id, id),
        eq(productBaseFiles.tenantId, tenantId)
      ));
    return file;
  }

  async createProductBaseFile(file: InsertProductBaseFile): Promise<ProductBaseFile> {
    const [newFile] = await db.insert(productBaseFiles).values(file).returning();
    return newFile;
  }

  async getProductBaseFilesByBaseProduct(baseProductId: number, tenantId: number): Promise<ProductBaseFile[]> {
    return await db.select().from(productBaseFiles)
      .where(and(
        eq(productBaseFiles.baseProductId, baseProductId),
        eq(productBaseFiles.tenantId, tenantId)
      ));
  }

  async getProductBaseFilesByCategory(baseProductId: number, category: string, tenantId: number): Promise<ProductBaseFile[]> {
    return await db.select().from(productBaseFiles)
      .where(and(
        eq(productBaseFiles.baseProductId, baseProductId),
        eq(productBaseFiles.fileCategory, category),
        eq(productBaseFiles.tenantId, tenantId)
      ));
  }

  async deleteProductBaseFile(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(productBaseFiles)
      .where(and(
        eq(productBaseFiles.id, id),
        eq(productBaseFiles.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Product Characteristics methods
  async getProductCharacteristic(id: number, tenantId: number): Promise<ProductCharacteristic | undefined> {
    const [characteristic] = await db.select().from(productCharacteristics)
      .where(and(
        eq(productCharacteristics.id, id),
        eq(productCharacteristics.tenantId, tenantId)
      ));
    return characteristic;
  }

  async createProductCharacteristic(characteristic: InsertProductCharacteristic): Promise<ProductCharacteristic> {
    const [newCharacteristic] = await db.insert(productCharacteristics).values(characteristic).returning();
    return newCharacteristic;
  }

  async updateProductCharacteristic(id: number, tenantId: number, characteristicData: Partial<ProductCharacteristic>): Promise<ProductCharacteristic | undefined> {
    const [characteristic] = await db.update(productCharacteristics)
      .set(characteristicData)
      .where(and(
        eq(productCharacteristics.id, id),
        eq(productCharacteristics.tenantId, tenantId)
      ))
      .returning();
    return characteristic;
  }

  async getCharacteristicsByProduct(productId: number, tenantId: number): Promise<ProductCharacteristic[]> {
    return await db.select().from(productCharacteristics)
      .where(and(
        eq(productCharacteristics.productId, productId),
        eq(productCharacteristics.tenantId, tenantId)
      ));
  }

  async deleteProductCharacteristic(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(productCharacteristics)
      .where(and(
        eq(productCharacteristics.id, id),
        eq(productCharacteristics.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Suppliers methods
  async getSupplier(id: number, tenantId: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, tenantId)
      ));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, tenantId: number, supplierData: Partial<Supplier>): Promise<Supplier | undefined> {
    const [supplier] = await db.update(suppliers)
      .set(supplierData)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, tenantId)
      ))
      .returning();
    return supplier;
  }

  async getSuppliersByTenant(tenantId: number): Promise<Supplier[]> {
    return await db.select().from(suppliers)
      .where(eq(suppliers.tenantId, tenantId));
  }

  async deleteSupplier(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(suppliers)
      .where(and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Manufacturers methods
  async getManufacturer(id: number, tenantId: number): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.select().from(manufacturers)
      .where(and(
        eq(manufacturers.id, id),
        eq(manufacturers.tenantId, tenantId)
      ));
    return manufacturer;
  }

  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> {
    const [newManufacturer] = await db.insert(manufacturers).values(manufacturer).returning();
    return newManufacturer;
  }

  async updateManufacturer(id: number, tenantId: number, manufacturerData: Partial<Manufacturer>): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.update(manufacturers)
      .set(manufacturerData)
      .where(and(
        eq(manufacturers.id, id),
        eq(manufacturers.tenantId, tenantId)
      ))
      .returning();
    return manufacturer;
  }

  async getManufacturersByTenant(tenantId: number): Promise<Manufacturer[]> {
    return await db.select().from(manufacturers)
      .where(eq(manufacturers.tenantId, tenantId));
  }

  async deleteManufacturer(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(manufacturers)
      .where(and(
        eq(manufacturers.id, id),
        eq(manufacturers.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Clients methods
  async getClient(id: number, tenantId: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients)
      .where(and(
        eq(clients.id, id),
        eq(clients.tenantId, tenantId)
      ));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, tenantId: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const [client] = await db.update(clients)
      .set(clientData)
      .where(and(
        eq(clients.id, id),
        eq(clients.tenantId, tenantId)
      ))
      .returning();
    return client;
  }

  async getClientsByTenant(tenantId: number): Promise<Client[]> {
    return await db.select().from(clients)
      .where(eq(clients.tenantId, tenantId));
  }

  async deleteClient(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(clients)
      .where(and(
        eq(clients.id, id),
        eq(clients.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Entry Certificates methods
  async getEntryCertificate(id: number, tenantId: number): Promise<EntryCertificate | undefined> {
    const [certificate] = await db.select().from(entryCertificates)
      .where(and(
        eq(entryCertificates.id, id),
        eq(entryCertificates.tenantId, tenantId)
      ));
    return certificate;
  }

  async createEntryCertificate(certificate: InsertEntryCertificate): Promise<EntryCertificate> {
    const [newCertificate] = await db.insert(entryCertificates).values(certificate).returning();
    return newCertificate;
  }

  async updateEntryCertificate(id: number, tenantId: number, certificateData: Partial<EntryCertificate>): Promise<EntryCertificate | undefined> {
    const [certificate] = await db.update(entryCertificates)
      .set(certificateData)
      .where(and(
        eq(entryCertificates.id, id),
        eq(entryCertificates.tenantId, tenantId)
      ))
      .returning();
    return certificate;
  }

  async getEntryCertificatesByTenant(tenantId: number, filters?: Record<string, any>): Promise<EntryCertificate[]> {
    // Implementação básica sem filtros por enquanto
    return await db.select().from(entryCertificates)
      .where(eq(entryCertificates.tenantId, tenantId));
  }

  async deleteEntryCertificate(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(entryCertificates)
      .where(and(
        eq(entryCertificates.id, id),
        eq(entryCertificates.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Entry Certificate Results methods
  async getEntryCertificateResult(id: number, tenantId: number): Promise<EntryCertificateResult | undefined> {
    const [result] = await db.select().from(entryCertificateResults)
      .where(and(
        eq(entryCertificateResults.id, id),
        eq(entryCertificateResults.tenantId, tenantId)
      ));
    return result;
  }

  async createEntryCertificateResult(result: InsertEntryCertificateResult): Promise<EntryCertificateResult> {
    const [newResult] = await db.insert(entryCertificateResults).values(result).returning();
    return newResult;
  }

  async updateEntryCertificateResult(id: number, tenantId: number, resultData: Partial<EntryCertificateResult>): Promise<EntryCertificateResult | undefined> {
    const [result] = await db.update(entryCertificateResults)
      .set(resultData)
      .where(and(
        eq(entryCertificateResults.id, id),
        eq(entryCertificateResults.tenantId, tenantId)
      ))
      .returning();
    return result;
  }

  async getResultsByEntryCertificate(certificateId: number, tenantId: number): Promise<EntryCertificateResult[]> {
    return await db.select().from(entryCertificateResults)
      .where(and(
        eq(entryCertificateResults.entryCertificateId, certificateId),
        eq(entryCertificateResults.tenantId, tenantId)
      ));
  }

  async deleteEntryCertificateResult(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(entryCertificateResults)
      .where(and(
        eq(entryCertificateResults.id, id),
        eq(entryCertificateResults.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Issued Certificates methods
  async getIssuedCertificate(id: number, tenantId: number): Promise<IssuedCertificate | undefined> {
    const [certificate] = await db.select().from(issuedCertificates)
      .where(and(
        eq(issuedCertificates.id, id),
        eq(issuedCertificates.tenantId, tenantId)
      ));
    return certificate;
  }

  async createIssuedCertificate(certificate: InsertIssuedCertificate): Promise<IssuedCertificate> {
    const [newCertificate] = await db.insert(issuedCertificates).values(certificate).returning();
    return newCertificate;
  }

  async getIssuedCertificatesByTenant(tenantId: number, filters?: Record<string, any>): Promise<IssuedCertificate[]> {
    // Implementação básica sem filtros por enquanto
    return await db.select().from(issuedCertificates)
      .where(eq(issuedCertificates.tenantId, tenantId));
  }

  async getIssuedCertificatesByEntryCertificate(entryCertificateId: number, tenantId: number): Promise<IssuedCertificate[]> {
    return await db.select().from(issuedCertificates)
      .where(and(
        eq(issuedCertificates.entryCertificateId, entryCertificateId),
        eq(issuedCertificates.tenantId, tenantId)
      ));
  }

  // Package Types methods
  async getPackageType(id: number, tenantId: number): Promise<PackageType | undefined> {
    const [packageType] = await db.select().from(packageTypes)
      .where(and(
        eq(packageTypes.id, id),
        eq(packageTypes.tenantId, tenantId)
      ));
    return packageType;
  }

  async createPackageType(packageType: InsertPackageType): Promise<PackageType> {
    const [newPackageType] = await db.insert(packageTypes).values(packageType).returning();
    return newPackageType;
  }

  async updatePackageType(id: number, tenantId: number, packageTypeData: Partial<PackageType>): Promise<PackageType | undefined> {
    const [packageType] = await db.update(packageTypes)
      .set(packageTypeData)
      .where(and(
        eq(packageTypes.id, id),
        eq(packageTypes.tenantId, tenantId)
      ))
      .returning();
    return packageType;
  }

  async getPackageTypesByTenant(tenantId: number): Promise<PackageType[]> {
    return await db.select().from(packageTypes)
      .where(eq(packageTypes.tenantId, tenantId));
  }

  async deletePackageType(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(packageTypes)
      .where(and(
        eq(packageTypes.id, id),
        eq(packageTypes.tenantId, tenantId)
      ));
    return result.rowCount > 0;
  }

  // Files Management methods
  async getFile(id: number, tenantId: number): Promise<File | undefined> {
    const [file] = await db.select().from(files)
      .where(and(
        eq(files.id, id),
        eq(files.tenantId, tenantId)
      ));
    return file;
  }

  async createFile(file: InsertFile): Promise<File> {
    // Inserir o arquivo no banco
    const [newFile] = await db.insert(files).values({
      ...file,
      description: file.description ?? null,
      entityType: file.entityType ?? null,
      entityId: file.entityId ?? null,
      uploadedAt: new Date()
    }).returning();
    
    // Atualizar o contador de armazenamento usado pelo tenant
    const tenant = await this.getTenant(file.tenantId);
    if (tenant) {
      const fileSizeMB = typeof file.fileSizeMB === 'string' 
        ? parseFloat(file.fileSizeMB) 
        : file.fileSizeMB;
      
      await this.updateTenant(tenant.id, {
        storageUsed: tenant.storageUsed + fileSizeMB
      });
    }
    
    return newFile;
  }

  async getFilesByTenant(tenantId: number, fileCategory?: string): Promise<File[]> {
    if (fileCategory) {
      return await db.select().from(files)
        .where(and(
          eq(files.tenantId, tenantId),
          eq(files.fileCategory, fileCategory)
        ));
    }
    return await db.select().from(files)
      .where(eq(files.tenantId, tenantId));
  }

  async getFilesByEntity(entityType: string, entityId: number, tenantId: number): Promise<File[]> {
    return await db.select().from(files)
      .where(and(
        eq(files.entityType, entityType),
        eq(files.entityId, entityId),
        eq(files.tenantId, tenantId)
      ));
  }

  async deleteFile(id: number, tenantId: number): Promise<boolean> {
    // Recuperar o arquivo para obter o tamanho
    const file = await this.getFile(id, tenantId);
    if (!file) return false;
    
    // Atualizar o contador de armazenamento usado pelo tenant
    const tenant = await this.getTenant(file.tenantId);
    if (tenant) {
      const fileSizeMB = typeof file.fileSizeMB === 'string' 
        ? parseFloat(file.fileSizeMB) 
        : file.fileSizeMB;
      
      await this.updateTenant(tenant.id, {
        storageUsed: Math.max(0, tenant.storageUsed - fileSizeMB)
      });
    }
    
    // Remover o arquivo do banco
    const result = await db.delete(files)
      .where(and(
        eq(files.id, id),
        eq(files.tenantId, tenantId)
      ));
    
    return result.rowCount > 0;
  }
  
  // Plans & Modules methods
  async getAllPlans(): Promise<typeof plans.$inferSelect[]> {
    return await db.select().from(plans).where(eq(plans.active, true));
  }

  async getPlan(id: number): Promise<typeof plans.$inferSelect | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async getPlanByCode(code: string): Promise<typeof plans.$inferSelect | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.code, code));
    return plan;
  }

  async getAllModules(): Promise<typeof modules.$inferSelect[]> {
    return await db.select().from(modules).where(eq(modules.active, true));
  }

  async getModule(id: number): Promise<typeof modules.$inferSelect | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async getModulesByPlan(planId: number): Promise<typeof modules.$inferSelect[]> {
    return await db
      .select({
        id: modules.id,
        code: modules.code,
        name: modules.name,
        description: modules.description,
        active: modules.active,
        isCore: modules.isCore,
        createdAt: modules.createdAt
      })
      .from(planModules)
      .innerJoin(modules, eq(planModules.moduleId, modules.id))
      .where(and(
        eq(planModules.planId, planId),
        eq(modules.active, true)
      ));
  }

  async getModulesByPlanCode(code: string): Promise<typeof modules.$inferSelect[]> {
    return await db
      .select({
        id: modules.id,
        code: modules.code,
        name: modules.name,
        description: modules.description,
        active: modules.active,
        isCore: modules.isCore,
        createdAt: modules.createdAt
      })
      .from(planModules)
      .innerJoin(modules, eq(planModules.moduleId, modules.id))
      .innerJoin(plans, eq(planModules.planId, plans.id))
      .where(and(
        eq(plans.code, code),
        eq(modules.active, true),
        eq(plans.active, true)
      ));
  }

  async getTenantEnabledModules(tenantId: number): Promise<typeof modules.$inferSelect[]> {
    // Buscar o tenant para obter o planId
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenant) return [];

    // Buscar todos os módulos disponíveis para o plano do tenant
    return await this.getModulesByPlan(tenant.planId);
  }
  
  // Implementação dos métodos administrativos
  async deleteTenant(id: number): Promise<boolean> {
    // Antes de remover o tenant, devemos remover todos os usuários associados
    const users = await this.getUsersByTenant(id);
    for (const user of users) {
      await this.deleteUser(user.id);
    }
    
    // Remover o tenant
    const result = await db.delete(tenants).where(eq(tenants.id, id));
    return result.rowCount > 0;
  }
  
  async getPlans(): Promise<any[]> {
    return await db.select({
      id: plans.id,
      name: plans.name,
      active: plans.active,
      code: plans.code,
      description: plans.description,
      price: plans.price,
      storageLimit: plans.storageLimit,
      maxUsers: plans.maxUsers,
      createdAt: plans.createdAt,
      updatedAt: plans.updatedAt,
      maxStorage: plans.storageLimit // Mapeamento para manter compatibilidade
    }).from(plans);
  }
  
  async createPlan(plan: any): Promise<any> {
    // Garantir que a descrição não seja nula
    if (!plan.description) {
      throw new Error('A descrição do plano é obrigatória');
    }
    
    const [newPlan] = await db.insert(plans).values({
      name: plan.name,
      code: plan.code || 'CUSTOM',
      description: plan.description,
      price: plan.price || '0',
      storageLimit: plan.maxStorage || plan.storageLimit || 0,
      maxUsers: plan.maxUsers || 1,
      active: plan.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return {
      ...newPlan,
      maxStorage: newPlan.storageLimit
    };
  }
  
  async updatePlan(id: number, plan: Partial<any>): Promise<any | undefined> {
    // Se a descrição estiver definida, garantir que não seja vazia
    if (plan.description !== undefined && (!plan.description || plan.description.trim() === '')) {
      throw new Error('A descrição do plano é obrigatória');
    }
    
    const [updatedPlan] = await db.update(plans)
      .set({
        ...plan,
        // Mapear storageLimit se maxStorage foi fornecido
        storageLimit: plan.maxStorage !== undefined ? plan.maxStorage : plan.storageLimit,
        updatedAt: new Date()
      })
      .where(eq(plans.id, id))
      .returning();
      
    if (!updatedPlan) return undefined;
    
    return {
      ...updatedPlan,
      maxStorage: updatedPlan.storageLimit
    };
  }
  
  async deletePlan(id: number): Promise<boolean> {
    try {
      // Primeiro removemos todas as associações com módulos
      await db.delete(planModules)
        .where(eq(planModules.planId, id));
      
      // Depois excluímos o plano
      const result = await db.delete(plans)
        .where(eq(plans.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting plan:", error);
      throw error;
    }
  }
  
  async getModules(): Promise<any[]> {
    return await db.select().from(modules);
  }
  
  async createModule(module: InsertModule): Promise<typeof modules.$inferSelect> {
    const [newModule] = await db.insert(modules)
      .values({
        ...module
      })
      .returning();
    return newModule;
  }
  
  async updateModule(id: number, module: Partial<InsertModule>): Promise<typeof modules.$inferSelect | undefined> {
    const [updatedModule] = await db.update(modules)
      .set({
        ...module
      })
      .where(eq(modules.id, id))
      .returning();
    
    return updatedModule;
  }
  
  async deleteModule(id: number): Promise<boolean> {
    try {
      // Primeiro deletamos as referências em plan_modules
      await db.delete(planModules)
        .where(eq(planModules.moduleId, id));
      
      // Depois deletamos o módulo
      const result = await db.delete(modules)
        .where(eq(modules.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting module:", error);
      throw error;
    }
  }
  
  async updatePlanModules(planId: number, moduleIds: number[]): Promise<boolean> {
    try {
      // Primeiro removemos todos os módulos associados ao plano
      await db.delete(planModules)
        .where(eq(planModules.planId, planId));
      
      // Depois adicionamos os novos módulos
      if (moduleIds.length > 0) {
        await db.insert(planModules)
          .values(
            moduleIds.map(moduleId => ({
              planId,
              moduleId
            }))
          );
      }
      
      return true;
    } catch (error) {
      console.error("Error updating plan modules:", error);
      throw error;
    }
  }
  
  // Module Features methods
  async getModuleFeature(id: number): Promise<typeof moduleFeatures.$inferSelect | undefined> {
    try {
      const [feature] = await db.select()
        .from(moduleFeatures)
        .where(eq(moduleFeatures.id, id));
      
      return feature;
    } catch (error) {
      console.error("Error getting module feature:", error);
      throw error;
    }
  }
  
  async getModuleFeatures(): Promise<typeof moduleFeatures.$inferSelect[]> {
    try {
      return await db.select().from(moduleFeatures);
    } catch (error) {
      console.error("Error getting module features:", error);
      throw error;
    }
  }
  
  async getModuleFeaturesByModule(moduleId: number): Promise<typeof moduleFeatures.$inferSelect[]> {
    try {
      return await db.select()
        .from(moduleFeatures)
        .where(eq(moduleFeatures.moduleId, moduleId));
    } catch (error) {
      console.error("Error getting module features by module:", error);
      throw error;
    }
  }
  
  async createModuleFeature(feature: z.infer<typeof insertModuleFeatureSchema>): Promise<typeof moduleFeatures.$inferSelect> {
    try {
      const [newFeature] = await db.insert(moduleFeatures)
        .values({
          ...feature
        })
        .returning();
      
      return newFeature;
    } catch (error) {
      console.error("Error creating module feature:", error);
      throw error;
    }
  }
  
  async updateModuleFeature(id: number, feature: Partial<z.infer<typeof insertModuleFeatureSchema>>): Promise<typeof moduleFeatures.$inferSelect | undefined> {
    try {
      const [updatedFeature] = await db.update(moduleFeatures)
        .set({
          ...feature
        })
        .where(eq(moduleFeatures.id, id))
        .returning();
      
      return updatedFeature;
    } catch (error) {
      console.error("Error updating module feature:", error);
      throw error;
    }
  }
  
  async deleteModuleFeature(id: number): Promise<boolean> {
    try {
      const result = await db.delete(moduleFeatures)
        .where(eq(moduleFeatures.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting module feature:", error);
      throw error;
    }
  }
  
  async isFeatureAccessible(featurePath: string, tenantId: number): Promise<boolean> {
    try {
      // Obter o tenant
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        console.log(`Tenant não encontrado: ${tenantId}`);
        return false;
      }
      
      // Obter todos os módulos do plano do tenant
      const modules = await this.getModulesByPlan(tenant.planId);
      if (!modules || modules.length === 0) {
        console.log(`Nenhum módulo encontrado para o plano ${tenant.planId} do tenant ${tenantId}`);
        return false;
      }
      
      // Obter os IDs dos módulos
      const moduleIds = modules.map(module => module.id);
      
      // Verificar se existe alguma funcionalidade com o caminho especificado em algum dos módulos disponíveis
      // Utilização de LIKE ou expressão de padrão para verificar se featurePath corresponde
      // a algum padrão de permissão nas funcionalidades disponíveis
      const features = await db.select()
        .from(moduleFeatures)
        .where(eq(moduleFeatures.moduleId, sql`ANY(ARRAY[${moduleIds.join(',')}])`));
      
      // Verificar manualmente se o featurePath corresponde a algum dos padrões de funcionalidades
      // Suporte a padrões como '/api/something/*'
      for (const feature of features) {
        // Converte padrões como '/api/products/*' para expressões regulares
        const pattern = feature.featurePath.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        
        if (regex.test(featurePath)) {
          console.log(`Acesso permitido: ${featurePath} corresponde ao padrão ${feature.featurePath} no módulo ${feature.moduleId}`);
          return true;
        }
      }
      
      console.log(`Acesso negado: ${featurePath} não corresponde a nenhuma funcionalidade disponível para o tenant ${tenantId} no plano ${tenant.planId}`);
      return false;
    } catch (error) {
      console.error("Error checking feature accessibility:", error);
      return false;
    }
  }
  
  async getAllFiles(): Promise<File[]> {
    return await db.select().from(files);
  }
  
  async getStorageInfo(): Promise<{totalFiles: number, totalSizeMB: number}> {
    const allFiles = await this.getAllFiles();
    const totalSizeMB = allFiles.reduce(
      (acc, file) => acc + parseFloat(file.fileSizeMB), 
      0
    );
    
    return {
      totalFiles: allFiles.length,
      totalSizeMB
    };
  }
  
  async getStorageUsageByTenant(): Promise<any[]> {
    const allTenants = await this.getAllTenants();
    const result = [];
    
    for (const tenant of allTenants) {
      const tenantFiles = await this.getFilesByTenant(tenant.id);
      const storageUsed = tenantFiles.reduce(
        (acc, file) => acc + parseFloat(file.fileSizeMB), 
        0
      );
      
      const plan = await this.getPlan(tenant.planId);
      
      result.push({
        id: tenant.id,
        name: tenant.name,
        storageUsed,
        fileCount: tenantFiles.length,
        maxStorage: plan?.storageLimit || 0,
        planName: plan?.name || 'Desconhecido'
      });
    }
    
    return result;
  }
  
  async cleanupUnusedFiles(tenantId: number): Promise<{filesRemoved: number, spaceSaved: number}> {
    const unusedFiles = await db.select()
      .from(files)
      .where(and(
        eq(files.tenantId, tenantId),
        sql`${files.entityId} IS NULL`
      ));
    
    let filesRemoved = 0;
    let spaceSaved = 0;
    
    for (const file of unusedFiles) {
      // Em uma implementação completa, você removeria o arquivo físico aqui
      
      // Remover registro do banco de dados
      const success = await this.deleteFile(file.id, tenantId);
      if (success) {
        filesRemoved++;
        spaceSaved += parseFloat(file.fileSizeMB);
      }
    }
    
    return { filesRemoved, spaceSaved };
  }
}

// Primeiro verificamos se temos um banco de dados configurado
const isDatabaseConfigured = process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;

// Selecionar a implementação correta com base na disponibilidade do banco de dados
export const storage = isDatabaseConfigured 
  ? new DatabaseStorage()
  : new MemStorage();

// Cria tenant e usuário administrador
if (isDatabaseConfigured) {
  (async () => {
    try {
      // Verificar se já existe um tenant admin
      const adminTenant = await storage.getTenantByName("Admin");
      
      if (!adminTenant) {
        // Buscar o plano básico para associar ao tenant admin
        const [basicPlan] = await db.select().from(plans).where(eq(plans.code, "A"));
        
        if (!basicPlan) {
          throw new Error("Plano básico não encontrado. Verifique se a migração de planos foi executada corretamente.");
        }

        // Verificar se já existe um tenant com o CNPJ 00000000000000
        const existingTenant = await db.select()
          .from(tenants)
          .where(eq(tenants.cnpj, "00000000000000"));

        let tenant;
        if (existingTenant && existingTenant.length > 0) {
          // Usar o tenant existente
          tenant = existingTenant[0];
          console.log("Using existing tenant with CNPJ 00000000000000");
        } else {
          // Criar tenant admin
          tenant = await storage.createTenant({
            name: "Admin",
            cnpj: "00000000000000",
            address: "System Address",
            active: true,
            planId: basicPlan.id,
            planStartDate: new Date().toISOString(), // Convertendo para string
            storageUsed: 0
          });
          console.log("Admin tenant created successfully");
        }
        
        // Verificar se já existe um usuário admin para este tenant
        const existingAdmin = await storage.getUserByUsername("admin");
        if (!existingAdmin) {
          // Criar usuário admin
          const hashedPassword = await hashPassword("admin123");
          await storage.createUser({
            username: "admin",
            password: hashedPassword,
            name: "System Administrator",
            role: "admin",
            tenantId: tenant.id,
            active: true
          });
          console.log("Admin user created successfully");
        } else {
          console.log("Admin user already exists");
        }
      } else {
        console.log("Admin tenant already exists");
      }
    } catch (error) {
      console.error("Error creating admin tenant and user:", error);
    }
  })();
}
