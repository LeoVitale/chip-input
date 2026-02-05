import { describe, it, expect } from 'vitest';
import { ChipClipboardSerializer } from './ChipClipboardSerializer';
import type { Chip } from '../../domain/entities/Chip';
import { createChip } from '../../domain/entities/Chip';

describe('ChipClipboardSerializer', () => {
  const mockChips: Chip[] = [
    createChip('React', { id: '1' }),
    createChip('TypeScript', { id: '2' }),
    createChip('Vite', { id: '3' }),
  ];

  describe('Acceptance Criterion: Define clipboard format', () => {
    it('should use text/plain with marker prefix', () => {
      const serialized = ChipClipboardSerializer.serialize(mockChips);

      expect(serialized).toContain('__CHIPINPUT__:');
      expect(serialized).toContain('{"version":1');
    });

    it('should include version field for future compatibility', () => {
      const serialized = ChipClipboardSerializer.serialize(mockChips);
      const parsed = JSON.parse(serialized.replace('__CHIPINPUT__:', ''));

      expect(parsed.version).toBe(1);
    });

    it('should serialize chips as JSON array', () => {
      const serialized = ChipClipboardSerializer.serialize(mockChips);
      const parsed = JSON.parse(serialized.replace('__CHIPINPUT__:', ''));

      expect(Array.isArray(parsed.chips)).toBe(true);
      expect(parsed.chips).toHaveLength(3);
    });

    it('should identify ChipInput format with marker check', () => {
      const serialized = ChipClipboardSerializer.serialize(mockChips);

      expect(ChipClipboardSerializer.isChipInputFormat(serialized)).toBe(true);
      expect(ChipClipboardSerializer.isChipInputFormat('plain text')).toBe(
        false
      );
    });
  });

  describe('Acceptance Criterion: Copy generates deterministic payload', () => {
    it('should generate identical output for same chips in same order', () => {
      const output1 = ChipClipboardSerializer.serialize(mockChips);
      const output2 = ChipClipboardSerializer.serialize(mockChips);

      expect(output1).toBe(output2);
    });

    it('should preserve order of chips', () => {
      const serialized = ChipClipboardSerializer.serialize(mockChips);
      const parsed = JSON.parse(serialized.replace('__CHIPINPUT__:', ''));

      expect(parsed.chips[0].label).toBe('React');
      expect(parsed.chips[1].label).toBe('TypeScript');
      expect(parsed.chips[2].label).toBe('Vite');
    });

    it('should generate different output when order changes', () => {
      const reversedChips = [...mockChips].reverse();
      const output1 = ChipClipboardSerializer.serialize(mockChips);
      const output2 = ChipClipboardSerializer.serialize(reversedChips);

      expect(output1).not.toBe(output2);
    });

    it('should only serialize id, label, value (no selection state)', () => {
      const selectedChips = mockChips.map((chip) => ({
        ...chip,
        selected: true,
      }));

      const serialized = ChipClipboardSerializer.serialize(selectedChips);
      const parsed = JSON.parse(serialized.replace('__CHIPINPUT__:', ''));

      parsed.chips.forEach((chip: { id: string; label: string; value?: string }) => {
        expect(chip).toHaveProperty('id');
        expect(chip).toHaveProperty('label');
        expect(chip).not.toHaveProperty('selected');
        expect(chip).not.toHaveProperty('disabled');
      });
    });
  });

  describe('Acceptance Criterion: Paste reconstructs chips correctly', () => {
    it('should deserialize ChipInput format back to chips', () => {
      const serialized = ChipClipboardSerializer.serialize(mockChips);
      const deserialized = ChipClipboardSerializer.deserialize(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized).toHaveLength(3);
      expect(deserialized![0].label).toBe('React');
      expect(deserialized![1].label).toBe('TypeScript');
      expect(deserialized![2].label).toBe('Vite');
    });

    it('should generate new IDs for pasted chips (avoid conflicts)', () => {
      const serialized = ChipClipboardSerializer.serialize(mockChips);
      const deserialized = ChipClipboardSerializer.deserialize(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized![0].id).not.toBe('1');
      expect(deserialized![1].id).not.toBe('2');
      expect(deserialized![2].id).not.toBe('3');
    });

    it('should preserve labels and values', () => {
      const chipsWithCustomValues: Chip[] = [
        createChip('Display Name', { id: '1', value: 'internal-value' }),
        createChip('Another', { id: '2', value: 'custom-value' }),
      ];

      const serialized = ChipClipboardSerializer.serialize(chipsWithCustomValues);
      const deserialized = ChipClipboardSerializer.deserialize(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized![0].label).toBe('Display Name');
      expect(deserialized![0].value).toBe('internal-value');
      expect(deserialized![1].label).toBe('Another');
      expect(deserialized![1].value).toBe('custom-value');
    });

    it('should set selected=false for all pasted chips', () => {
      const serialized = ChipClipboardSerializer.serialize(mockChips);
      const deserialized = ChipClipboardSerializer.deserialize(serialized);

      expect(deserialized).not.toBeNull();
      deserialized!.forEach((chip) => {
        expect(chip.selected).toBe(false);
      });
    });

    it('should handle empty chips array', () => {
      const serialized = ChipClipboardSerializer.serialize([]);
      const deserialized = ChipClipboardSerializer.deserialize(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized).toHaveLength(0);
    });

    it('should return null for invalid JSON', () => {
      const deserialized = ChipClipboardSerializer.deserialize(
        '__CHIPINPUT__:invalid json'
      );

      expect(deserialized).toBeNull();
    });

    it('should return null for malformed structure', () => {
      const deserialized = ChipClipboardSerializer.deserialize(
        '__CHIPINPUT__:{"version":1,"chips":"not-an-array"}'
      );

      expect(deserialized).toBeNull();
    });

    it('should warn and return null for unsupported version', () => {
      const deserialized = ChipClipboardSerializer.deserialize(
        '__CHIPINPUT__:{"version":999,"chips":[]}'
      );

      expect(deserialized).toBeNull();
    });
  });

  describe('Acceptance Criterion: Fallback for pasting into normal input', () => {
    it('should parse comma-separated labels as plain text fallback', () => {
      const plainText = 'React, TypeScript, Vite';
      const deserialized = ChipClipboardSerializer.deserialize(plainText);

      expect(deserialized).not.toBeNull();
      expect(deserialized).toHaveLength(3);
      expect(deserialized![0].label).toBe('React');
      expect(deserialized![1].label).toBe('TypeScript');
      expect(deserialized![2].label).toBe('Vite');
    });

    it('should trim whitespace in plain text fallback', () => {
      const plainText = '  React  ,  TypeScript  ,  Vite  ';
      const deserialized = ChipClipboardSerializer.deserialize(plainText);

      expect(deserialized).not.toBeNull();
      expect(deserialized![0].label).toBe('React');
      expect(deserialized![1].label).toBe('TypeScript');
      expect(deserialized![2].label).toBe('Vite');
    });

    it('should filter empty labels in plain text fallback', () => {
      const plainText = 'React, , TypeScript, ,Vite';
      const deserialized = ChipClipboardSerializer.deserialize(plainText);

      expect(deserialized).not.toBeNull();
      expect(deserialized).toHaveLength(3);
    });

    it('should return null for empty plain text', () => {
      const deserialized = ChipClipboardSerializer.deserialize('');

      expect(deserialized).toBeNull();
    });

    it('should return null for plain text with only commas', () => {
      const deserialized = ChipClipboardSerializer.deserialize(',,,,');

      expect(deserialized).toBeNull();
    });

    it('should generate chips with labels as values in plain text fallback', () => {
      const plainText = 'React, TypeScript';
      const deserialized = ChipClipboardSerializer.deserialize(plainText);

      expect(deserialized).not.toBeNull();
      expect(deserialized![0].value).toBe('React');
      expect(deserialized![1].value).toBe('TypeScript');
    });
  });

  describe('Utility: toPlainText', () => {
    it('should convert chips to comma-separated labels', () => {
      const plainText = ChipClipboardSerializer.toPlainText(mockChips);

      expect(plainText).toBe('React, TypeScript, Vite');
    });

    it('should handle empty array', () => {
      const plainText = ChipClipboardSerializer.toPlainText([]);

      expect(plainText).toBe('');
    });

    it('should handle single chip', () => {
      const plainText = ChipClipboardSerializer.toPlainText([mockChips[0]]);

      expect(plainText).toBe('React');
    });
  });

  describe('Cross-instance behavior', () => {
    it('should allow copying from one instance and pasting to another', () => {
      // Simulate ChipInput #1
      const instance1Chips = mockChips;
      const serialized = ChipClipboardSerializer.serialize(instance1Chips);

      // Simulate ChipInput #2
      const instance2Chips = ChipClipboardSerializer.deserialize(serialized);

      expect(instance2Chips).not.toBeNull();
      expect(instance2Chips!.map((c) => c.label)).toEqual(
        instance1Chips.map((c) => c.label)
      );
      expect(instance2Chips!.map((c) => c.id)).not.toEqual(
        instance1Chips.map((c) => c.id)
      );
    });
  });
});
