import { useState } from 'react';
import { ChipInput } from './presentation/components/ChipInput';
import type { Chip } from './domain/entities/Chip';
import { createChip } from './domain/entities/Chip';
import { ChipClipboardSerializer } from './application/serialization/ChipClipboardSerializer';
import './App.css';

function App() {
  const [chips, setChips] = useState<Chip[]>([
    createChip('React', { id: '1' }),
    createChip('TypeScript', { id: '2' }),
    createChip('Vite', { id: '3' }),
  ]);

  const [chips2, setChips2] = useState<Chip[]>([
    createChip('Node.js', { id: '4' }),
    createChip('Express', { id: '5' }),
  ]);

  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleCopy = (selectedChips: Chip[]) => {
    // Use ChipClipboardSerializer for deterministic serialization
    const serialized = ChipClipboardSerializer.serialize(selectedChips);
    navigator.clipboard.writeText(serialized);
    addLog(`Copied ${selectedChips.length} chip(s) to clipboard (ChipInput format)`);
  };

  const handlePaste = (data: string): Chip[] | null => {
    // Use ChipClipboardSerializer for robust deserialization
    const chips = ChipClipboardSerializer.deserialize(data);
    
    if (chips) {
      const isChipInputFormat = ChipClipboardSerializer.isChipInputFormat(data);
      addLog(
        `Pasted ${chips.length} chip(s) (${
          isChipInputFormat ? 'ChipInput format' : 'plain text fallback'
        })`
      );
      return chips;
    }
    
    addLog('Paste failed: invalid format');
    return null;
  };

  const handleAdd = (text: string): Chip | null => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const newChip = createChip(trimmed);
    addLog(`Created chip: "${trimmed}"`);
    return newChip;
  };

  const handleChange1 = (newChips: Chip[]) => {
    setChips(newChips);
    addLog(`ChipInput 1 updated: ${newChips.length} chip(s)`);
  };

  const handleChange2 = (newChips: Chip[]) => {
    setChips2(newChips);
    addLog(`ChipInput 2 updated: ${newChips.length} chip(s)`);
  };

  const addRandomChip = (target: 1 | 2) => {
    const randomWords = ['JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Ruby', 'PHP'];
    const randomLabel = randomWords[Math.floor(Math.random() * randomWords.length)];
    const newChip = createChip(randomLabel);

    if (target === 1) {
      setChips((prev) => [...prev, newChip]);
      addLog(`Added "${randomLabel}" to ChipInput 1`);
    } else {
      setChips2((prev) => [...prev, newChip]);
      addLog(`Added "${randomLabel}" to ChipInput 2`);
    }
  };

  const clearLog = () => setLog([]);

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>ChipInput - Controlled Component Demo</h1>

      <div style={{ marginBottom: '40px' }}>
        <h2>Instructions</h2>
        <ul style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <li>
            <strong>Type & Enter:</strong> Type text and press Enter to create a chip
          </li>
          <li>
            <strong>Select:</strong> Click a chip to select it, Cmd/Ctrl+Click to multi-select
          </li>
          <li>
            <strong>Select All:</strong> Press Cmd/Ctrl+A
          </li>
          <li>
            <strong>Delete:</strong> Press Delete or Backspace (removes selected chips or last chip if empty)
          </li>
          <li>
            <strong>Copy:</strong> Select chips, then press Cmd/Ctrl+C
          </li>
          <li>
            <strong>Paste:</strong> Press Cmd/Ctrl+V (pastes copied chips)
          </li>
          <li>
            <strong>Clear Selection:</strong> Press Escape
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>ChipInput #1</h3>
        <ChipInput
          value={chips}
          onChange={handleChange1}
          placeholder="Type and press Enter to add chips..."
          onCopy={handleCopy}
          onPaste={handlePaste}
          onAdd={handleAdd}
        />
        <button
          onClick={() => addRandomChip(1)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Add Random Chip
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>ChipInput #2 (Cross-Instance Test)</h3>
        <ChipInput
          value={chips2}
          onChange={handleChange2}
          placeholder="Type to add or paste from ChipInput #1..."
          onCopy={handleCopy}
          onPaste={handlePaste}
          onAdd={handleAdd}
        />
        <button
          onClick={() => addRandomChip(2)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Add Random Chip
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Current State</h3>
        <div
          style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        >
          <div>
            <strong>ChipInput #1:</strong> {chips.length} chip(s) |{' '}
            {chips.filter((c) => c.selected).length} selected
          </div>
          <div>
            <strong>ChipInput #2:</strong> {chips2.length} chip(s) |{' '}
            {chips2.filter((c) => c.selected).length} selected
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <h3>Event Log</h3>
          <button
            onClick={clearLog}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Clear Log
          </button>
        </div>
        <div
          style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '16px',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {log.length === 0 ? (
            <div style={{ color: '#666' }}>No events yet...</div>
          ) : (
            log.map((entry, index) => <div key={index}>{entry}</div>)
          )}
        </div>
      </div>

      <div style={{ marginTop: '40px', fontSize: '12px', color: '#666' }}>
        <p>
          <strong>Source of Truth:</strong> STATE (controlled via value/onChange)
        </p>
        <p>
          <strong>Contract:</strong> See{' '}
          <code>src/presentation/components/ChipInput.contract.md</code>
        </p>
      </div>
    </div>
  );
}

export default App;
