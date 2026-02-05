import type { KeyboardEvent, ChangeEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
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

  /**
   * Callback when a new chip should be added from text input
   * Receives the text and should return a chip or null to reject
   */
  onAdd?: (text: string) => Chip | null;

  /**
   * Characters that trigger chip creation (in addition to Enter)
   * Default: [] (only Enter creates chips)
   * Example: [',', ';'] to create chips on comma or semicolon
   */
  separators?: string[];
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
  onAdd,
  separators = [],
}: ChipInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

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
    // Only update if there are selected chips
    if (selectedChips.length === 0) return;
    
    const updatedChips = value.map((chip) => ({
      ...chip,
      selected: false,
    }));
    onChange(updatedChips);
  }, [value, selectedChips, onChange]);

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
      // Focus input after removal
      inputRef.current?.focus();
    } else if (value.length > 0 && inputValue === '') {
      // Remove last chip only if input is empty
      const remainingChips = value.slice(0, -1);
      onChange(remainingChips);
      // Focus input after removal
      inputRef.current?.focus();
    }
  }, [selectedChips, value, inputValue, onChange]);

  /**
   * Create chip from input text
   */
  const createChipFromInput = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || !onAdd) return;

    const newChip = onAdd(trimmedValue);
    if (newChip) {
      // Clear selection and add new chip
      const updatedChips = [
        ...value.map((chip) => ({ ...chip, selected: false })),
        newChip,
      ];
      onChange(updatedChips);
      setInputValue('');
      // Keep focus on input
      inputRef.current?.focus();
    }
  }, [inputValue, onAdd, value, onChange]);

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
      if (newChips && Array.isArray(newChips) && newChips.length > 0) {
        // Clear selection and append new chips
        const updatedChips = [
          ...value.map((chip) => ({ ...chip, selected: false })),
          ...newChips,
        ];
        onChange(updatedChips);
        // Clear input after successful paste
        setInputValue('');
      }
    },
    [onPaste, value, onChange]
  );

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;

      // Check for separator characters
      if (separators.length > 0 && onAdd) {
        const lastChar = newValue[newValue.length - 1];
        if (lastChar && separators.includes(lastChar)) {
          // Remove separator and create chip
          const textWithoutSeparator = newValue.slice(0, -1).trim();
          if (textWithoutSeparator) {
            const newChip = onAdd(textWithoutSeparator);
            if (newChip) {
              const updatedChips = [
                ...value.map((chip) => ({ ...chip, selected: false })),
                newChip,
              ];
              onChange(updatedChips);
              setInputValue('');
              return;
            }
          }
          setInputValue('');
          return;
        }
      }

      setInputValue(newValue);
    },
    [separators, onAdd, value, onChange]
  );

  /**
   * Handle input keydown
   */
  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      // Enter: Create chip
      if (event.key === 'Enter') {
        event.preventDefault();
        createChipFromInput();
        return;
      }

      // Backspace: Remove last chip ONLY if input is empty
      if (event.key === 'Backspace' && inputValue === '') {
        // Only prevent default if there are chips to remove
        if (value.length > 0 || selectedChips.length > 0) {
          event.preventDefault();
          removeChips();
        }
        return;
      }

      // Escape: Clear input
      if (event.key === 'Escape') {
        event.preventDefault();
        setInputValue('');
        clearSelection();
        return;
      }
    },
    [createChipFromInput, removeChips, clearSelection, inputValue, value, selectedChips]
  );

  /**
   * Handle input focus - clear chip selection
   */
  const handleInputFocus = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return (
    <div
      ref={containerRef}
      className={`chip-input ${className}`}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
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
          onClick={(e) => {
            e.stopPropagation();
            handleChipClick(chip.id, e);
          }}
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

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onFocus={handleInputFocus}
        disabled={disabled}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{
          flex: 1,
          minWidth: '120px',
          border: 'none',
          outline: 'none',
          padding: '4px',
          fontSize: '14px',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
}
