/**
 * Chip entity - Core domain model for chip input component
 */
export interface Chip {
  /**
   * Unique identifier for the chip
   */
  id: string;

  /**
   * Display label for the chip
   */
  label: string;

  /**
   * Optional value (defaults to label if not provided)
   */
  value?: string;

  /**
   * Whether the chip is selected
   */
  selected?: boolean;

  /**
   * Whether the chip is disabled
   */
  disabled?: boolean;
}

/**
 * Creates a new chip with default values
 */
export function createChip(
  label: string,
  overrides?: Partial<Chip>
): Chip {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    label,
    value: overrides?.value ?? label,
    selected: overrides?.selected ?? false,
    disabled: overrides?.disabled ?? false,
  };
}
