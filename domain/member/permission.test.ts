import { describe, expect, it } from "vitest";

import { can } from "@/domain/member/permission";

describe("can", () => {
  it("só o admin gerencia membros (§8.1)", () => {
    expect(can("admin", "member", "invite")).toBe(true);
    expect(can("admin", "member", "remove")).toBe(true);
    expect(can("admin", "member", "setRole")).toBe(true);

    expect(can("volunteer", "member", "invite")).toBe(false);
    expect(can("volunteer", "member", "remove")).toBe(false);
    expect(can("volunteer", "member", "setRole")).toBe(false);
  });

  it("só o admin configura a organização e os pipelines (§8.1)", () => {
    expect(can("admin", "organization", "update")).toBe(true);
    expect(can("admin", "pipeline", "configure")).toBe(true);

    expect(can("volunteer", "organization", "update")).toBe(false);
    expect(can("volunteer", "pipeline", "configure")).toBe(false);
  });

  it("os dois papéis cadastram e controlam o ciclo de vida do animal (§8.1)", () => {
    expect(can("admin", "animal", "create")).toBe(true);
    expect(can("admin", "animal", "update")).toBe(true);
    expect(can("admin", "animal", "publish")).toBe(true);
    expect(can("admin", "animal", "unpublish")).toBe(true);
    expect(can("admin", "animal", "close")).toBe(true);
    expect(can("admin", "animal", "archive")).toBe(true);
    expect(can("admin", "animal", "unarchive")).toBe(true);

    expect(can("volunteer", "animal", "create")).toBe(true);
    expect(can("volunteer", "animal", "update")).toBe(true);
    expect(can("volunteer", "animal", "publish")).toBe(true);
    expect(can("volunteer", "animal", "unpublish")).toBe(true);
    expect(can("volunteer", "animal", "close")).toBe(true);
    expect(can("volunteer", "animal", "archive")).toBe(true);
    expect(can("volunteer", "animal", "unarchive")).toBe(true);
  });

  it("os dois papéis operam cases, tarefas e candidaturas (§8.1)", () => {
    expect(can("admin", "case", "open")).toBe(true);
    expect(can("admin", "case", "close")).toBe(true);
    expect(can("admin", "case", "cancel")).toBe(true);
    expect(can("admin", "case", "move")).toBe(true);
    expect(can("admin", "task", "complete")).toBe(true);
    expect(can("admin", "task", "reopen")).toBe(true);
    expect(can("admin", "application", "triage")).toBe(true);
    expect(can("admin", "application", "select")).toBe(true);

    expect(can("volunteer", "case", "open")).toBe(true);
    expect(can("volunteer", "case", "close")).toBe(true);
    expect(can("volunteer", "case", "cancel")).toBe(true);
    expect(can("volunteer", "case", "move")).toBe(true);
    expect(can("volunteer", "task", "complete")).toBe(true);
    expect(can("volunteer", "task", "reopen")).toBe(true);
    expect(can("volunteer", "application", "triage")).toBe(true);
    expect(can("volunteer", "application", "select")).toBe(true);
  });

  it("os dois papéis veem os dados internos (§8.1)", () => {
    expect(can("admin", "organization", "read")).toBe(true);
    expect(can("volunteer", "organization", "read")).toBe(true);
  });
});
