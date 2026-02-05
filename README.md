# ChipInput - Controlled React Component

A production-ready, controlled chip input component built with React, TypeScript, and Clean Architecture principles.

## Features

- ✅ **Controlled Component** - Single source of truth via `value`/`onChange` props
- ✅ **Keyboard Shortcuts** - Cmd/Ctrl+A (select all), Delete/Backspace (remove), Escape (clear selection)
- ✅ **Clipboard Support** - Copy/paste chips between instances with custom serialization
- ✅ **Multi-Selection** - Click to select, Cmd/Ctrl+Click to multi-select
- ✅ **TypeScript** - Fully typed with strict type checking
- ✅ **Clean Architecture** - Domain entities, presentation components, clear separation of concerns
- ✅ **Fully Tested** - 15 tests covering all contract guarantees

## Quick Start

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Usage

```tsx
import { useState } from 'react';
import { ChipInput } from './presentation/components/ChipInput';
import { createChip } from './domain/entities/Chip';

function App() {
  const [chips, setChips] = useState([
    createChip('React'),
    createChip('TypeScript'),
    createChip('Vite'),
  ]);

  const handleCopy = (selectedChips) => {
    const serialized = JSON.stringify(selectedChips);
    navigator.clipboard.writeText(serialized);
  };

  const handlePaste = (data) => {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed)
        ? parsed.map(item => createChip(item.label))
        : null;
    } catch {
      return null;
    }
  };

  return (
    <ChipInput
      value={chips}
      onChange={setChips}
      onCopy={handleCopy}
      onPaste={handlePaste}
      placeholder="Add chips..."
    />
  );
}
```

## API Contract

### Props

```typescript
interface ChipInputProps {
  // Required: array of chips (controlled)
  value: Chip[];
  
  // Required: callback when chips change
  onChange: (chips: Chip[]) => void;
  
  // Optional: placeholder text
  placeholder?: string;
  
  // Optional: disable interactions
  disabled?: boolean;
  
  // Optional: custom CSS class
  className?: string;
  
  // Optional: copy callback
  onCopy?: (chips: Chip[]) => void;
  
  // Optional: paste callback
  onPaste?: (data: string) => Chip[] | null;
}
```

### Chip Entity

```typescript
interface Chip {
  id: string;           // Unique identifier
  label: string;        // Display text
  value?: string;       // Optional value (defaults to label)
  selected?: boolean;   // Selection state
  disabled?: boolean;   // Disabled state
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+A` | Select all chips |
| `Delete` / `Backspace` | Remove selected chips (or last chip if none selected) |
| `Escape` | Clear selection |
| `Cmd/Ctrl+C` | Copy selected chips |
| `Cmd/Ctrl+V` | Paste chips |
| `Click` | Select chip (clears other selections) |
| `Cmd/Ctrl+Click` | Toggle chip selection (multi-select) |

## Architecture

```
src/
├── domain/
│   └── entities/
│       └── Chip.ts              # Core domain model
├── presentation/
│   └── components/
│       ├── ChipInput.tsx        # React component
│       ├── ChipInput.test.tsx   # Tests (15 tests)
│       └── ChipInput.contract.md # API contract documentation
└── test/
    └── setup.ts                 # Test configuration
```

## Contract Guarantees

See [ChipInput.contract.md](./src/presentation/components/ChipInput.contract.md) for full contract documentation.

### Source of Truth

- **STATE** (controlled via `value` prop)
- The DOM is purely a view layer
- All state changes go through `onChange`

### Behavioral Guarantees

1. ✅ Cmd/Ctrl+A selects all chips
2. ✅ Delete/Backspace removes selected chips
3. ✅ Copy/paste works between ChipInput instances
4. ✅ Component never enters invalid state
5. ✅ Controlled mode with value/onChange

## Testing

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch
```

All acceptance criteria are validated by automated tests:
- Source of truth (state vs DOM)
- Controlled component behavior
- Keyboard shortcuts (Cmd+A, Delete, Backspace, Escape)
- Copy/paste functionality
- Multi-selection behavior

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** (rolldown) for blazing fast builds
- **Vitest** for testing
- **React Testing Library** for component tests
- **ESLint** for code quality

## Issue Tracking

This project uses [beads](https://github.com/beadwork/beads) for issue tracking.

```bash
# View current epic and tasks
bd show chip-input-11c

# List ready work
bd ready

# Mark task as in progress
bd update <issue-id> --status in_progress

# Close completed task
bd close <issue-id>
```

## License

MIT

## Related Issues

- Epic: `chip-input-11c` - ChipInput Contenteditable Contract & Guarantees
- Issue: `chip-input-7o2` - ChipInput public API & behavioral contract ✅ **COMPLETED**

## Next Steps

See remaining tasks in the epic:
- `chip-input-bde` - Data model & clipboard serialization
- `chip-input-bxw` - Selection & keyboard semantics (advanced)
- `chip-input-97m` - RTL tests for selection + clipboard
- `chip-input-33p` - Drag and drop semantics (P2)
- `chip-input-utr` - Accessibility guarantees (P2)
- `chip-input-088` - Playwright e2e tests (P2)
