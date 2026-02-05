import type { KeyboardEvent } from 'react';
import { useCallback, useRef } from 'react';
import type { Chip } from '../../domain/entities/Chip';

/**
 * ChipInput Props - Controlled component API
 * 
 * SOURCE OF TRUTH: STATE (controlled via value/onChange)
 */
export interface ChipInputProps {
  /**
   * Array of chips to display (controlled)
   * This is the single source of truth for the component state
   */
  value: Chip[];

  /**
   * Callback when chips change (add, remove, reorder)
   */
  onChange: (chips: Chip[]) => void;

  /**
   * Placeholder text when no chips are present
   */
  placeholder?: string;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Optional class name for styling
   */
  className?: string;

  /**
   * Callback when chips are copied (for clipboard integration)
   * Returns the chips that should be serialized to clipboard
   */
  onCopy?: (chips: Chip[]) => void;

  /**
   * Callback when paste is attempted
   * Receives clipboard data and should return chips to add
   */
  onPaste?: (data: string) => Chip[] | null;
}

/**
 * ChipInput Component - Contenteditable-based chip input
 * 
 * BEHAVIORAL CONTRACT:
 * 
 * 1. SOURCE OF TRUTH: State (value prop), NOT the DOM
 * 2. CONTROLLED: Must provide value + onChange
 * 3. SELECTION:
 *    - Cmd/Ctrl+A selects all chips
 *    - Click selects single chip (clears other selections)
 *    - Cmd/Ctrl+Click toggles individual chip selection
 * 4. DELETION:
 *    - Delete/Backspace removes all selected chips
 *    - If no selection, Backspace deletes last chip
 * 5. CLIPBOARD:
 *    - Copy (Cmd/Ctrl+C) serializes selected chips
 *    - Paste (Cmd/Ctrl+V) deserializes and adds chips
 */
export function ChipInput({
  value,
  onChange,
  placeholder = 'Add chips...',
  disabled = false,
  className = '',
  onCopy,
  onPaste,
}: ChipInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Get all selected chips
   */
  const selectedChips = value.filter((chip) => chip.selected);

  /**
   * Select all chips (Cmd/Ctrl+A)
   */
  const selectAllChips = useCallback(() => {
    const updatedChips = value.map((chip) => ({
      ...chip,
      selected: true,
    }));
    onChange(updatedChips);
  }, [value, onChange]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    const updatedChips = value.map((chip) => ({
      ...chip,
      selected: false,
    }));
    onChange(updatedChips);
  }, [value, onChange]);

  /**
   * Toggle chip selection
   */
  const toggleChipSelection = useCallback(
    (chipId: string, multiSelect: boolean) => {
      const updatedChips = value.map((chip) => {
        if (chip.id === chipId) {
          return { ...chip, selected: !chip.selected };
        }
        // Clear other selections if not multi-selecting
        return multiSelect ? chip : { ...chip, selected: false };
      });
      onChange(updatedChips);
    },
    [value, onChange]
  );

  /**
   * Remove selected chips or last chip if none selected
   */
  const removeChips = useCallback(() => {
    if (selectedChips.length > 0) {
      // Remove all selected chips
      const remainingChips = value.filter((chip) => !chip.selected);
      onChange(remainingChips);
    } else if (value.length > 0) {
      // Remove last chip if no selection
      const remainingChips = value.slice(0, -1);
      onChange(remainingChips);
    }
  }, [selectedChips, value, onChange]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;

      // Cmd/Ctrl+A: Select all chips
      if (isCmdOrCtrl && event.key === 'a') {
        event.preventDefault();
        selectAllChips();
        return;
      }

      // Cmd/Ctrl+C: Copy selected chips
      if (isCmdOrCtrl && event.key === 'c' && selectedChips.length > 0) {
        event.preventDefault();
        onCopy?.(selectedChips);
        return;
      }

      // Cmd/Ctrl+V: Paste chips (handled by onPaste event below)
      if (isCmdOrCtrl && event.key === 'v') {
        // Paste event handler will be triggered
        return;
      }

      // Delete/Backspace: Remove chips
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        removeChips();
        return;
      }

      // Escape: Clear selection
      if (event.key === 'Escape') {
        event.preventDefault();
        clearSelection();
        return;
      }
    },
    [selectAllChips, clearSelection, removeChips, selectedChips, onCopy]
  );

  /**
   * Handle chip click
   */
  const handleChipClick = useCallback(
    (chipId: string, event: React.MouseEvent) => {
      const multiSelect = event.metaKey || event.ctrlKey;
      toggleChipSelection(chipId, multiSelect);
    },
    [toggleChipSelection]
  );

  /**
   * Handle paste event
   */
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      if (!onPaste) return;

      event.preventDefault();
      const clipboardData = event.clipboardData.getData('text/plain');

      const newChips = onPaste(clipboardData);
      if (newChips && Array.isArray(newChips)) {
        // Clear selection and append new chips
        const updatedChips = [
          ...value.map((chip) => ({ ...chip, selected: false })),
          ...newChips,
        ];
        onChange(updatedChips);
      }
    },
    [onPaste, value, onChange]
  );

  return (
    <div
      ref={containerRef}
      className={`chip-input ${className}`}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      tabIndex={disabled ? -1 : 0}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        minHeight: '40px',
        cursor: disabled ? 'not-allowed' : 'text',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Render chips */}
      {value.map((chip) => (
        <div
          key={chip.id}
          onClick={(e) => handleChipClick(chip.id, e)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            backgroundColor: chip.selected ? '#007bff' : '#e0e0e0',
            color: chip.selected ? '#fff' : '#000',
            borderRadius: '16px',
            fontSize: '14px',
            cursor: chip.disabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            opacity: chip.disabled ? 0.5 : 1,
          }}
        >
          {chip.label}
        </div>
      ))}

      {/* Placeholder when empty */}
      {value.length === 0 && (
        <span
          style={{
            color: '#999',
            fontSize: '14px',
            pointerEvents: 'none',
          }}
        >
          {placeholder}
        </span>
      )}
    </div>
  );
}
