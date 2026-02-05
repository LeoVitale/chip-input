import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ChipInput } from './ChipInput';
import type { Chip } from '../../domain/entities/Chip';
import { createChip } from '../../domain/entities/Chip';

describe('ChipInput - Contract & API Tests', () => {
  const mockChips: Chip[] = [
    createChip('React', { id: '1' }),
    createChip('TypeScript', { id: '2' }),
    createChip('Vite', { id: '3' }),
  ];

  describe('Acceptance Criterion: Source of Truth (state vs DOM)', () => {
    it('should render chips from value prop (state is source of truth)', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ChipInput value={mockChips} onChange={onChange} />
      );

      expect(container.textContent).toContain('React');
      expect(container.textContent).toContain('TypeScript');
      expect(container.textContent).toContain('Vite');
    });

    it('should not render chips that are not in value prop', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ChipInput value={[mockChips[0]]} onChange={onChange} />
      );

      expect(container.textContent).toContain('React');
      expect(container.textContent).not.toContain('TypeScript');
      expect(container.textContent).not.toContain('Vite');
    });
  });

  describe('Acceptance Criterion: Controlled vs Uncontrolled', () => {
    it('should require value and onChange props (controlled)', () => {
      const onChange = vi.fn();
      const { container } = render(
        <ChipInput value={mockChips} onChange={onChange} />
      );

      expect(container.querySelector('.chip-input')).toBeInTheDocument();
    });

    it('should call onChange when chips are modified', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} onAdd={() => null} />);

      // Focus the input field
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      // Backspace with empty input removes last chip
      await user.keyboard('{Backspace}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React' }),
          expect.objectContaining({ label: 'TypeScript' }),
        ])
      );
    });
  });

  describe('Acceptance Criterion: Cmd/Ctrl+A selects all chips', () => {
    it('should select all chips when Cmd+A is pressed (Mac)', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<ChipInput value={mockChips} onChange={onChange} />);

      const chipInputContainer = container.querySelector('.chip-input')!;
      await user.click(chipInputContainer);

      await user.keyboard('{Meta>}a{/Meta}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React', selected: true }),
          expect.objectContaining({ label: 'TypeScript', selected: true }),
          expect.objectContaining({ label: 'Vite', selected: true }),
        ])
      );
    });

    it('should select all chips when Ctrl+A is pressed (Windows/Linux)', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<ChipInput value={mockChips} onChange={onChange} />);

      const chipInputContainer = container.querySelector('.chip-input')!;
      await user.click(chipInputContainer);

      await user.keyboard('{Control>}a{/Control}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React', selected: true }),
          expect.objectContaining({ label: 'TypeScript', selected: true }),
          expect.objectContaining({ label: 'Vite', selected: true }),
        ])
      );
    });
  });

  describe('Acceptance Criterion: Delete/Backspace removes selected chips', () => {
    it('should remove all selected chips when Delete is pressed', async () => {
      const selectedChips = mockChips.map((chip, index) =>
        index === 1 ? { ...chip, selected: true } : chip
      );
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<ChipInput value={selectedChips} onChange={onChange} />);

      const chipInputContainer = container.querySelector('.chip-input')!;
      await user.click(chipInputContainer);

      await user.keyboard('{Delete}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React' }),
          expect.objectContaining({ label: 'Vite' }),
        ])
      );
      expect(onChange).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({ label: 'TypeScript' }),
        ])
      );
    });

    it('should remove last chip when Backspace is pressed with no selection', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<ChipInput value={mockChips} onChange={onChange} />);

      const chipInputContainer = container.querySelector('.chip-input')!;
      await user.click(chipInputContainer);

      await user.keyboard('{Backspace}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React' }),
          expect.objectContaining({ label: 'TypeScript' }),
        ])
      );
      expect(onChange).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ label: 'Vite' })])
      );
    });
  });

  describe('Acceptance Criterion: Copy/Paste behavior', () => {
    it('should call onCopy with selected chips when Cmd+C is pressed', async () => {
      const selectedChips = mockChips.map((chip, index) =>
        index === 0 || index === 2 ? { ...chip, selected: true } : chip
      );
      const onCopy = vi.fn();
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <ChipInput value={selectedChips} onChange={onChange} onCopy={onCopy} />
      );

      const chipInputContainer = container.querySelector('.chip-input')!;
      await user.click(chipInputContainer);

      await user.keyboard('{Meta>}c{/Meta}');

      expect(onCopy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React', selected: true }),
          expect.objectContaining({ label: 'Vite', selected: true }),
        ])
      );
    });

    it('should call onPaste and add chips when Cmd+V is pressed', async () => {
      const onPaste = vi.fn().mockReturnValue([
        createChip('Pasted1', { id: '4' }),
        createChip('Pasted2', { id: '5' }),
      ]);
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <ChipInput value={mockChips} onChange={onChange} onPaste={onPaste} />
      );

      const chipInputContainer = container.querySelector('.chip-input')!;
      await user.click(chipInputContainer);

      // Simulate paste event
      await user.paste('some clipboard data');

      expect(onPaste).toHaveBeenCalledWith('some clipboard data');
      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React' }),
          expect.objectContaining({ label: 'TypeScript' }),
          expect.objectContaining({ label: 'Vite' }),
          expect.objectContaining({ label: 'Pasted1' }),
          expect.objectContaining({ label: 'Pasted2' }),
        ])
      );
    });

    it('should not crash when onPaste returns null (invalid paste)', async () => {
      const onPaste = vi.fn().mockReturnValue(null);
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <ChipInput value={mockChips} onChange={onChange} onPaste={onPaste} />
      );

      const chipInputContainer = container.querySelector('.chip-input')!;
      await user.click(chipInputContainer);

      await user.paste('invalid data');

      expect(onPaste).toHaveBeenCalledWith('invalid data');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Additional Behaviors', () => {
    it('should show placeholder when value is empty', () => {
      const onChange = vi.fn();
      render(
        <ChipInput
          value={[]}
          onChange={onChange}
          placeholder="Add chips..."
        />
      );

      expect(screen.getByPlaceholderText('Add chips...')).toBeInTheDocument();
    });

    it('should clear selection when Escape is pressed', async () => {
      const selectedChips = mockChips.map((chip) => ({
        ...chip,
        selected: true,
      }));
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<ChipInput value={selectedChips} onChange={onChange} />);

      const chipInputContainer = container.querySelector('.chip-input')!;
      await user.click(chipInputContainer);

      await user.keyboard('{Escape}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React', selected: false }),
          expect.objectContaining({ label: 'TypeScript', selected: false }),
          expect.objectContaining({ label: 'Vite', selected: false }),
        ])
      );
    });

    it('should toggle chip selection on click', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} />);

      const reactChip = screen.getByText('React');
      await user.click(reactChip);

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React', selected: true }),
          expect.objectContaining({ label: 'TypeScript', selected: false }),
          expect.objectContaining({ label: 'Vite', selected: false }),
        ])
      );
    });

    it('should support multi-select with Cmd+Click', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} />);

      const reactChip = screen.getByText('React');
      const viteChip = screen.getByText('Vite');

      await user.click(reactChip);
      await user.keyboard('{Meta>}');
      await user.click(viteChip);
      await user.keyboard('{/Meta}');

      // Should be called twice: once for React, once for Vite
      expect(onChange).toHaveBeenCalled();
    });
  });
});
