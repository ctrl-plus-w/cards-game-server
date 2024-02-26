class Take6Card {
  rank: number;

  constructor(rank: number) {
    this.rank = rank;
  }

  static generateDeck() {
    const deck: Take6Card[] = [];

    const CARD_COUNT = 104;
    for (let i = 1; i <= CARD_COUNT; i++) {
      deck.push(new Take6Card(i));
    }

    return deck;
  }
}

export default Take6Card;
