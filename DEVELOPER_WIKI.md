# Developer Wiki

## Project Files

| File | Purpose |
|------|---------|
| `index.html` | UI, drag/drop loading, parsing, editing, and download flow |
| `config.js` | Editable config for WRM/SRAM addresses and field definitions |
| `state-editor-core.js` | Shared pure logic for offset math and field read/write |
| `test/state-editor-core.test.js` | Unit tests (Node `node:test`) |
| `test/fixtures/State` | Sample state fixture used by tests |

## Run Tests

```bash
npm test
```

CI is configured in `.github/workflows/ci.yml`.

## File Format and Address Mapping

### NST Binary Format

`State` uses Nestopia NST chunk format:

```text
NST
├── NFO
├── CPU
│   └── RAM
├── PPU
└── IMG
    └── MPR
        ├── WRM  (SRAM / save data)
        └── VRM
```

### Address Conversion

- Default WRM start (this game): `0x1316`
- NES SRAM range: `0x6000–0x7FFF`
- Formula:

```text
file_offset = WRM_START + (NES_address - 0x6000)
```

## Field Reference

### Gold (16-bit LE)

- NES `0x7F2C` (lo), `0x7F2D` (hi)
- File offsets with WRM `0x1316`: `0x3242`, `0x3243`
- Encoding:

```text
gold = lo + hi * 256
```

### Revive Grass (8-bit)

- NES `0x7F36`
- File offset with WRM `0x1316`: `0x324C`

### Troops x100 (8-bit)

- NES `0x7F38`
- File offset with WRM `0x1316`: `0x324E`

## Python Example (Manual Editing)

```python
WRM_OFFSET = 0x1316
NES_SRAM_BASE = 0x6000

def nes_to_file(nes_addr):
    return WRM_OFFSET + (nes_addr - NES_SRAM_BASE)

with open("State", "rb") as f:
    data = bytearray(f.read())

gold = 32000
revive = 10
troops100 = 50

data[nes_to_file(0x7F2C)] = gold % 256
data[nes_to_file(0x7F2D)] = gold // 256
data[nes_to_file(0x7F36)] = revive
data[nes_to_file(0x7F38)] = troops100

with open("State", "wb") as f:
    f.write(data)
```

## Advanced Notes

- WRM offset can vary across games/core versions.
- The editor supports WRM override in the Advanced section.
- For other games, locate `WRM` chunk start and update config/override accordingly.

## Compatibility

| Item | Details |
|------|---------|
| Game | 三国志曹操传 FC南晶版 |
| Emulator | OpenEmu (macOS) |
| Core | Nestopia |
| State format | NST binary |
| Browser | Modern Chrome / Firefox / Safari / Edge |

## License

MIT
