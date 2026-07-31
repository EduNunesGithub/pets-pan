import { expect, it } from "vitest";

it("roda a suíte de domínio no ambiente node", () => {
  expect(typeof window).toBe("undefined");
});
