import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isTenantMember } from "./auth";
import { z } from "zod";
import { 
  insertProductSchema, insertProductCharacteristicSchema, 
  insertSupplierSchema, insertManufacturerSchema, 
  insertClientSchema, insertEntryCertificateSchema,
  insertEntryCertificateResultSchema, insertIssuedCertificateSchema,
  insertTenantSchema, insertPackageTypeSchema,
  insertProductCategorySchema, insertProductSubcategorySchema,
  insertProductBaseSchema, insertProductFileSchema, insertProductBaseFileSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Rotas para visualização e download de arquivos
  app.get("/api/files/view/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const fileId = Number(req.params.id);
      const fileType = req.query.type as string;
      
      let file;
      if (fileType === 'base') {
        file = await storage.getProductBaseFile(fileId, user.tenantId);
      } else {
        file = await storage.getProductFile(fileId, user.tenantId);
      }
      
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Em um ambiente de produção real, você anexaria o arquivo real aqui
      // Para este exemplo, redirecionamos para o fileUrl (que em produção seria um URL válido)
      if (file.fileUrl && file.fileUrl.startsWith('http')) {
        return res.redirect(file.fileUrl);
      }
      
      // Para arquivos em base64 ou caminhos relativos, exibimos uma página HTML simples
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${file.fileName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .file-info { margin: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .file-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .file-desc { color: #666; margin-bottom: 20px; }
            .message { color: #333; background: #f5f5f5; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="file-info">
            <div class="file-name">${file.fileName}</div>
            <div class="file-desc">${file.description || 'Sem descrição'}</div>
            <div class="message">
              Este é um ambiente de demonstração.<br>
              Em produção, o arquivo seria exibido aqui.
            </div>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/files/download/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const fileId = Number(req.params.id);
      const fileType = req.query.type as string;
      
      let file;
      if (fileType === 'base') {
        file = await storage.getProductBaseFile(fileId, user.tenantId);
      } else {
        file = await storage.getProductFile(fileId, user.tenantId);
      }
      
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Em um ambiente de produção real, você enviaria o arquivo real aqui
      // Para este exemplo, enviamos um PDF ou texto de exemplo
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      
      if (file.fileType && file.fileType.includes('pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        // Enviamos um PDF de exemplo (texto que indica que é apenas um exemplo)
        res.send(Buffer.from('%PDF-1.5\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 500 800] /Contents 6 0 R >>\nendobj\n4 0 obj\n<< /Font << /F1 5 0 R >> >>\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n6 0 obj\n<< /Length 68 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(ARQUIVO DE EXEMPLO - CERTQUALITY) Tj\nET\nendstream\nendobj\nxref\n0 7\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000216 00000 n\n0000000259 00000 n\n0000000326 00000 n\ntrailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n444\n%%EOF'));
      } else {
        res.setHeader('Content-Type', 'text/plain');
        res.send(`Este é um arquivo de exemplo do CertQuality.
        
Nome do arquivo: ${file.fileName}
Descrição: ${file.description || 'Sem descrição'}
Tipo: ${file.fileType || 'Não especificado'}
Tamanho: ${file.fileSize || 'Não especificado'}

Em um ambiente de produção, este seria o conteúdo real do arquivo.`);
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Package Types routes
  app.get("/api/package-types", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageTypes = await storage.getPackageTypesByTenant(user.tenantId);
      res.json(packageTypes);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/package-types", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertPackageTypeSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const packageType = await storage.createPackageType(parsedBody);
      res.status(201).json(packageType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });
  
  app.get("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageType = await storage.getPackageType(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!packageType) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.json(packageType);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageType = await storage.updatePackageType(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!packageType) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.json(packageType);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deletePackageType(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Tenant routes (for admin)
  app.get("/api/tenants", isAdmin, async (req, res, next) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tenants", isAdmin, async (req, res, next) => {
    try {
      const parsedBody = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(parsedBody);
      res.status(201).json(tenant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/tenants/:id", isAdmin, async (req, res, next) => {
    try {
      const tenant = await storage.getTenant(Number(req.params.id));
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tenants/:id", isAdmin, async (req, res, next) => {
    try {
      const tenant = await storage.updateTenant(Number(req.params.id), req.body);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });

  // User routes (for admins and tenant admins)
  app.get("/api/users", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      let users;
      
      if (user.role === "admin") {
        // Admin can see all users from any tenant
        if (req.query.tenantId) {
          users = await storage.getUsersByTenant(Number(req.query.tenantId));
        } else {
          // Get users from all tenants
          const tenants = await storage.getAllTenants();
          users = [];
          for (const tenant of tenants) {
            const tenantUsers = await storage.getUsersByTenant(tenant.id);
            users.push(...tenantUsers);
          }
        }
      } else {
        // Regular users can only see users from their own tenant
        users = await storage.getUsersByTenant(user.tenantId);
      }
      
      // Remove passwords from the response
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  // Product Categories routes
  app.get("/api/product-categories", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const categories = await storage.getProductCategoriesByTenant(user.tenantId);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/product-categories", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductCategorySchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const category = await storage.createProductCategory(parsedBody);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/product-categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const category = await storage.getProductCategory(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/product-categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const category = await storage.updateProductCategory(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductCategory(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Product Subcategories routes
  app.get("/api/product-subcategories", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      
      let subcategories;
      if (categoryId) {
        subcategories = await storage.getProductSubcategoriesByCategory(categoryId, user.tenantId);
      } else {
        subcategories = await storage.getProductSubcategoriesByTenant(user.tenantId);
      }
      
      res.json(subcategories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/product-subcategories", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductSubcategorySchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const subcategory = await storage.createProductSubcategory(parsedBody);
      res.status(201).json(subcategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/product-subcategories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const subcategory = await storage.getProductSubcategory(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      
      res.json(subcategory);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/product-subcategories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const subcategory = await storage.updateProductSubcategory(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      
      res.json(subcategory);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-subcategories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductSubcategory(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Product Base routes
  app.get("/api/product-base", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const subcategoryId = req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined;
      
      let productBases;
      if (subcategoryId) {
        productBases = await storage.getProductBasesBySubcategory(subcategoryId, user.tenantId);
      } else {
        productBases = await storage.getProductBasesByTenant(user.tenantId);
      }
      
      res.json(productBases);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/product-base", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductBaseSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const productBase = await storage.createProductBase(parsedBody);
      res.status(201).json(productBase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/product-base/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const productBase = await storage.getProductBase(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!productBase) {
        return res.status(404).json({ message: "Product base not found" });
      }
      
      res.json(productBase);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/product-base/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const productBase = await storage.updateProductBase(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!productBase) {
        return res.status(404).json({ message: "Product base not found" });
      }
      
      res.json(productBase);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-base/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductBase(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Product base not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Product Files routes
  app.post("/api/product-files", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductFileSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const productFile = await storage.createProductFile(parsedBody);
      res.status(201).json(productFile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/products/:productId/files", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const files = await storage.getProductFilesByProduct(
        Number(req.params.productId), 
        user.tenantId
      );
      
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-files/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductFile(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Product file not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Product Base Files routes
  app.post("/api/product-base-files", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductBaseFileSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const productBaseFile = await storage.createProductBaseFile(parsedBody);
      res.status(201).json(productBaseFile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/product-base/:baseProductId/files", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const files = await storage.getProductBaseFilesByBaseProduct(
        Number(req.params.baseProductId), 
        user.tenantId
      );
      
      res.json(files);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/product-base/:baseProductId/files/:category", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const files = await storage.getProductBaseFilesByCategory(
        Number(req.params.baseProductId),
        req.params.category,
        user.tenantId
      );
      
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-base-files/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductBaseFile(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Product base file not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Products routes (modificado para variantes de produtos)
  app.get("/api/products", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const baseProductId = req.query.baseProductId ? Number(req.query.baseProductId) : undefined;
      
      let products;
      if (baseProductId) {
        products = await storage.getProductsByBase(baseProductId, user.tenantId);
      } else {
        products = await storage.getProductsByTenant(user.tenantId);
      }
      
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const product = await storage.createProduct(parsedBody);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const product = await storage.getProduct(Number(req.params.id), user.tenantId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get product characteristics
      const characteristics = await storage.getCharacteristicsByProduct(product.id, user.tenantId);
      
      res.json({ ...product, characteristics });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const product = await storage.updateProduct(Number(req.params.id), user.tenantId, req.body);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProduct(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Product Characteristics routes
  app.post("/api/product-characteristics", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertProductCharacteristicSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const characteristic = await storage.createProductCharacteristic(parsedBody);
      res.status(201).json(characteristic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/products/:productId/characteristics", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const characteristics = await storage.getCharacteristicsByProduct(
        Number(req.params.productId), 
        user.tenantId
      );
      
      res.json(characteristics);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/product-characteristics", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const productId = req.query.productId ? Number(req.query.productId) : undefined;
      
      let characteristics;
      if (productId) {
        characteristics = await storage.getCharacteristicsByProduct(productId, user.tenantId);
      } else {
        // Return all characteristics (could be limited to a tenant)
        // Implementation depends on business requirements
        characteristics = [];
      }
      
      res.json(characteristics);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/product-characteristics/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const characteristic = await storage.updateProductCharacteristic(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!characteristic) {
        return res.status(404).json({ message: "Characteristic not found" });
      }
      
      res.json(characteristic);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/product-characteristics/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteProductCharacteristic(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!success) {
        return res.status(404).json({ message: "Characteristic not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const suppliers = await storage.getSuppliersByTenant(user.tenantId);
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertSupplierSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const supplier = await storage.createSupplier(parsedBody);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/suppliers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const supplier = await storage.getSupplier(Number(req.params.id), user.tenantId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/suppliers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const supplier = await storage.updateSupplier(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/suppliers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteSupplier(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Manufacturers routes
  app.get("/api/manufacturers", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const manufacturers = await storage.getManufacturersByTenant(user.tenantId);
      res.json(manufacturers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/manufacturers", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertManufacturerSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const manufacturer = await storage.createManufacturer(parsedBody);
      res.status(201).json(manufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/manufacturers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const manufacturer = await storage.getManufacturer(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      
      res.json(manufacturer);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/manufacturers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const manufacturer = await storage.updateManufacturer(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      
      res.json(manufacturer);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/manufacturers/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteManufacturer(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!success) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Clients routes
  app.get("/api/clients", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const clients = await storage.getClientsByTenant(user.tenantId);
      res.json(clients);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertClientSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const client = await storage.createClient(parsedBody);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const client = await storage.getClient(Number(req.params.id), user.tenantId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const client = await storage.updateClient(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deleteClient(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Entry Certificate routes
  app.get("/api/entry-certificates", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      // Extract filter parameters
      const filters: Record<string, any> = {};
      const filterFields = [
        'productId', 'supplierId', 'manufacturerId', 
        'internalLot', 'referenceDocument', 'startDate', 'endDate'
      ];
      
      filterFields.forEach(field => {
        if (req.query[field]) {
          filters[field] = req.query[field];
        }
      });
      
      const certificates = await storage.getEntryCertificatesByTenant(user.tenantId, filters);
      
      // Enhance response with related data
      const enhancedCertificates = await Promise.all(certificates.map(async (cert) => {
        const [product, supplier, manufacturer, results] = await Promise.all([
          storage.getProduct(cert.productId, user.tenantId),
          storage.getSupplier(cert.supplierId, user.tenantId),
          storage.getManufacturer(cert.manufacturerId, user.tenantId),
          storage.getResultsByEntryCertificate(cert.id, user.tenantId)
        ]);
        
        return {
          ...cert,
          productName: product?.technicalName,
          supplierName: supplier?.name,
          manufacturerName: manufacturer?.name,
          results
        };
      }));
      
      res.json(enhancedCertificates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/entry-certificates", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      // Parse and validate certificate data
      const certificateData = insertEntryCertificateSchema.parse({
        ...req.body.certificate,
        tenantId: user.tenantId
      });
      
      // Create certificate
      const certificate = await storage.createEntryCertificate(certificateData);
      
      // Handle results if provided
      if (req.body.results && Array.isArray(req.body.results)) {
        const resultsPromises = req.body.results.map(result => {
          const resultData = insertEntryCertificateResultSchema.parse({
            ...result,
            entryCertificateId: certificate.id,
            tenantId: user.tenantId
          });
          
          return storage.createEntryCertificateResult(resultData);
        });
        
        await Promise.all(resultsPromises);
      }
      
      // Get the complete certificate with results
      const completeData = {
        ...certificate,
        results: await storage.getResultsByEntryCertificate(certificate.id, user.tenantId)
      };
      
      res.status(201).json(completeData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/entry-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificate = await storage.getEntryCertificate(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Get certificate results
      const results = await storage.getResultsByEntryCertificate(
        certificate.id, 
        user.tenantId
      );
      
      // Get related entities
      const [product, supplier, manufacturer] = await Promise.all([
        storage.getProduct(certificate.productId, user.tenantId),
        storage.getSupplier(certificate.supplierId, user.tenantId),
        storage.getManufacturer(certificate.manufacturerId, user.tenantId)
      ]);
      
      res.json({
        ...certificate,
        results,
        product,
        supplier,
        manufacturer
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/entry-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificateId = Number(req.params.id);
      
      // Update certificate
      const certificate = await storage.updateEntryCertificate(
        certificateId, 
        user.tenantId, 
        req.body.certificate || {}
      );
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Handle results update if provided
      if (req.body.results && Array.isArray(req.body.results)) {
        // Delete existing results that are not in the new set
        const existingResults = await storage.getResultsByEntryCertificate(
          certificateId, 
          user.tenantId
        );
        
        const newResultIds = req.body.results
          .filter(r => r.id)
          .map(r => r.id);
        
        for (const result of existingResults) {
          if (!newResultIds.includes(result.id)) {
            await storage.deleteEntryCertificateResult(result.id, user.tenantId);
          }
        }
        
        // Update or create results
        for (const result of req.body.results) {
          if (result.id) {
            // Update existing result
            await storage.updateEntryCertificateResult(
              result.id, 
              user.tenantId, 
              {
                ...result,
                entryCertificateId: certificateId,
                tenantId: user.tenantId
              }
            );
          } else {
            // Create new result
            await storage.createEntryCertificateResult({
              ...result,
              entryCertificateId: certificateId,
              tenantId: user.tenantId
            });
          }
        }
      }
      
      // Get the complete updated certificate with results
      const updatedResults = await storage.getResultsByEntryCertificate(
        certificateId, 
        user.tenantId
      );
      
      res.json({
        ...certificate,
        results: updatedResults
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/entry-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificateId = Number(req.params.id);
      
      // Delete associated results first
      const results = await storage.getResultsByEntryCertificate(
        certificateId, 
        user.tenantId
      );
      
      for (const result of results) {
        await storage.deleteEntryCertificateResult(result.id, user.tenantId);
      }
      
      // Now delete the certificate
      const success = await storage.deleteEntryCertificate(certificateId, user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Issued Certificate routes
  app.get("/api/issued-certificates", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      // Extract filter parameters
      const filters: Record<string, any> = {};
      const filterFields = [
        'clientId', 'entryCertificateId', 'invoiceNumber', 
        'customLot', 'startDate', 'endDate'
      ];
      
      filterFields.forEach(field => {
        if (req.query[field]) {
          filters[field] = req.query[field];
        }
      });
      
      const certificates = await storage.getIssuedCertificatesByTenant(user.tenantId, filters);
      
      // Enhance response with related data
      const enhancedCertificates = await Promise.all(certificates.map(async (cert) => {
        const [entryCertificate, client] = await Promise.all([
          storage.getEntryCertificate(cert.entryCertificateId, user.tenantId),
          storage.getClient(cert.clientId, user.tenantId)
        ]);
        
        let product;
        if (entryCertificate) {
          product = await storage.getProduct(entryCertificate.productId, user.tenantId);
        }
        
        return {
          ...cert,
          clientName: client?.name,
          productName: product?.technicalName,
          internalLot: entryCertificate?.internalLot
        };
      }));
      
      res.json(enhancedCertificates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/issued-certificates", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      
      // Parse and validate certificate data
      const certificateData = insertIssuedCertificateSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      // Create issued certificate
      const certificate = await storage.createIssuedCertificate(certificateData);
      
      // Get related entities for complete response
      const [entryCertificate, client] = await Promise.all([
        storage.getEntryCertificate(certificate.entryCertificateId, user.tenantId),
        storage.getClient(certificate.clientId, user.tenantId)
      ]);
      
      let product;
      if (entryCertificate) {
        product = await storage.getProduct(entryCertificate.productId, user.tenantId);
      }
      
      res.status(201).json({
        ...certificate,
        entryCertificate,
        client,
        product
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/issued-certificates/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const certificate = await storage.getIssuedCertificate(
        Number(req.params.id), 
        user.tenantId
      );
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Get related entities
      const [entryCertificate, client] = await Promise.all([
        storage.getEntryCertificate(certificate.entryCertificateId, user.tenantId),
        storage.getClient(certificate.clientId, user.tenantId)
      ]);
      
      // Enhance response data
      let product = null;
      let supplier = null;
      let manufacturer = null;
      let results = [];
      
      if (entryCertificate) {
        // Get entry certificate results
        results = await storage.getResultsByEntryCertificate(entryCertificate.id, user.tenantId);
        
        // Get product, supplier and manufacturer info in parallel
        [product, supplier, manufacturer] = await Promise.all([
          storage.getProduct(entryCertificate.productId, user.tenantId),
          storage.getSupplier(entryCertificate.supplierId, user.tenantId),
          storage.getManufacturer(entryCertificate.manufacturerId, user.tenantId)
        ]);
      }
      
      // Prepare enhanced response
      res.json({
        ...certificate,
        clientName: client?.name,
        productName: product?.technicalName,
        entryCertificate: {
          ...entryCertificate,
          supplierName: supplier?.name,
          manufacturerName: manufacturer?.name,
          productName: product?.technicalName,
          results
        },
        client
      });
    } catch (error) {
      next(error);
    }
  });

  // Traceability routes
  app.get("/api/traceability/:internalLot", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const { internalLot } = req.params;
      
      // Find entry certificate by internal lot
      const allCertificates = await storage.getEntryCertificatesByTenant(user.tenantId);
      const entryCertificate = allCertificates.find(c => c.internalLot === internalLot);
      
      if (!entryCertificate) {
        return res.status(404).json({ message: "Internal lot not found" });
      }
      
      // Get all issued certificates for this entry certificate
      const issuedCertificates = await storage.getIssuedCertificatesByEntryCertificate(
        entryCertificate.id,
        user.tenantId
      );
      
      // Get related entities
      const [product, supplier, manufacturer] = await Promise.all([
        storage.getProduct(entryCertificate.productId, user.tenantId),
        storage.getSupplier(entryCertificate.supplierId, user.tenantId),
        storage.getManufacturer(entryCertificate.manufacturerId, user.tenantId)
      ]);
      
      // Get client info for issued certificates
      const enhancedIssuedCertificates = await Promise.all(issuedCertificates.map(async cert => {
        const client = await storage.getClient(cert.clientId, user.tenantId);
        return {
          ...cert,
          clientName: client?.name
        };
      }));
      
      // Calculate remaining quantity
      const receivedQuantity = Number(entryCertificate.receivedQuantity);
      const soldQuantity = enhancedIssuedCertificates.reduce(
        (sum, cert) => sum + Number(cert.soldQuantity), 
        0
      );
      const remainingQuantity = receivedQuantity - soldQuantity;
      
      res.json({
        entryCertificate: {
          ...entryCertificate,
          productName: product?.technicalName,
          supplierName: supplier?.name,
          manufacturerName: manufacturer?.name
        },
        issuedCertificates: enhancedIssuedCertificates,
        summary: {
          receivedQuantity,
          soldQuantity,
          remainingQuantity,
          measureUnit: entryCertificate.measureUnit
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Package Types routes
  app.get("/api/package-types", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageTypes = await storage.getPackageTypesByTenant(user.tenantId);
      res.json(packageTypes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/package-types", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const parsedBody = insertPackageTypeSchema.parse({
        ...req.body,
        tenantId: user.tenantId
      });
      
      const packageType = await storage.createPackageType(parsedBody);
      res.status(201).json(packageType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageType = await storage.getPackageType(Number(req.params.id), user.tenantId);
      
      if (!packageType) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.json(packageType);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const packageType = await storage.updatePackageType(
        Number(req.params.id), 
        user.tenantId, 
        req.body
      );
      
      if (!packageType) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.json(packageType);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/package-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user!;
      const success = await storage.deletePackageType(Number(req.params.id), user.tenantId);
      
      if (!success) {
        return res.status(404).json({ message: "Package type not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
