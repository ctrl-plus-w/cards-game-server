import PlayingCard from './PlayingCard';

import { IntRange } from '@/type/index.types';
import { Player } from '@/type/socket.types';

class Game {
  id: string;
  owner: Player;
  maxPlayers: IntRange<2, 11>;
  players: Player[];
  playerCards: Record<string, PlayingCard[]>;
  playedCards: Record<string, PlayingCard[]>;

  constructor(id: string, owner: Player, maxPlayers: IntRange<2, 11>) {
    this.id = id;
    this.owner = owner;
    this.maxPlayers = maxPlayers;
    this.players = [];
    this.playerCards = {};
    this.playedCards = {};
  }
}

export default Game;
