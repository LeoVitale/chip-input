# ChipInput Clipboard Format Specification

Version: 1.0  
Status: Stable

## Overview

The ChipInput clipboard format is designed for:
1. **Cross-instance compatibility** - Copy/paste between different ChipInput instances
2. **Deterministic serialization** - Same chips always produce same output
3. **Fallback support** - Graceful degradation when pasting into normal text inputs
4. **Version safety** - Future-proof with version field

## Format Structure

### Primary Format (ChipInput-specific)

```
__CHIPINPUT__:{"version":1,"chips":[{"id":"uuid","label":"React","value":"react"}]}
```

**Components:**
- `__CHIPINPUT__:` - Marker prefix to identify format
- `version` - Format version (currently 1)
- `chips` - Array of chip data objects

**Chip Data Fields:**
- `id` (string) - Original chip ID (regenerated on paste to avoid conflicts)
- `label` (string) - Display text
- `value` (string, optional) - Internal value (defaults to label)

**Fields NOT Serialized:**
- `selected` - Selection state is transient
- `disabled` - Disabled state is not preserved

### Fallback Format (Plain Text)

```
React, TypeScript, Vite
```

When pasting plain text without the `__CHIPINPUT__:` marker:
- Split by comma (`,`)
- Trim whitespace from each token
- Filter out empty strings
- Create chips with labels as values

## Usage Examples

### Example 1: Copy from ChipInput

```typescript
import { ChipClipboardSerializer } from './serialization/ChipClipboardSerializer';

const chips = [
  { id: '1', label: 'React', value: 'react' },
  { id: '2', label: 'TypeScript', value: 'typescript' }
];

const serialized = ChipClipboardSerializer.serialize(chips);
// Output: __CHIPINPUT__:{"version":1,"chips":[{"id":"1","label":"React","value":"react"},{"id":"2","label":"TypeScript","value":"typescript"}]}

navigator.clipboard.writeText(serialized);
```

### Example 2: Paste into ChipInput

```typescript
const clipboardData = await navigator.clipboard.readText();
const chips = ChipClipboardSerializer.deserialize(clipboardData);

if (chips) {
  // Successfully parsed - add to ChipInput
  setChips(prev => [...prev, ...chips]);
} else {
  // Invalid format - show error
  console.error('Invalid clipboard data');
}
```

### Example 3: Paste into Normal Text Input

If a user copies from ChipInput and pastes into a normal text input:

**Raw clipboard data:**
```
__CHIPINPUT__:{"version":1,"chips":[{"id":"1","label":"React","value":"react"}]}
```

**User sees:**
```
__CHIPINPUT__:{"version":1,"chips":[{"id":"1","label":"React","value":"react"}]}
```

While not ideal, the JSON structure is visible and the data is not lost.

**Better fallback (using toPlainText):**
```typescript
// Generate plain text representation
const plainText = ChipClipboardSerializer.toPlainText(chips);
// Output: "React, TypeScript, Vite"
```

This is more suitable for pasting into external apps (Slack, email, etc.).

### Example 4: Plain Text Fallback

If a user copies plain text and pastes into ChipInput:

**Clipboard data:**
```
React, TypeScript, Vite
```

**Parsed chips:**
```typescript
[
  { id: 'uuid-1', label: 'React', value: 'React' },
  { id: 'uuid-2', label: 'TypeScript', value: 'TypeScript' },
  { id: 'uuid-3', label: 'Vite', value: 'Vite' }
]
```

## Guarantees

### Determinism

✅ **Same input = Same output**
```typescript
serialize([chip1, chip2]) === serialize([chip1, chip2])  // Always true
```

✅ **Order preserved**
```typescript
serialize([chip1, chip2]) !== serialize([chip2, chip1])  // Order matters
```

### Reconstruction Fidelity

✅ **Labels preserved**
```typescript
deserialize(serialize(chips)).map(c => c.label) === chips.map(c => c.label)
```

✅ **Values preserved**
```typescript
deserialize(serialize(chips)).map(c => c.value) === chips.map(c => c.value)
```

❌ **IDs NOT preserved** (regenerated to avoid conflicts)
```typescript
deserialize(serialize(chips)).map(c => c.id) !== chips.map(c => c.id)
```

❌ **Selection state NOT preserved** (always reset to `selected: false`)
```typescript
deserialize(serialize(chips)).map(c => c.selected) === chips.map(() => false)
```

## Version History

### Version 1 (Current)

- Initial format
- Marker: `__CHIPINPUT__:`
- Fields: `version`, `chips[]` (with `id`, `label`, `value`)

### Future Versions

If the format needs to evolve:

**Version 2 (hypothetical):**
```json
{
  "version": 2,
  "chips": [...],
  "metadata": {
    "source": "chipinput-v2",
    "timestamp": "2024-02-04T12:00:00Z"
  }
}
```

**Backward compatibility:**
- Version 1 parsers will reject Version 2 data (warn and return null)
- Version 2 parsers should support Version 1 data (read-only compatibility)

## Error Handling

### Invalid Clipboard Data

| Input | Behavior | Return Value |
|-------|----------|--------------|
| Empty string | Parse as plain text → empty array → return null | `null` |
| `__CHIPINPUT__:invalid json` | Log error, return null | `null` |
| `__CHIPINPUT__:{"version":999,...}` | Warn unsupported version, return null | `null` |
| `__CHIPINPUT__:{"version":1,"chips":"not-array"}` | Validate structure failed, return null | `null` |
| `React, TypeScript` | Parse as plain text → 2 chips | `Chip[]` |
| `,,,` | Parse as plain text → empty array → return null | `null` |

### Logging

- **Error:** Invalid JSON structure → `console.error`
- **Warning:** Unsupported version → `console.warn`

## Testing

See [ChipClipboardSerializer.test.ts](./ChipClipboardSerializer.test.ts) for comprehensive test coverage:
- 26 tests covering all acceptance criteria
- Determinism validation
- Cross-instance behavior
- Fallback parsing
- Error handling

## Migration Guide

If you're using a custom clipboard format, migrate to ChipClipboardSerializer:

**Before:**
```typescript
const serialized = JSON.stringify(chips);
navigator.clipboard.writeText(serialized);
```

**After:**
```typescript
import { ChipClipboardSerializer } from './serialization/ChipClipboardSerializer';

const serialized = ChipClipboardSerializer.serialize(chips);
navigator.clipboard.writeText(serialized);
```

**Benefits:**
- Format stability (versioned)
- ID conflict avoidance (regenerated on paste)
- Plain text fallback support
- Comprehensive error handling

## Related

- Issue: `chip-input-bde` - Data model & clipboard serialization format
- Epic: `chip-input-11c` - ChipInput Contenteditable Contract & Guarantees
- Parent issue: `chip-input-7o2` - ChipInput public API & behavioral contract
