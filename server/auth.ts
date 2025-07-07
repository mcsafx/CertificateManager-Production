import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { checkSubscription } from "./middlewares/subscription-check";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "cert-quality-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to false for development
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else if (!user.active) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register a new user
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body against schema
      const parsedBody = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(parsedBody.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Create new user with hashed password
      const user = await storage.createUser({
        ...parsedBody,
        password: await hashPassword(parsedBody.password),
      });

      // Omit password from response
      const { password, ...userWithoutPassword } = user;

      // Login the user
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error, user: SelectUser, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Verificar status da assinatura do tenant
        let tenantStatus = null;
        let adminContact = null;
        
        if (user.tenantId && user.role !== 'admin') {
          const tenant = await storage.getTenant(user.tenantId);
          
          if (tenant && tenant.paymentStatus === 'overdue') {
            // Quando a assinatura está vencida, buscar informações de contato do admin
            const adminTenant = await storage.getTenant(1); // ID 1 é o tenant admin
            
            tenantStatus = {
              status: 'overdue',
              message: 'Assinatura vencida. Algumas funcionalidades estarão bloqueadas.',
              contactInfo: adminTenant ? {
                name: adminTenant.name,
                phone: adminTenant.phone || 'Não disponível',
                address: adminTenant.address || 'Não disponível'
              } : null
            };
          } else if (tenant && tenant.paymentStatus === 'pending') {
            tenantStatus = {
              status: 'pending',
              message: 'Assinatura prestes a vencer. Por favor, renove em breve.'
            };
          }
        }
        
        // Omit password from response
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({
          ...userWithoutPassword,
          tenantStatus
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Omit password from response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware para verificar autenticação e status da assinatura
export function isAuthenticatedWithSubscription(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    // Verifica status da assinatura
    return checkSubscription(req, res, next);
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && (req.user as SelectUser).role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

// Middleware to check if user belongs to tenant
export function isTenantMember(tenantId: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user as SelectUser).tenantId === tenantId) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };
}

// Middleware to check if user is tenant admin
export function isTenantAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && 
      ((req.user as SelectUser).role === "admin" || (req.user as SelectUser).role === "admin_tenant")) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}
