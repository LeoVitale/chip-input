# ChipInput Component - API Contract & Guarantees

## Version

v1.1.0 - Text Input & Chip Creation

**Changelog:**
- v1.1.0: Added text input field, chip creation via Enter, configurable separators
- v1.0.0: Initial contract with selection, deletion, clipboard

## Source of Truth

**STATE** (controlled component via `value` prop)

- The `value` prop is the single source of truth for the component's state
- The DOM is purely a **view layer** that reflects the state
- All state changes MUST go through the `onChange` callback
- The component does NOT maintain internal state for chips

## Component Modes

### Controlled (v1 - Current)

```tsx
<ChipInput
  value={chips}           // Required: array of Chip entities
  onChange={setChips}     // Required: callback for state updates
/>
```

**Guarantees:**
- Component never mutates the `value` prop directly
- All changes are requested via `onChange`
- Parent has full control over the chip state

### Uncontrolled (Future - Not Yet Implemented)

Not supported in v1. Will be added in a future version if needed.

## Selection Semantics

### Keyboard Selection

| Action | Behavior |
|--------|----------|
| `Cmd/Ctrl+A` | Select all chips (clears input focus) |
| `Escape` | Clear all chip selections |
| `Click` | Select single chip (clears other selections) |
| `Cmd/Ctrl+Click` | Toggle individual chip selection (multi-select) |

### Selection State

- Selection state is stored in the `Chip.selected` property
- Multiple chips can be selected simultaneously
- Selection is visually distinct (different background color)

## Text Input Semantics (v1.1)

### Input Field Behavior

The component includes a text input field for creating new chips:

```tsx
<ChipInput
  value={chips}
  onChange={setChips}
  onAdd={(text) => createChip(text)}
  separators={[',']}  // Optional: create chips on comma
/>
```

### Chip Creation

| Action | Behavior |
|--------|----------|
| `Enter` key | Create chip from input text, clear input |
| Separator character (e.g., `,`) | Create chip, clear input (if configured) |
| Empty input + `Enter` | No-op (no chip created) |
| Whitespace only + `Enter` | Trimmed, no chip created if empty |

**Guarantees:**
- Input is cleared after successful chip creation
- Focus remains on input after chip creation
- If `onAdd` returns `null`, no chip is created but input keeps text
- Chip creation never corrupts state

### Focus Management

- Clicking container focuses the input
- Input clears chip selection when focused
- Focus moves to input after chip removal
- `Tab` / `Shift+Tab` moves focus out of component

### Placeholder

- Shows when input is empty AND no chips exist
- Hidden when chips exist (even if input is empty)

## Deletion Semantics

| Action | Behavior |
|--------|----------|
| `Delete` key | Remove all selected chips |
| `Backspace` key (with selection) | Remove all selected chips |
| `Backspace` key (no selection, empty input) | Remove last chip |
| `Backspace` key (no selection, text in input) | No chip removed (normal text deletion) |

**Guarantees:**
- Deletion is immediate (no confirmation)
- Deleted chips are removed from state via `onChange`
- Focus moves to input after removal
- Component never enters an invalid state after deletion

## Clipboard Behavior (Baseline)

### Copy (Cmd/Ctrl+C)

```tsx
<ChipInput
  value={chips}
  onChange={setChips}
  onCopy={(selectedChips) => {
    // Serialize to clipboard
    const serialized = JSON.stringify(selectedChips);
    navigator.clipboard.writeText(serialized);
  }}
/>
```

**Behavior:**
- Only selected chips are copied
- `onCopy` callback receives array of selected chips
- Parent is responsible for clipboard serialization format
- Default: no-op if `onCopy` is not provided

### Paste (Cmd/Ctrl+V)

```tsx
<ChipInput
  value={chips}
  onChange={setChips}
  onPaste={(clipboardData) => {
    // Deserialize from clipboard
    try {
      const parsed = JSON.parse(clipboardData);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }}
/>
```

**Behavior:**
- `onPaste` callback receives clipboard text data
- Parent returns array of chips to add, or `null` to reject
- Pasted chips are appended to existing chips via `onChange`
- Default: no-op if `onPaste` is not provided

**Cross-Instance Guarantee:**
- Chips copied from one ChipInput can be pasted into another
- Format compatibility is maintained by the parent's serialization logic

## Focus & Caret Management

### Focus Behavior

- Container is focusable (`tabIndex={0}`)
- Keyboard shortcuts work when container has focus
- Clicking a chip does NOT blur the container

### Caret State Guarantees

- Component does NOT manage text caret position (no contenteditable for now)
- Selection is chip-level, not character-level
- No invalid caret states are possible

## Type Definitions

```typescript
interface Chip {
  id: string;           // Unique identifier
  label: string;        // Display text
  value?: string;       // Optional value (defaults to label)
  selected?: boolean;   // Selection state
  disabled?: boolean;   // Disabled state
}

interface ChipInputProps {
  value: Chip[];                              // SOURCE OF TRUTH
  onChange: (chips: Chip[]) => void;          // State update callback
  placeholder?: string;                       // Empty state text
  disabled?: boolean;                         // Disable all interactions
  className?: string;                         // Custom CSS class
  onCopy?: (chips: Chip[]) => void;          // Copy callback
  onPaste?: (data: string) => Chip[] | null; // Paste callback
  onAdd?: (text: string) => Chip | null;     // Add chip from text (v1.1)
  separators?: string[];                     // Create chips on these chars (v1.1)
}
```

## Error Handling

### Invalid Props

| Scenario | Behavior |
|----------|----------|
| `value` is not an array | Component will error (undefined behavior) |
| `onChange` is not a function | Component will error on state change |
| Chip missing `id` or `label` | Component will error on render |

**Note:** Prop validation is the parent's responsibility (v1)

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty `value` array | Shows placeholder text |
| All chips disabled | Selection/deletion still work (chips are visually disabled) |
| Rapid keyboard events | Each event is processed independently (no debouncing) |

## Performance Characteristics

- **Re-render trigger:** Only when `value` prop changes
- **Selection update:** O(n) where n = number of chips
- **Deletion:** O(n) where n = number of chips
- **No virtualization:** All chips are rendered (optimize later if needed)

## Accessibility (Baseline - To Be Expanded)

- Container is keyboard-focusable
- Keyboard shortcuts are documented
- Visual selection feedback provided

**Note:** Full a11y (ARIA, screen readers) is deferred to a future issue.

## What This Contract Does NOT Cover (Yet)

The following are explicitly out of scope for v1:

1. **Drag and drop** (separate issue)
2. **Advanced clipboard formats** (HTML, custom MIME types)
3. **Undo/redo** (may be added later)
4. **Chip editing** (inline label editing)
5. **Custom chip rendering** (render props, slots)
6. **Validation** (max chips, duplicate prevention)
7. **Animations** (enter/exit transitions)
8. **Full accessibility** (ARIA, screen reader announcements)

## Breaking Changes Policy

This contract is versioned. Breaking changes will:

1. Increment major version
2. Provide migration guide
3. Maintain backward compatibility for at least one minor version

## References

- Issue: `chip-input-7o2`
- Epic: `chip-input-11c`
- Related: `chip-input-bde` (clipboard format), `chip-input-bxw` (selection semantics)
