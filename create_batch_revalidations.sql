CREATE TABLE IF NOT EXISTS "batch_revalidations" (
  "id" serial PRIMARY KEY NOT NULL,
  "original_batch_id" integer NOT NULL,
  "new_batch_id" integer NOT NULL,
  "revalidation_date" date NOT NULL,
  "revalidation_reason" text NOT NULL,
  "original_expiration_date" date NOT NULL,
  "new_expiration_date" date NOT NULL,
  "lab_certificate_url" text,
  "lab_certificate_file_name" text,
  "revalidated_by" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "tenant_id" integer NOT NULL
);

ALTER TABLE "batch_revalidations" ADD CONSTRAINT "batch_revalidations_original_batch_id_entry_certificates_id_fk" FOREIGN KEY ("original_batch_id") REFERENCES "entry_certificates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "batch_revalidations" ADD CONSTRAINT "batch_revalidations_new_batch_id_entry_certificates_id_fk" FOREIGN KEY ("new_batch_id") REFERENCES "entry_certificates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "batch_revalidations" ADD CONSTRAINT "batch_revalidations_revalidated_by_users_id_fk" FOREIGN KEY ("revalidated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "batch_revalidations" ADD CONSTRAINT "batch_revalidations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;