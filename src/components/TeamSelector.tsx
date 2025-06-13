import React from 'react';

interface TeamOption {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  teams: TeamOption[];
  currentTeamId: string;
  onSelect: (id: string) => void;
}

export default function TeamSelector({ teams, currentTeamId, onSelect }: TeamSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">Velg lag:</label>
      <select
        className="border px-2 py-1 rounded"
        value={currentTeamId}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onSelect(e.target.value)
        }
      >
        {teams.map(team => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}
