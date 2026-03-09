const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const core = require("../state-editor-core");

const SAMPLE_STATE_PATH = path.join(__dirname, "fixtures", "State");
const CONFIG_PATH = path.join(__dirname, "..", "config.js");

function loadEditorConfig() {
  const code = fs.readFileSync(CONFIG_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.EDITOR_CONFIG;
}

test("loads config.js and exposes expected field shape", () => {
  const config = loadEditorConfig();
  assert.ok(config);
  assert.equal(config.defaultWrm, 0x1316);
  assert.equal(config.nesSramBase, 0x6000);
  assert.equal(config.fields.length, 3);
  assert.deepEqual(
    Array.from(config.fields, (field) => field.id),
    ["gold", "revive", "troops100"]
  );
});

test("offset mapping matches documented addresses", () => {
  const config = loadEditorConfig();
  const wrm = config.defaultWrm;
  const expected = (nesAddr) => wrm + (nesAddr - config.nesSramBase);
  assert.equal(core.fileOffset(0x7f2c, wrm, config.nesSramBase), 0x3242);
  assert.equal(core.fileOffset(0x7f2d, wrm, config.nesSramBase), 0x3243);
  assert.equal(core.fileOffset(0x7f36, wrm, config.nesSramBase), expected(0x7f36));
  assert.equal(core.fileOffset(0x7f38, wrm, config.nesSramBase), expected(0x7f38));
});

test("sample State file can be parsed and is NST format", () => {
  const config = loadEditorConfig();
  const bytes = new Uint8Array(fs.readFileSync(SAMPLE_STATE_PATH));

  assert.equal(core.isNST(bytes), true);

  const required = core.maxRequiredOffset(config.fields, config.defaultWrm, config.nesSramBase) + 1;
  assert.ok(bytes.length >= required);

  const values = core.readAllFields(bytes, config);
  assert.equal(typeof values.gold, "number");
  assert.equal(typeof values.revive, "number");
  assert.equal(typeof values.troops100, "number");
  assert.ok(values.gold >= 0 && values.gold <= 65535);
  assert.ok(values.revive >= 0 && values.revive <= 255);
  assert.ok(values.troops100 >= 0 && values.troops100 <= 255);
});

test("writeAllFields updates bytes correctly using sample input", () => {
  const config = loadEditorConfig();
  const original = new Uint8Array(fs.readFileSync(SAMPLE_STATE_PATH));
  const offset = (nesAddr) => config.defaultWrm + (nesAddr - config.nesSramBase);
  const patched = core.writeAllFields(
    original,
    config,
    { gold: 32000, revive: 12, troops100: 77 },
    config.defaultWrm
  );

  assert.notEqual(patched, original);
  assert.equal(patched[offset(0x7f2c)], 0x00); // gold low byte
  assert.equal(patched[offset(0x7f2d)], 0x7d); // gold high byte (125)
  assert.equal(patched[offset(0x7f36)], 12);   // revive
  assert.equal(patched[offset(0x7f38)], 77);   // troops100

  const values = core.readAllFields(patched, config);
  assert.equal(values.gold, 32000);
  assert.equal(values.revive, 12);
  assert.equal(values.troops100, 77);
});
