import { describe, expect, it } from "vitest";

import { editAnimal } from "@/domain/animal/edit-animal";

describe("editAnimal", () => {
  it("preserva os campos informados", () => {
    const data = editAnimal({ name: "Rex", sex: "male", species: "dog" });

    expect(data.name).toBe("Rex");
    expect(data.sex).toBe("male");
    expect(data.species).toBe("dog");
  });

  it("não mexe na publicação — publicar é controle separado (§4.2)", () => {
    const data = editAnimal({ name: "Rex" });

    expect("published" in data).toBe(false);
  });

  it("aceita edição parcial, limpando um campo para indefinido", () => {
    const data = editAnimal({ name: undefined, temperament: "dócil" });

    expect(data.name).toBeUndefined();
    expect(data.temperament).toBe("dócil");
  });
});
