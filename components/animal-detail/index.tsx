import { notFound } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { getOrganizationAnimal } from "@/app/(workspace)/animals/queries";
import { AnimalVisibilityBadge } from "@/components/animal-visibility-badge";
import {
  ageGroupOptions,
  optionLabel,
  sexOptions,
  sizeOptions,
  speciesOptions,
} from "@/domain/animal/labels";

import type { ReactNode } from "react";

type DetailField = {
  full?: boolean;
  label: string;
  value: ReactNode;
};

type DetailGroup = {
  fields: DetailField[];
  title: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
  timeZoneName: "short",
  year: "numeric",
});

function booleanLabel(value: boolean | null): string {
  if (value === null) {
    return "Não informado";
  }

  return value ? "Sim" : "Não";
}

export async function AnimalDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animal = await getOrganizationAnimal(id);

  if (!animal) {
    notFound();
  }

  const groups: DetailGroup[] = [
    {
      fields: [
        {
          label: "Espécie",
          value: optionLabel(speciesOptions, animal.species),
        },
        { label: "Sexo", value: optionLabel(sexOptions, animal.sex) },
        { label: "Porte", value: optionLabel(sizeOptions, animal.size) },
        {
          label: "Faixa etária",
          value: optionLabel(ageGroupOptions, animal.ageGroup),
        },
      ],
      title: "Características",
    },
    {
      fields: [
        { label: "Castrado", value: booleanLabel(animal.neutered) },
        { label: "Vacinado", value: booleanLabel(animal.vaccinated) },
      ],
      title: "Saúde",
    },
    {
      fields: [
        { label: "Temperamento", value: animal.temperament ?? "—" },
        {
          full: true,
          label: "Descrição",
          value: animal.description ? (
            <span className="whitespace-pre-wrap">{animal.description}</span>
          ) : (
            "—"
          ),
        },
      ],
      title: "Sobre",
    },
    {
      fields: [
        {
          label: "Cadastrado em",
          value: dateFormatter.format(animal.createdAt),
        },
        {
          label: "Atualizado em",
          value: dateFormatter.format(animal.updatedAt),
        },
      ],
      title: "Registro",
    },
  ];

  return (
    <article className="flex flex-col gap-block">
      <header className="flex flex-col gap-inset">
        <span className="eyebrow text-muted">Animal</span>

        <div className="flex flex-wrap items-center gap-inset">
          {animal.name ? (
            <h1 className="text-ink">{animal.name}</h1>
          ) : (
            <h1 className="text-muted italic">Sem nome</h1>
          )}

          <AnimalVisibilityBadge published={animal.published} />
        </div>
      </header>

      {groups.map((group) => (
        <section
          className="flex flex-col gap-item rounded-md border border-line bg-card px-block py-item"
          key={group.title}
        >
          <h2 className="eyebrow text-muted">{group.title}</h2>

          <dl className="grid gap-item sm:grid-cols-2">
            {group.fields.map((field) => (
              <div
                className={twMerge(
                  "flex flex-col gap-pair",
                  field.full && "sm:col-span-2",
                )}
                key={field.label}
              >
                <dt className="meta text-muted">{field.label}</dt>

                <dd className="item text-ink">{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </article>
  );
}
