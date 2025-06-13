import React from 'react';

interface Player {
  name: string;
}

interface Evaluations {
  [key: string]: number;
}

interface Props {
  player: Player;
  evaluations: Evaluations;
  onChange: (updates: Evaluations) => void;
}

export default function PlayerEvaluation({ player, evaluations, onChange }: Props) {
  const fields = [
    'Teknikk',
    'Innsats',
    'Fysisk form',
    'Forståelse',
    'Oppmøte',
    'Avslutninger',
    'Offensivt',
    'Defensivt'
  ];

  const devFields = ['Utvikling 1', 'Utvikling 2'];

  const handleUpdate = (field: string, value: number) => {
    onChange({ ...evaluations, [field]: value });
  };

  return (
    <div className="space-y-2 text-sm p-3 border rounded-xl bg-gray-50 shadow">
      <h4 className="font-semibold">{player.name}</h4>
      {fields.map(field => (
        <div key={field} className="flex items-center justify-between">
          <label>{field}</label>
          <select
            value={evaluations?.[field] ?? ''}
            onChange={e => handleUpdate(field, parseInt(e.target.value))}
            className="border rounded px-1 py-0.5"
          >
            <option value="">–</option>
            {[1, 2, 3].map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      ))}
      {devFields.map(field => (
        <div key={field} className="flex items-center justify-between">
          <label>{field}</label>
          <select
            value={evaluations?.[field] ?? ''}
            onChange={e => handleUpdate(field, parseInt(e.target.value))}
            className="border rounded px-1 py-0.5"
          >
            <option value="">–</option>
            {[1, 2, 3, 4, 5].map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
