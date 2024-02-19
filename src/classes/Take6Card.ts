class Take6Card {
  rank: number;

  constructor(rank: number) {
    this.rank = rank;
  }

  static generateDeck() {
    const deck: Take6Card[] = [];

    for (let i = 1; i <= 104; i++) {
      deck.push(new Take6Card(i));
    }

    return deck;
  }
}

export default Take6Card;
