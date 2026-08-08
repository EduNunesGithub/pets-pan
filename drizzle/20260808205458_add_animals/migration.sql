CREATE TYPE "age_group" AS ENUM('baby', 'adult', 'senior');--> statement-breakpoint
CREATE TYPE "sex" AS ENUM('female', 'male');--> statement-breakpoint
CREATE TYPE "size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "species" AS ENUM('cat', 'dog', 'other');--> statement-breakpoint
CREATE TABLE "animals" (
	"age_group" "age_group",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text,
	"neutered" boolean,
	"organization_id" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"sex" "sex",
	"size" "size",
	"species" "species",
	"temperament" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"vaccinated" boolean
);
--> statement-breakpoint
CREATE INDEX "animals_organization_id_idx" ON "animals" ("organization_id");--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;