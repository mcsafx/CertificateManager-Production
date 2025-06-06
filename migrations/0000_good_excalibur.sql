CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cnpj" text NOT NULL,
	"phone" text,
	"address" text,
	"internal_code" text,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_certificate_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_certificate_id" integer NOT NULL,
	"characteristic_name" text NOT NULL,
	"unit" text NOT NULL,
	"min_value" text,
	"max_value" text,
	"obtained_value" text NOT NULL,
	"analysis_method" text,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"reference_document" text NOT NULL,
	"entry_date" date NOT NULL,
	"entered_at" timestamp DEFAULT now() NOT NULL,
	"product_id" integer NOT NULL,
	"received_quantity" numeric NOT NULL,
	"measure_unit" text NOT NULL,
	"package_type" text NOT NULL,
	"conversion_factor" numeric,
	"supplier_lot" text NOT NULL,
	"manufacturing_date" date NOT NULL,
	"inspection_date" date NOT NULL,
	"expiration_date" date NOT NULL,
	"internal_lot" text NOT NULL,
	"status" text NOT NULL,
	"original_file_url" text,
	"original_file_name" text,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"stored_file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_size_mb" numeric NOT NULL,
	"file_type" text NOT NULL,
	"file_category" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"file_path" text NOT NULL,
	"public_url" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issued_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_certificate_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"issue_date" date NOT NULL,
	"sold_quantity" numeric NOT NULL,
	"measure_unit" text NOT NULL,
	"custom_lot" text NOT NULL,
	"tenant_id" integer NOT NULL,
	"show_supplier_info" boolean DEFAULT false,
	"observations" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"feature_path" text NOT NULL,
	"feature_name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_core" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "package_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tenant_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric NOT NULL,
	"storage_limit" integer NOT NULL,
	"max_users" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "product_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"technical_name" text NOT NULL,
	"commercial_name" text,
	"description" text,
	"subcategory_id" integer NOT NULL,
	"internal_code" text,
	"default_measure_unit" text NOT NULL,
	"risk_class" text,
	"risk_number" text,
	"un_number" text,
	"packaging_group" text,
	"tenant_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_base_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_product_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"file_category" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tenant_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_characteristics" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"min_value" numeric,
	"max_value" numeric,
	"analysis_method" text,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"tenant_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_product_id" integer NOT NULL,
	"sku" text,
	"technical_name" text NOT NULL,
	"commercial_name" text,
	"internal_code" text,
	"default_measure_unit" text NOT NULL,
	"conversion_factor" numeric,
	"net_weight" numeric,
	"gross_weight" numeric,
	"specifications" jsonb,
	"tenant_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cnpj" text NOT NULL,
	"phone" text,
	"address" text,
	"internal_code" text,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cnpj" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"logo_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"plan_id" integer NOT NULL,
	"storage_used" integer DEFAULT 0 NOT NULL,
	"plan_start_date" date,
	"plan_end_date" date,
	"last_payment_date" date,
	"next_payment_date" date,
	"payment_status" text DEFAULT 'active',
	CONSTRAINT "tenants_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"tenant_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_certificate_results" ADD CONSTRAINT "entry_certificate_results_entry_certificate_id_entry_certificates_id_fk" FOREIGN KEY ("entry_certificate_id") REFERENCES "public"."entry_certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_certificate_results" ADD CONSTRAINT "entry_certificate_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_certificates" ADD CONSTRAINT "entry_certificates_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_certificates" ADD CONSTRAINT "entry_certificates_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_certificates" ADD CONSTRAINT "entry_certificates_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_certificates" ADD CONSTRAINT "entry_certificates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_certificates" ADD CONSTRAINT "issued_certificates_entry_certificate_id_entry_certificates_id_fk" FOREIGN KEY ("entry_certificate_id") REFERENCES "public"."entry_certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_certificates" ADD CONSTRAINT "issued_certificates_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_certificates" ADD CONSTRAINT "issued_certificates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_features" ADD CONSTRAINT "module_features_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_types" ADD CONSTRAINT "package_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_modules" ADD CONSTRAINT "plan_modules_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_modules" ADD CONSTRAINT "plan_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_base" ADD CONSTRAINT "product_base_subcategory_id_product_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."product_subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_base" ADD CONSTRAINT "product_base_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_base_files" ADD CONSTRAINT "product_base_files_base_product_id_product_base_id_fk" FOREIGN KEY ("base_product_id") REFERENCES "public"."product_base"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_base_files" ADD CONSTRAINT "product_base_files_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_characteristics" ADD CONSTRAINT "product_characteristics_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_characteristics" ADD CONSTRAINT "product_characteristics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_subcategories" ADD CONSTRAINT "product_subcategories_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_subcategories" ADD CONSTRAINT "product_subcategories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_base_product_id_product_base_id_fk" FOREIGN KEY ("base_product_id") REFERENCES "public"."product_base"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;