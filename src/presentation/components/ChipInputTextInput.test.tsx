import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ChipInput } from './ChipInput';
import type { Chip } from '../../domain/entities/Chip';
import { createChip } from '../../domain/entities/Chip';

describe('ChipInput - Text Input Feature (chip-input-11c.1)', () => {
  const mockChips: Chip[] = [
    createChip('React', { id: '1' }),
    createChip('TypeScript', { id: '2' }),
  ];

  describe('Acceptance Criterion: Text input field visible and focusable', () => {
    it('should render a text input within the chip container', () => {
      const onChange = vi.fn();
      render(<ChipInput value={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should be focusable via click or direct focus', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={[]} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(input).toHaveFocus();
    });

    it('should focus input when clicking container', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<ChipInput value={mockChips} onChange={onChange} />);
      const chipInputContainer = container.querySelector('.chip-input')!;

      await user.click(chipInputContainer);

      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });

  describe('Acceptance Criterion: User can type text naturally', () => {
    it('should allow typing text into the input', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={[]} onChange={onChange} onAdd={() => null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'New Chip');

      expect(input).toHaveValue('New Chip');
    });

    it('should update input value as user types', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={[]} onChange={onChange} onAdd={() => null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test');

      expect(input).toHaveValue('Test');
    });
  });

  describe('Acceptance Criterion: Enter key creates chip and clears input', () => {
    it('should create chip when Enter is pressed', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn().mockReturnValue(createChip('New Chip'));
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} onAdd={onAdd} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'New Chip');
      await user.keyboard('{Enter}');

      expect(onAdd).toHaveBeenCalledWith('New Chip');
      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React' }),
          expect.objectContaining({ label: 'TypeScript' }),
          expect.objectContaining({ label: 'New Chip' }),
        ])
      );
    });

    it('should clear input after creating chip', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn().mockReturnValue(createChip('Test'));
      const user = userEvent.setup();

      render(<ChipInput value={[]} onChange={onChange} onAdd={onAdd} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test{Enter}');

      expect(input).toHaveValue('');
    });

    it('should not create chip if input is empty', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} onAdd={onAdd} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(onAdd).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should trim whitespace before creating chip', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn().mockReturnValue(createChip('Trimmed'));
      const user = userEvent.setup();

      render(<ChipInput value={[]} onChange={onChange} onAdd={onAdd} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '  Trimmed  {Enter}');

      expect(onAdd).toHaveBeenCalledWith('Trimmed');
    });

    it('should not create chip if onAdd returns null', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn().mockReturnValue(null);
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} onAdd={onAdd} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Rejected');
      await user.keyboard('{Enter}');

      expect(onAdd).toHaveBeenCalledWith('Rejected');
      expect(onChange).not.toHaveBeenCalled();
      // Input should still have the rejected text so user can correct it
      expect(input).toHaveValue('Rejected');
    });

    it('should keep focus on input after creating chip', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn().mockReturnValue(createChip('Test'));
      const user = userEvent.setup();

      render(<ChipInput value={[]} onChange={onChange} onAdd={onAdd} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test{Enter}');

      expect(input).toHaveFocus();
    });
  });

  describe('Acceptance Criterion: Backspace removes last chip when input empty', () => {
    it('should remove last chip when Backspace pressed with empty input', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} onAdd={() => null} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React' }),
        ])
      );
    });

    it('should not remove chip when Backspace pressed with text in input', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} onAdd={() => null} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'Some text');
      
      // Backspace should work normally (remove character from input, not chip)
      await user.keyboard('{Backspace}');

      // The important part: onChange should not be called (chips unchanged)
      expect(onChange).not.toHaveBeenCalled();
      // Input should have text (backspace removes one char via normal input behavior)
      expect(input.value.length).toBeGreaterThan(0);
    });

    it('should focus input after removing chip', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} onAdd={() => null} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(input).toHaveFocus();
    });
  });

  describe('Acceptance Criterion: Placeholder behavior', () => {
    it('should show placeholder when input empty and no chips', () => {
      const onChange = vi.fn();
      render(
        <ChipInput
          value={[]}
          onChange={onChange}
          placeholder="Type to add chips..."
        />
      );

      expect(screen.getByPlaceholderText('Type to add chips...')).toBeInTheDocument();
    });

    it('should hide placeholder when chips exist', () => {
      const onChange = vi.fn();
      render(
        <ChipInput
          value={mockChips}
          onChange={onChange}
          placeholder="Type to add chips..."
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('placeholder', 'Type to add chips...');
      expect(input).toHaveAttribute('placeholder', '');
    });
  });

  describe('Acceptance Criterion: Tab/Escape behavior', () => {
    it('should clear input when Escape is pressed', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={mockChips} onChange={onChange} onAdd={() => null} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Some text');
      await user.keyboard('{Escape}');

      expect(input).toHaveValue('');
    });

    it('should allow Tab to move focus out', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <div>
          <ChipInput value={mockChips} onChange={onChange} onAdd={() => null} />
          <button>Next Field</button>
        </div>
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Tab}');

      const button = screen.getByRole('button');
      expect(button).toHaveFocus();
    });
  });

  describe('Acceptance Criterion: Configurable separators', () => {
    it('should create chip when separator is typed', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn().mockReturnValue(createChip('Test'));
      const user = userEvent.setup();

      render(
        <ChipInput
          value={[]}
          onChange={onChange}
          onAdd={onAdd}
          separators={[',']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test,');

      expect(onAdd).toHaveBeenCalledWith('Test');
      expect(onChange).toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('should support multiple separators', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn()
        .mockReturnValueOnce(createChip('First'))
        .mockReturnValueOnce(createChip('Second'));
      const user = userEvent.setup();

      render(
        <ChipInput
          value={[]}
          onChange={onChange}
          onAdd={onAdd}
          separators={[',', ';']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'First,');
      await user.type(input, 'Second;');

      expect(onAdd).toHaveBeenCalledWith('First');
      expect(onAdd).toHaveBeenCalledWith('Second');
    });

    it('should trim text before creating chip with separator', async () => {
      const onChange = vi.fn();
      const onAdd = vi.fn().mockReturnValue(createChip('Trimmed'));
      const user = userEvent.setup();

      render(
        <ChipInput
          value={[]}
          onChange={onChange}
          onAdd={onAdd}
          separators={[',']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, '  Trimmed  ,');

      expect(onAdd).toHaveBeenCalledWith('Trimmed');
    });
  });

  describe('Acceptance Criterion: Focus management', () => {
    it('should clear chip selection when input receives focus', async () => {
      const selectedChips = mockChips.map((chip) => ({
        ...chip,
        selected: true,
      }));
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<ChipInput value={selectedChips} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'React', selected: false }),
          expect.objectContaining({ label: 'TypeScript', selected: false }),
        ])
      );
    });
  });
});
