import { describe, expect, it } from "vitest";

import { founderRole, toSlug } from "@/domain/organization/organization";

describe("founderRole", () => {
  it("o fundador nasce admin (§8.1)", () => {
    expect(founderRole).toBe("admin");
  });
});

describe("toSlug", () => {
  it("normaliza acentos, caixa e espaços", () => {
    expect(toSlug("Coração Animal")).toBe("coracao-animal");
  });

  it("colapsa separadores e apara as bordas", () => {
    expect(toSlug("  Amigos do Peito — SP!! ")).toBe("amigos-do-peito-sp");
  });
});
