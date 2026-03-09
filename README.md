# three-kingdoms-game-editor
FC Game Editor for Three-Kindoms

# 三國曹操傳 Save State Editor
### FC 南晶版 · OpenEmu Nestopia · Browser-based Cheat Tool

> A single-file HTML editor for modifying **Three Kingdoms: Cao Cao** (三国志曹操传) NES/FC save states created by OpenEmu. Edit gold, revive grass, and troop counts directly in your browser — no installation required.

🎮 **[Live Demo](https://your-username.github.io/caocao-save-editor/)**

---

## Features

- 📂 Drag-and-drop the `State` binary from inside your `.oesavestate` bundle
- ✏️ Edit gold (金錢), revive grass (復活草), and troops ×100 (兵力)
- 🔍 Live hex preview for every field as you type
- ✅ NST format signature verification on load
- ⬇️ Download the patched `State` file ready to drop back into the bundle
- ⚙️ Advanced WRM offset override for non-standard state files
- 🖥️ Fully client-side — your save data never leaves your machine

---

## Project Files

| File | Purpose |
|------|---------|
| `index.html` | UI, drag/drop loading, parsing, editing, and download flow |
| `config.js` | Editable config for WRM/SRAM addresses and field definitions |

To add new editable stats in the future, update `config.js` and reload the page.

---

## How to Use

### Step 1 — Extract the State file

An `.oesavestate` file is actually a macOS **bundle** (a folder disguised as a file). It contains three files:

| File | Description |
|------|-------------|
| `Info.plist` | Metadata (core, ROM MD5, timestamp) |
| `State` | The raw Nestopia NST binary — **this is what you edit** |
| `ScreenShot` | PNG thumbnail |

Right-click your `.oesavestate` file in Finder → **Show Package Contents**, then locate the `State` file.

### Step 2 — Load, edit, save

1. Open the editor in your browser
2. Drag the `State` file into the drop zone
3. Edit the field values
4. Click **Save & Download** — the patched `State` file is downloaded
5. Replace the original `State` file inside the `.oesavestate` bundle
6. Reload the save state in OpenEmu

> ⚠️ Always keep a backup of your original `State` file before editing.

---

## File Format & Address Mapping

### NST Binary Format

The `State` file uses **Nestopia's NST binary format**, a chunked structure:

```
NST
├── NFO   — file info header
├── CPU
│   └── RAM  — NES internal RAM (2 KB)
├── PPU   — picture processing unit state
└── IMG
    └── MPR
        ├── WRM  — cartridge Work RAM / SRAM (8 KB)  ← game save data lives here
        └── VRM  — video RAM
```

### NES Address Space → File Offset

The **WRM chunk** (cartridge SRAM) maps to NES address range `0x6000–0x7FFF`.

For this game's state file, the WRM chunk data begins at **file offset `0x1316`**.

The formula to convert a NES address to a file offset is:

```
file_offset = WRM_START + (NES_address - 0x6000)
```

where `WRM_START = 0x1316` (default for FC南晶版).

---

## Field Reference

### Gold · 金錢

Gold is stored as a **16-bit little-endian integer** split across two consecutive bytes:

| NES Address | File Offset | Role | Value Range |
|-------------|-------------|------|-------------|
| `0x7F2C` | `0x3242` | Low byte | 0–255 |
| `0x7F2D` | `0x3243` | High byte | 0–255 |

**Encoding:**
```
gold = byte[0x7F2C] + byte[0x7F2D] × 256
```

**Decoding (to set a desired value):**
```
byte[0x7F2C] = gold_value % 256   # low byte
byte[0x7F2D] = gold_value // 256  # high byte
```

**Example — set gold to 32,000:**
```
32000 % 256  = 0    → write 0x00 to file offset 0x3242
32000 // 256 = 125  → write 0x7D to file offset 0x3243
```

Maximum gold: **65,535** (0xFF low + 0xFF high).

---

### Revive Grass · 復活草

| NES Address | File Offset | Size | Value Range |
|-------------|-------------|------|-------------|
| `0x7F36` | `0x3256` | 1 byte | 0–255 |

Stored as a plain unsigned byte. Set directly:
```
byte[0x7F36] = quantity
```

---

### Troops × 100 · 兵力

| NES Address | File Offset | Size | Value Range |
|-------------|-------------|------|-------------|
| `0x7F38` | `0x3258` | 1 byte | 0–255 |

Stored as a plain unsigned byte representing troop count in units of 100:
```
byte[0x7F38] = troop_count   # actual troops = troop_count × 100
```

---

## Offset Calculation Examples

All offsets derived from formula `0x1316 + (NES_addr − 0x6000)`:

| Field | NES Address | Calculation | File Offset |
|-------|-------------|-------------|-------------|
| Gold (lo) | `0x7F2C` | `0x1316 + 0x1F2C` | `0x3242` |
| Gold (hi) | `0x7F2D` | `0x1316 + 0x1F2D` | `0x3243` |
| Revive Grass | `0x7F36` | `0x1316 + 0x1F36` | `0x3256` |
| Troops ×100 | `0x7F38` | `0x1316 + 0x1F38` | `0x3258` |

---

## Manual Editing (Python)

If you prefer to script it, here is a minimal Python snippet:

```python
WRM_OFFSET = 0x1316
NES_SRAM_BASE = 0x6000

def nes_to_file(nes_addr):
    return WRM_OFFSET + (nes_addr - NES_SRAM_BASE)

with open('State', 'rb') as f:
    data = bytearray(f.read())

gold   = 32000
revive = 10
troops = 50   # = 5,000 actual troops

# Gold (16-bit little-endian)
data[nes_to_file(0x7F2C)] = gold % 256
data[nes_to_file(0x7F2D)] = gold // 256

# Revive grass (8-bit)
data[nes_to_file(0x7F36)] = revive

# Troops x100 (8-bit)
data[nes_to_file(0x7F38)] = troops

with open('State', 'wb') as f:
    f.write(data)
```

---

## How the Addresses Were Discovered

The correct addresses were found through a binary diff approach:

1. Collected two save state files with known gold values (32 and 52)
2. Did a byte-by-byte comparison of the two `State` files
3. Located bytes matching the exact gold values (`0x20` = 32, `0x34` = 52)
4. Cross-referenced with known cheat code addresses (`0x7F2B`, `0x7F2C`) from community documentation
5. Confirmed `0x7F2C` held the exact gold value in both files
6. Identified `0x7F2D` as the high byte (zero in both test cases since gold < 256)

> Note: Address `0x7F2B` appears in some cheat guides alongside gold but does not directly store the gold value — it may be a display counter or related field. Only `0x7F2C` and `0x7F2D` are needed for gold editing.

---

## Advanced: WRM Offset Varies by Game

The WRM chunk offset `0x1316` is specific to this game's state file. For other games or core versions, the offset may differ. The editor exposes a **WRM Offset Override** field (under Advanced) so you can adjust it without touching the code.

To find the correct WRM offset for another game, parse the NST chunk structure:
- Scan for the ASCII tag `WRM` followed by a 4-byte little-endian chunk length
- The data immediately following is the SRAM content

---

## Compatibility

| Item | Details |
|------|---------|
| Game | 三国志曹操传 FC南晶版 (South Crystal Edition) |
| Emulator | OpenEmu (macOS) |
| Core | Nestopia |
| State format | NST binary (chunked) |
| Browser | Any modern browser (Chrome, Firefox, Safari, Edge) |

---

## License

MIT — free to use, modify, and redistribute.

---

*Research and address discovery based on binary comparison of known save states and cross-reference with community cheat code documentation for 三国志曹操传 FC南晶版.*
