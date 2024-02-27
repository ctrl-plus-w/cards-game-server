import Take6Card from '@/class/Take6Card';

import { IntRange } from '@/type/index.types';
import { Player } from '@/type/socket.types';

import { shuffle } from '@/utils';

class Take6Game {
  id: string;
  owner: Player;
  maxPlayers: IntRange<2, 11>;
  players: Player[];
  playerCards: Record<string, Take6Card[]>;
  playerPickedCards: Record<string, Take6Card[]>;
  columnToReplace: Record<string, number>;
  playedCard: Record<string, Take6Card>;
  columns: [Take6Card[], Take6Card[], Take6Card[], Take6Card[], Take6Card[], Take6Card[]];
  deck: Take6Card[];
  messages: { player: string; message: string }[];
  isFinished: boolean;

  constructor(id: string, owner: Player, maxPlayers: IntRange<2, 11>) {
    this.id = id;
    this.owner = owner;
    this.maxPlayers = maxPlayers;
    this.players = [];
    this.playerCards = {};
    this.columnToReplace = {};
    this.playerPickedCards = {};
    this.playedCard = {};
    this.columns = [[], [], [], [], [], []];
    this.deck = shuffle(Take6Card.generateDeck());
    this.isFinished = false;
    this.messages = [];
  }
}

export default Take6Game;
