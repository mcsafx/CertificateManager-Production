# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `npm run dev` - Start development server (runs on port 5000)
- `npm run build` - Build for production using Vite + esbuild
- `npm run start` - Run production build with NODE_ENV=production
- `npm run check` - TypeScript type checking
- `npm run db:push` - Apply database schema changes with Drizzle Kit

### Database Management
- Database migrations are in `/migrations/` directory
- Database configuration in `server/db.ts` using Drizzle ORM with PostgreSQL
- Schema definitions in `shared/schema.ts`
- **Important**: When migrating from Replit, replace `@neondatabase/serverless` with `pg` and update `server/db.ts`

### Environment Configuration
- Default environment variables needed:
  ```env
  DATABASE_URL="postgresql://appuser:DevLocal2024@localhost:5432/tenant_management_db"
  NODE_ENV=development
  PORT=5000
  SESSION_SECRET="local-dev-secret-2024"
  VITE_API_URL=http://localhost:5000
  NODE_OPTIONS="--max-old-space-size=512"
  ```

## Architecture Overview

### Multi-Tenant SaaS Certificate Management System
This is a comprehensive multi-tenant SaaS platform for quality certificate management in the chemical distribution industry, featuring modular architecture and subscription-based access control.

**Domain Context**: Chemical quality management system for distributors handling safety certificates, analysis bulletins, and traceability requirements with compliance focus.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Passport.js with local strategy + Express sessions
- **UI Components**: Radix UI primitives with shadcn/ui

### Key Architectural Components

#### Multi-Tenancy System
- Complete tenant isolation with `tenantId` on all domain entities
- Subscription-based access with three plan tiers:
  - **Plan A (Basic)**: R$ 99,90/month, 1GB storage, 5 users
  - **Plan B (Intermediate)**: R$ 199,90/month, 5GB storage, 15 users  
  - **Plan C (Complete)**: R$ 399,90/month, 20GB storage, 50 users
- Storage limits and user limits enforced per tenant
- Automatic subscription status checking via `subscriptionManager`
- Payment status tracking (active, pending, overdue)

#### Module & Feature System
- Granular feature control via `modules`, `moduleFeatures`, and `planModules` tables
- Feature gates implemented via `FeatureGate` and `FeatureProtectedRoute` components
- Route-based feature access patterns (e.g., `/api/products/*`)
- Admin interface for managing module-feature assignments

**Available Modules:**
- `core` - Dashboard, users, basic settings (essential module)
- `products` - Product and category management
- `certificates` - Basic certificate issuance and **NFe XML import**
- `certificates_advanced` - Digital signature certificates
- `multi_user` - Advanced user management
- `traceability` - End-to-end tracking
- `settings` - Advanced configurations
- `reports` - Custom reporting
- `integrations` - APIs and webhooks

**NFe Import System Access:**
- **Available for**: All plan tiers (A, B, C)
- **Module**: `certificates` (basic certificates module)
- **Feature Path**: `/api/nfe/*`
- **Functionality**: Complete NFe XML import with automatic certificate generation
- **Decision Rationale**: NFe import provides core value for all users, encouraging platform adoption

#### Security & Middleware
- Authentication middleware setup in `server/auth.ts`
- Subscription checking middleware at `server/middlewares/subscription-check.ts`
- Feature access control at `server/middlewares/feature-access.ts`
- Storage limits enforced via `server/middlewares/storage-limits.ts`

### Core Domain Models

#### Product Hierarchy
- `productCategories` → `productSubcategories` → `productBase` → `products` (variants)
- Product base contains shared technical information and safety classifications
- Product variants hold specific SKUs, weights, and specifications
- File attachments supported for both base products and variants

#### Certificate Workflow
- `entryCertificates` - Quality certificates from suppliers
- `entryCertificateResults` - Test results and quality metrics
- `issuedCertificates` - Certificates issued to clients
- **NFe import system** - Automatic certificate generation from NFe XML
- PDF generation using `pdfGenerator.ts` and `html2pdfGenerator.ts`

#### File Management
- Centralized file handling via `files` table with tenant isolation
- Upload service at `server/services/file-upload.ts`
- Storage tracking for subscription limit enforcement

### Frontend Architecture

#### Component Organization
- `/components/ui/` - Base UI components (shadcn/ui)
- `/components/certificates/` - Certificate-specific components
- `/components/products/` - Product management components
- `/components/layout/` - Layout and navigation components

#### State Management
- TanStack Query for server state management
- React Hook Form for form handling with Zod validation
- Custom hooks in `/hooks/` for feature access and authentication

#### Routing & Protection
- Wouter for client-side routing
- `AdminRoute` for admin-only pages
- `FeatureProtectedRoute` for feature-gated pages
- `ProtectedRoute` for authenticated pages

### Database Schema Key Points
- All domain entities include `tenantId` for isolation
- `plans` define subscription tiers with storage and user limits
- Module system allows fine-grained feature control
- **NFe import system** with tracking and product mapping preferences
- Comprehensive audit trail via timestamps and status fields

### Development Patterns

#### Adding New Features
1. Define feature path in `moduleFeatures` table
2. Create protected components using `FeatureGate`
3. Implement API routes with feature access middleware
4. Add to appropriate plan modules for access control

#### Working with Multi-Tenancy
- Always filter queries by `req.user.tenantId`
- Use `tenantId` in all data validation schemas
- Test with different tenant contexts

#### File Upload Workflow
- Use `server/services/file-upload.ts` for handling uploads
- Update tenant storage usage tracking
- Respect file size limits based on subscription

### Environment Setup
- Requires `DATABASE_URL` for PostgreSQL connection
- Session management needs `SESSION_SECRET`
- Runs on port 5000 by default (configurable)
- Development mode enables Vite integration

### Testing & Quality
- TypeScript strict mode enabled
- Zod schemas for all data validation
- Component-based architecture for maintainability
- Clear separation of concerns between client and server

## Deployment & Migration

### Replit to Production Migration Pattern
This system was originally designed for Replit and requires specific adaptations for local/VPS deployment:

1. **Database Migration**: Replace `@neondatabase/serverless` with `pg` in package.json
2. **Configuration**: Update `server/db.ts` to use node-postgres instead of Neon serverless
3. **Environment Setup**: Add `dotenv` configuration and create `.env` file
4. **Dependencies**: Install PostgreSQL locally and configure authentication

### Standard Deployment Commands
```bash
# Fresh installation setup
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib

# Database setup
sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'DevLocal2024';"
sudo -u postgres psql -c "CREATE DATABASE tenant_management_db OWNER appuser;"

# Project setup
npm install
npm run db:push
npm run build  # for production
npm run dev    # for development
```

### Production Considerations
- Use PM2 for process management in production
- Configure Nginx as reverse proxy for port 80/443
- Set up PostgreSQL with proper authentication (`.pgpass` file)
- Monitor storage usage per tenant for subscription compliance
- Implement regular database backups

## Development Guidelines

### Code Style Preferences (Magnus/Developer Profile)
- **Explanation Level**: Clear technical explanations with practical analogies
- **Code Style**: "Copy-paste" functional level with inline comments
- **Detail Level**: Step-by-step instructions with verification steps
- **Focus**: Practical solutions over extensive theory

### Working with Feature Gates
```tsx
// Protect a component
<FeatureGate featurePath="products/create">
  <CreateProductButton />
</FeatureGate>

// Protect a route
<FeatureProtectedRoute 
  path="/products/create" 
  component={CreateProductPage}
  featurePath="products/create"
/>
```

### Multi-Tenant Development Patterns
- Always filter database queries by `req.user.tenantId`
- Include `tenantId` in all data validation schemas
- Test features across different subscription plans
- Respect storage and user limits per tenant
- Consider performance impact of tenant isolation

### Common Issues & Solutions
- **Database Connection**: Ensure PostgreSQL is running and `.pgpass` is configured
- **Port Conflicts**: Use `lsof -i :5000` to check port usage
- **Permission Errors**: Verify database user privileges with `GRANT ALL`
- **Memory Issues**: Set `NODE_OPTIONS="--max-old-space-size=512"` for low-memory systems
- **Feature Access**: Debug using Feature Gates in debug mode

### Chemical Industry Domain Knowledge
- System handles safety data sheets (FISPQ/SDS)
- Manages product classifications (risk classes, UN numbers, packaging groups)
- Tracks supplier certificates and analysis results
- Generates compliance certificates for clients
- Maintains chain of custody for chemical products