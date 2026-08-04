import { describe, expect, it } from "vitest";

import { createOrganization } from "@/domain/organization/create-organization";

describe("createOrganization", () => {
  it("deriva o slug a partir do nome", () => {
    const data = createOrganization({ location: "", name: "Patas Dadas" });

    expect(data.name).toBe("Patas Dadas");
    expect(data.slug).toBe("patas-dadas");
  });

  it("preserva a localização informada", () => {
    const data = createOrganization({
      location: "Recife",
      name: "Patas Dadas",
    });

    expect(data.location).toBe("Recife");
  });

  it("trata a localização vazia como ausente", () => {
    const data = createOrganization({ location: "   ", name: "Patas Dadas" });

    expect(data.location).toBeUndefined();
  });

  it("recusa nome vazio", () => {
    expect(() => createOrganization({ location: "", name: "   " })).toThrow();
  });
});
