import PlayingCard from './PlayingCard';

import { IntRange } from '@/type/index.types';
import { Player } from '@/type/socket.types';

class WarGame {
  id: string;
  owner: Player;
  maxPlayers: IntRange<2, 11>;
  players: Player[];
  playerCards: Record<string, PlayingCard[]>;
  playedCards: Record<string, PlayingCard[]>;
  messages: { player: Player; message: string }[];

  constructor(id: string, owner: Player, maxPlayers: IntRange<2, 11>) {
    this.id = id;
    this.owner = owner;
    this.maxPlayers = maxPlayers;
    this.players = [];
    this.playerCards = {};
    this.playedCards = {};
    this.messages = [];
  }
}

export default WarGame;
