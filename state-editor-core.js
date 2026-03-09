(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.StateEditorCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function parseWrmOffset(raw, defaultWrm) {
    const text = String(raw == null ? "" : raw).trim();
    const parsed = parseInt(text, text.startsWith("0x") || text.startsWith("0X") ? 16 : 10);
    return Number.isNaN(parsed) ? defaultWrm : parsed;
  }

  function toHex(value, bytes) {
    return "0x" + value.toString(16).toUpperCase().padStart(bytes * 2, "0");
  }

  function fileOffset(nesAddr, wrmBase, nesSramBase) {
    return wrmBase + (nesAddr - nesSramBase);
  }

  function fieldOffsets(field, wrmBase, nesSramBase) {
    return field.nesAddrs.map(function (addr) {
      return fileOffset(addr, wrmBase, nesSramBase);
    });
  }

  function readField(bytes, field, wrmBase, nesSramBase) {
    const offs = fieldOffsets(field, wrmBase, nesSramBase);
    if (field.bytes === 1) return bytes[offs[0]];
    return bytes[offs[0]] | (bytes[offs[1]] << 8);
  }

  function writeField(bytes, field, value, wrmBase, nesSramBase) {
    const offs = fieldOffsets(field, wrmBase, nesSramBase);
    bytes[offs[0]] = value & 0xff;
    if (field.bytes === 2) bytes[offs[1]] = (value >> 8) & 0xff;
  }

  function maxRequiredOffset(fields, wrmBase, nesSramBase) {
    return Math.max.apply(
      null,
      fields.flatMap(function (field) {
        return fieldOffsets(field, wrmBase, nesSramBase);
      })
    );
  }

  function isNST(bytes) {
    return bytes[0] === 0x4e && bytes[1] === 0x53 && bytes[2] === 0x54;
  }

  function readAllFields(bytes, config, wrmBase) {
    const actualWrmBase = wrmBase == null ? config.defaultWrm : wrmBase;
    const out = {};
    config.fields.forEach(function (field) {
      out[field.id] = readField(bytes, field, actualWrmBase, config.nesSramBase);
    });
    return out;
  }

  function writeAllFields(bytes, config, values, wrmBase) {
    const actualWrmBase = wrmBase == null ? config.defaultWrm : wrmBase;
    const out = new Uint8Array(bytes);
    config.fields.forEach(function (field) {
      const raw = values[field.id];
      const next = Math.min(field.max, Math.max(0, parseInt(raw, 10) || 0));
      writeField(out, field, next, actualWrmBase, config.nesSramBase);
    });
    return out;
  }

  return {
    fileOffset: fileOffset,
    fieldOffsets: fieldOffsets,
    isNST: isNST,
    maxRequiredOffset: maxRequiredOffset,
    parseWrmOffset: parseWrmOffset,
    readAllFields: readAllFields,
    readField: readField,
    toHex: toHex,
    writeAllFields: writeAllFields,
    writeField: writeField,
  };
});
