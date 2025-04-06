import { User, InsertUser, Tenant, InsertTenant, Product, InsertProduct, 
         ProductCharacteristic, InsertProductCharacteristic, Supplier, 
         InsertSupplier, Manufacturer, InsertManufacturer, Client, 
         InsertClient, EntryCertificate, InsertEntryCertificate, 
         EntryCertificateResult, InsertEntryCertificateResult, 
         IssuedCertificate, InsertIssuedCertificate } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

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

  // Products
  getProduct(id: number, tenantId: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, tenantId: number, product: Partial<Product>): Promise<Product | undefined>;
  getProductsByTenant(tenantId: number): Promise<Product[]>;
  deleteProduct(id: number, tenantId: number): Promise<boolean>;

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

  // Session Store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tenants: Map<number, Tenant>;
  private products: Map<number, Product>;
  private productCharacteristics: Map<number, ProductCharacteristic>;
  private suppliers: Map<number, Supplier>;
  private manufacturers: Map<number, Manufacturer>;
  private clients: Map<number, Client>;
  private entryCertificates: Map<number, EntryCertificate>;
  private entryCertificateResults: Map<number, EntryCertificateResult>;
  private issuedCertificates: Map<number, IssuedCertificate>;
  
  private userIdCounter: number;
  private tenantIdCounter: number;
  private productIdCounter: number;
  private characteristicIdCounter: number;
  private supplierIdCounter: number;
  private manufacturerIdCounter: number;
  private clientIdCounter: number;
  private entryCertificateIdCounter: number;
  private resultIdCounter: number;
  private issuedCertificateIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.tenants = new Map();
    this.products = new Map();
    this.productCharacteristics = new Map();
    this.suppliers = new Map();
    this.manufacturers = new Map();
    this.clients = new Map();
    this.entryCertificates = new Map();
    this.entryCertificateResults = new Map();
    this.issuedCertificates = new Map();
    
    this.userIdCounter = 1;
    this.tenantIdCounter = 1;
    this.productIdCounter = 1;
    this.characteristicIdCounter = 1;
    this.supplierIdCounter = 1;
    this.manufacturerIdCounter = 1;
    this.clientIdCounter = 1;
    this.entryCertificateIdCounter = 1;
    this.resultIdCounter = 1;
    this.issuedCertificateIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create a default tenant and admin user
    this.createTenant({
      name: "Admin",
      cnpj: "00000000000000",
      address: "System Address",
      active: true
    }).then(tenant => {
      this.createUser({
        username: "admin",
        password: "admin123", // This will be hashed before storage in auth.ts
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
    const newUser: User = { ...user, id };
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
    const newTenant: Tenant = { ...tenant, id };
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

  // Product methods
  async getProduct(id: number, tenantId: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (product && product.tenantId === tenantId) {
      return product;
    }
    return undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = { ...product, id };
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
    const newCharacteristic: ProductCharacteristic = { ...characteristic, id };
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
    const newSupplier: Supplier = { ...supplier, id };
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
    const newClient: Client = { ...client, id };
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
      enteredAt: new Date() 
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
    const newResult: EntryCertificateResult = { ...result, id };
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
    const newCertificate: IssuedCertificate = { ...certificate, id };
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
}

export const storage = new MemStorage();
