import React from 'react';

interface Player {
  name: string;
  level: number;
  [key: string]: number | string;
}

interface PlayerCardEditorProps {
  player: Player;
  onChange: (updated: Player) => void;
}

const categories = [
  'teknikk',
  'innsats',
  'fysisk_form',
  'forstaelse',
  'oppmote',
  'avslutninger',
  'offensivt',
  'defensivt'
];

export default function PlayerCardEditor({ player, onChange }: PlayerCardEditorProps) {
  const handleValueChange = (field: string, value: number) => {
    const updated = { ...player, [field]: value };
    onChange(updated);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h4 className="font-semibold text-lg mb-2">
        {player.name} (nivå: {player.level})
      </h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {categories.map(cat => (
          <label key={cat} className="flex items-center gap-2">
            {cat.charAt(0).toUpperCase() + cat.slice(1)}:
            <input
              type="number"
              min={1}
              max={5}
              value={typeof player[cat] === 'number' ? player[cat] : ''}
              onChange={e => {
                const value = Number(e.target.value);
                handleValueChange(cat, isNaN(value) ? 0 : value);
              }}
              className="border px-1 py-0.5 w-12 rounded"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
