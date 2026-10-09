import path from "node:path";
import { describe, expect, it } from "vitest";
import { fixtures, runScript } from "./run-script";

const run = (name: string) => runScript("check-ac-coverage.mjs", path.join(fixtures, "ac-coverage", name));

describe("scripts/check-ac-coverage.mjs", () => {
  it("passes when every implemented row has a test and REMOVED/commented rows are ignored", () => {
    const { code, out } = run("ok");
    expect(out).toContain("AC у специфікаціях: 2");
    expect(out).toContain("рядків у матриці: 2");
    expect(code).toBe(0);
  });

  it("reports NO-ROW when the spec has an AC without a matrix row", () => {
    const { code, out } = run("no-row");
    expect(code).toBe(1);
    expect(out).toContain("NO-ROW");
    expect(out).toMatch(/AC-DEMO-02 \(openspec\/specs\/leave\/spec\.md:\d+\)/);
  });

  it("reports MISSING when an implemented row only has skipped or todo tests", () => {
    const { code, out } = run("missing-test");
    expect(code).toBe(1);
    expect(out).toContain("MISSING");
    expect(out).toContain("AC-DEMO-02");
    expect(out).not.toMatch(/MISSING[\s\S]*AC-DEMO-01/);
  });

  it("reports ORPHAN when a test names an AC that the spec lacks", () => {
    const { code, out } = run("orphan");
    expect(code).toBe(1);
    expect(out).toContain("ORPHAN");
    expect(out).toContain("AC-DEMO-42");
  });

  it("reports BAD-STATUS for unknown statuses and deferrals without a reason", () => {
    const { code, out } = run("bad-status");
    expect(code).toBe(1);
    expect(out).toContain("BAD-STATUS");
    expect(out).toContain("готово");
  });

  it("passes on an empty template", () => {
    const { code, out } = run("empty");
    expect(code).toBe(0);
    expect(out).toContain("порожній шаблон");
  });
});
