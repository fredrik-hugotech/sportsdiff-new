import React, { useState } from 'react';

interface Player {
  id: string;
  name: string;
  level: number;
  position: string;
}

interface PlayerEditorProps {
  player: Player;
  onChange: (player: Player) => void;
}

const PlayerEditor: React.FC<PlayerEditorProps> = ({ player, onChange }) => {
  const [localPlayer, setLocalPlayer] = useState<Player>(player);

  const handleChange = (field: keyof Player, value: string | number) => {
    const updated = { ...localPlayer, [field]: value };
    setLocalPlayer(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-2 border rounded p-4 shadow-sm bg-white">
      <input
        className="border p-2 rounded w-full"
        value={localPlayer.name}
        onChange={e => handleChange('name', e.target.value)}
        placeholder="Navn"
      />
      <input
        className="border p-2 rounded w-full"
        type="number"
        step="0.1"
        value={localPlayer.level}
        onChange={e => handleChange('level', parseFloat(e.target.value))}
        placeholder="Nivå"
      />
      <input
        className="border p-2 rounded w-full"
        value={localPlayer.position}
        onChange={e => handleChange('position', e.target.value)}
        placeholder="Posisjon"
      />
    </div>
  );
};

export default PlayerEditor;