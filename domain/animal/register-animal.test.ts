import { describe, expect, it } from "vitest";

import { registerAnimal } from "@/domain/animal/register-animal";

describe("registerAnimal", () => {
  it("nasce não publicado (regra 9)", () => {
    const data = registerAnimal({ name: "Rex" });

    expect(data.published).toBe(false);
  });

  it("aceita cadastro parcial, sem nome (§4.1)", () => {
    const data = registerAnimal({});

    expect(data.name).toBeUndefined();
    expect(data.published).toBe(false);
  });

  it("preserva os campos informados no cadastro", () => {
    const data = registerAnimal({
      name: "Rex",
      sex: "male",
      species: "dog",
    });

    expect(data.name).toBe("Rex");
    expect(data.sex).toBe("male");
    expect(data.species).toBe("dog");
  });
});
