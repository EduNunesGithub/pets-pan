import { notFound } from "next/navigation";

import {
  getOrganizationAnimal,
  getOrganizationAnimalPhotos,
} from "@/app/(workspace)/animals/queries";
import { AnimalPhotoManager } from "@/components/animal-photo-manager";
import { EditAnimalForm } from "@/components/edit-animal-form";

import type { Animal } from "@/db/schema/animals";
import type { RegisterAnimalFields } from "@/domain/animal/animal";

function toFields(animal: Animal): RegisterAnimalFields {
  return {
    ageGroup: animal.ageGroup ?? "",
    description: animal.description ?? "",
    name: animal.name ?? "",
    sex: animal.sex ?? "",
    size: animal.size ?? "",
    species: animal.species ?? "",
    temperament: animal.temperament ?? "",
  };
}

export async function AnimalEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [animal, photos] = await Promise.all([
    getOrganizationAnimal(id),
    getOrganizationAnimalPhotos(id),
  ]);

  if (!animal) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-block">
      <header className="flex flex-col gap-pair">
        <h1 className="text-ink">Editar animal</h1>

        <p className="max-w-md text-muted">
          Dado de resgate chega incompleto. Atualize a ficha e as fotos quando
          novas informações aparecerem.
        </p>
      </header>

      <AnimalPhotoManager animalId={animal.id} photos={photos} />

      <EditAnimalForm animalId={animal.id} defaultValues={toFields(animal)} />
    </div>
  );
}
