import path from "node:path";
import { describe, expect, it } from "vitest";
import { fixtures, runScript } from "./run-script";

const dir = (name: string) => path.join(fixtures, "check-spec", name);
const run = (name: string, env?: Record<string, string>) => runScript("check-spec.mjs", dir(name), env);

describe("scripts/check-spec.mjs", () => {
  it("passes valid specs and ignores archived changes", () => {
    const { code, out } = run("valid");
    expect(out).toContain("OK");
    expect(code).toBe(0);
  });

  it("fails when a scenario title does not start with a valid ID", () => {
    const { code, out } = run("bad-title");
    expect(code).toBe(1);
    expect(out).toContain("BAD-TITLE");
    expect(out).toContain("Працівник подає заявку");
    expect(out).toContain("lowercase id");
  });

  it("fails on a scenario heading with three hashes", () => {
    const { code, out } = run("bad-level");
    expect(code).toBe(1);
    expect(out).toContain("BAD-LEVEL");
  });

  it("fails when an ID repeats across canonical specs", () => {
    const { code, out } = run("duplicate");
    expect(code).toBe(1);
    expect(out).toContain("DUPLICATE");
  });

  it("fails on a denylisted word regardless of case", () => {
    const { code, out } = run("denylist");
    expect(code).toBe(1);
    expect(out).toContain("openspec/specs/leave/spec.md:3");
    expect(out).not.toContain("product/denylist.txt");
  });

  it("reads extra words from SPEC_DENYLIST without printing them", () => {
    const { code, out } = run("denylist", { SPEC_DENYLIST: "Fabrikam,Northwind" });
    expect(code).toBe(1);
    expect(out).toContain("product/roadmap.md:3");
    expect(out).toContain("SPEC_DENYLIST");
    expect(out).not.toContain("Fabrikam");
  });

  it("passes in a directory without openspec/", () => {
    const { code } = runScript("check-spec.mjs", path.join(fixtures, "ac-coverage", "empty"));
    expect(code).toBe(0);
  });
});
