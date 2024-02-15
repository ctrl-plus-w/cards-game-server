import { IntRange } from '@/type/index.types';

export enum CardSymbol {
  HEART = 'HEART',
  DIAMOND = 'DIAMOND',
  CLUB = 'CLUB',
  SPADE = 'SPADE',
}

class PlayingCard {
  rank: IntRange<1, 13>;
  symbol: CardSymbol;

  constructor(rank: IntRange<1, 13>, symbol: CardSymbol) {
    this.rank = rank;
    this.symbol = symbol;
  }

  static generateDeck() {
    const deck: PlayingCard[] = [];

    for (let i: IntRange<1, 13> = 1; i <= 13; i++) {
      deck.push(
        ...[CardSymbol.HEART, CardSymbol.DIAMOND, CardSymbol.CLUB, CardSymbol.SPADE].map((s) => new PlayingCard(i, s)),
      );
    }

    return deck;
  }
}

export default PlayingCard;
