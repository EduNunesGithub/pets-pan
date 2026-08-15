CREATE TABLE "animal_photos" (
	"alt" text NOT NULL,
	"animal_id" uuid NOT NULL,
	"card_pathname" text NOT NULL,
	"card_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"full_height" integer NOT NULL,
	"full_pathname" text NOT NULL,
	"full_url" text NOT NULL,
	"full_width" integer NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"is_cover" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "animal_photos_animal_id_idx" ON "animal_photos" ("animal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "animal_photos_one_cover_per_animal_idx" ON "animal_photos" ("animal_id") WHERE "is_cover";--> statement-breakpoint
ALTER TABLE "animal_photos" ADD CONSTRAINT "animal_photos_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE;