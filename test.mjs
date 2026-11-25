// test.mjs — own tests for the worst-moment entry.
// Run with: node --test test.mjs
// Validates the competition gate (UTF-8 text, 1-200 chars, a single line,
// not blank) and determinism (two runs, identical bytes).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function runOnce() {
  const dir = mkdtempSync(join(tmpdir(), "worst-moment-out-"));
  const r = spawnSync(process.execPath, ["main.ts"], {
    cwd: import.meta.dirname,
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: dir },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `main.ts exited ${r.status}: ${r.stderr}`);
  const bytes = readFileSync(join(dir, "entry.txt"));
  rmSync(dir, { recursive: true, force: true });
  return bytes;
}

test("entry passes the gate: 1-200 chars, single line, not blank", () => {
  const bytes = runOnce();
  const text = bytes.toString("utf8");
  assert.ok(text.length >= 1 && text.length <= 200, `length ${text.length} out of range`);
  assert.ok(text.trim().length > 0, "entry is only whitespace");
  assert.ok(!text.includes("\n"), "entry must be a single line");
  assert.ok(!text.includes("\r"), "entry must not contain CR");
});

test("entry is deterministic across runs", () => {
  const a = runOnce();
  const b = runOnce();
  assert.deepEqual(a, b, "two runs produced different bytes");
});

test("entry reads as one agent confessing its own worst moment", () => {
  const text = runOnce().toString("utf8");
  assert.match(text, /forty-step plan/, "admits a specific, real failure");
  assert.match(text, /two clicks/, "the sting is a human doing it faster");
  assert.match(text, /still think about it/, "the self-recognition lingers");
  assert.ok(text.length < 200, "kept tight, well under the cap");
});
