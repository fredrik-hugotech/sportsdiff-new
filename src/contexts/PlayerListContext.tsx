import {
  createContext,
  useState,
  useContext,
  type ReactNode
} from 'react';

interface Player {
  id: string;
  name: string;
  level: number;
  vest: boolean;
  teamId: string;
}

interface PlayerListContextType {
  players: Player[];
  setPlayers: (players: Player[]) => void;
}

const PlayerListContext = createContext<PlayerListContextType | undefined>(undefined);

type PlayerListProviderProps = {
  children: ReactNode;
};

export const PlayerListProvider = ({ children }: PlayerListProviderProps) => {
  const [players, setPlayers] = useState<Player[]>([]);

  return (
    <PlayerListContext.Provider value={{ players, setPlayers }}>
      {children}
    </PlayerListContext.Provider>
  );
};

export const usePlayerList = () => {
  const context = useContext(PlayerListContext);
  if (!context) {
    throw new Error('usePlayerList must be used within a PlayerListProvider');
  }
  return context;
};
