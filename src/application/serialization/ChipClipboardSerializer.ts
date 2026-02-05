import type { Chip } from '../../domain/entities/Chip';

/**
 * ChipClipboard Serialization Format
 * 
 * DESIGN DECISIONS:
 * 1. Use text/plain (universal compatibility)
 * 2. Marker prefix to identify ChipInput data
 * 3. JSON payload for structured data
 * 4. Deterministic: same chips = same output
 * 5. Order preserved
 * 
 * FORMAT:
 * __CHIPINPUT__:{"version":1,"chips":[{"id":"1","label":"React","value":"React"}]}
 * 
 * FALLBACK (for normal inputs):
 * If marker is not detected, treat as comma-separated labels
 */

export interface SerializedChipData {
  version: 1;
  chips: Array<{
    id: string;
    label: string;
    value?: string;
  }>;
}

const CLIPBOARD_MARKER = '__CHIPINPUT__:';
const CLIPBOARD_VERSION = 1;

/**
 * Clipboard serialization service for ChipInput
 */
export class ChipClipboardSerializer {
  /**
   * Serialize chips to clipboard format
   * 
   * @param chips - Array of chips to serialize
   * @returns Deterministic string representation
   * 
   * GUARANTEES:
   * - Same chips (same order) always produce same output
   * - Order is preserved
   * - Only id, label, value are serialized (no selection state)
   */
  static serialize(chips: Chip[]): string {
    // Extract only relevant fields (no selection state)
    const cleanChips = chips.map((chip) => ({
      id: chip.id,
      label: chip.label,
      value: chip.value,
    }));

    const data: SerializedChipData = {
      version: CLIPBOARD_VERSION,
      chips: cleanChips,
    };

    return `${CLIPBOARD_MARKER}${JSON.stringify(data)}`;
  }

  /**
   * Deserialize clipboard data to chips
   * 
   * @param clipboardData - Raw clipboard string
   * @returns Array of chips, or null if invalid
   * 
   * BEHAVIOR:
   * - If data has CHIPINPUT marker: parse as JSON
   * - If data is plain text: attempt comma-separated parsing
   * - If parsing fails: return null
   */
  static deserialize(clipboardData: string): Chip[] | null {
    // Case 1: ChipInput format (with marker)
    if (clipboardData.startsWith(CLIPBOARD_MARKER)) {
      return this.deserializeChipInputFormat(clipboardData);
    }

    // Case 2: Plain text fallback (comma-separated labels)
    return this.deserializePlainTextFallback(clipboardData);
  }

  /**
   * Parse ChipInput-specific format
   */
  private static deserializeChipInputFormat(
    clipboardData: string
  ): Chip[] | null {
    try {
      const jsonString = clipboardData.slice(CLIPBOARD_MARKER.length);
      const data = JSON.parse(jsonString) as SerializedChipData;

      // Validate structure
      if (
        !data ||
        typeof data.version !== 'number' ||
        !Array.isArray(data.chips)
      ) {
        return null;
      }

      // Version check (future-proof)
      if (data.version !== CLIPBOARD_VERSION) {
        console.warn(
          `ChipInput: Unsupported clipboard version ${data.version}`
        );
        return null;
      }

      // Reconstruct chips (generate new IDs to avoid conflicts)
      return data.chips.map((chipData) => ({
        id: crypto.randomUUID(), // New ID for pasted chips
        label: chipData.label,
        value: chipData.value ?? chipData.label,
        selected: false,
        disabled: false,
      }));
    } catch (error) {
      console.error('ChipInput: Failed to parse clipboard data', error);
      return null;
    }
  }

  /**
   * Parse plain text as comma-separated labels (fallback)
   * 
   * BEHAVIOR:
   * - Split by comma
   * - Trim whitespace
   * - Filter empty strings
   * - Generate chips with labels
   */
  private static deserializePlainTextFallback(
    clipboardData: string
  ): Chip[] | null {
    try {
      const labels = clipboardData
        .split(',')
        .map((label) => label.trim())
        .filter((label) => label.length > 0);

      if (labels.length === 0) {
        return null;
      }

      return labels.map((label) => ({
        id: crypto.randomUUID(),
        label,
        value: label,
        selected: false,
        disabled: false,
      }));
    } catch {
      return null;
    }
  }

  /**
   * Get human-readable representation (for fallback in normal inputs)
   * 
   * @param chips - Array of chips
   * @returns Comma-separated labels
   */
  static toPlainText(chips: Chip[]): string {
    return chips.map((chip) => chip.label).join(', ');
  }

  /**
   * Check if clipboard data is ChipInput format
   */
  static isChipInputFormat(clipboardData: string): boolean {
    return clipboardData.startsWith(CLIPBOARD_MARKER);
  }
}
