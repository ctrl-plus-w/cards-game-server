import { Server } from 'socket.io';
import { uuid } from 'uuidv4';

import PlayingCard from '@/class/PlayingCard';
import Take6Card from '@/class/Take6Card';
import Take6Game from '@/class/Take6Game';

import { IntRange } from '@/type/index.types';
import { AppData, Player, Socket } from '@/type/socket.types';

import { calculateBeefHead, countElements, isDefined, lastEl, shuffle, values } from '@/utils';

type Handler = {
  [key: string]: (param: any) => void;
};

const take6Game = (app: AppData, socket: Socket<any, any>, io: Server): Handler => ({
  'create-take-6-game': createGame(app, socket, io),
  'join-take-6-game': joinGame(app, socket, io),
  'get-take-6-game': getTake6Game(app, socket),
  'set-column-to-replace-take-6-game': setColumnToReplace(app, socket, io),
  'play-take-6-game-card': playTake6GameCard(app, socket, io),
  'delete-take-6-game': deleteTake6Game(app, socket, io),
  'send-take-6-message': sendTake6Message(app, socket, io),
});

type SendMessageData = { message: string };
type SendMessageFn = (
  app: AppData,
  socket: Socket<SendMessageData, any>,
  io: Server,
) => (data: SendMessageData) => void;

const sendTake6Message: SendMessageFn = (app, socket, io) => (data) => {
  const { game, player } = getGameFromSocket(app, socket);
  if (!game || !player) return socket.emit('take-6-game-not-found');

  app.take6Games[game.id].messages.push({ player: player, message: data.message });

  io.to(game.id).emit('take-6-game-update', app.take6Games[game.id]);
};

const getGameFromSocket = (app: AppData, socket: Socket<any, any>): { game?: Take6Game; player?: Player } => {
  const player = socket.player;

  if (!player) return { game: undefined, player: undefined };

  const game = Object.values(app.take6Games).find(
    (g) => (!!g.players.find((p) => p.id === player.id) || g.owner.id === player.id) && !g.isFinished,
  );
  return { game, player };
};

type JoinGameData = { gameId: string };
type JoinGameFn = (app: AppData, socket: Socket<JoinGameData, any>, io: Server) => (data: JoinGameData) => void;

const joinGame: JoinGameFn = (app, socket, io) => (data) => {
  const game = app.take6Games[data.gameId];

  if (
    !socket.player ||
    !game ||
    game.players.length >= game.maxPlayers ||
    !!game.players.find(({ id }) => socket.player?.id === id) ||
    socket.player.id === game.owner.id
  )
    return socket.emit('take-6-game-not-found');

  app.take6Games[game.id].players.push(socket.player);
  socket.join(game.id);

  socket.emit('join-take-6-game', game.id);

  if (game.players.length + 1 === game.maxPlayers) {
    for (let i = 0; i < 10; i++) {
      for (let i = 0; i <= game.players.length; i++) {
        let id: string;

        if (i === game.players.length) id = game.owner.id;
        else id = game.players[i].id;

        const card = app.take6Games[game.id].deck.pop();
        if (!card) break;

        if (id in game.playerCards) app.take6Games[game.id].playerCards[id].push(card);
        else app.take6Games[game.id].playerCards[id] = [card];
      }
    }

    for (let i = 0; i < app.take6Games[game.id].columns.length; i++) {
      const card = app.take6Games[game.id].deck.pop();
      if (card) app.take6Games[game.id].columns[i].push(card);
    }
  }

  io.to(game.id).emit('take-6-game-update', app.take6Games[game.id]);
};

type CreateGameData = { owner: Player; maxPlayers: IntRange<2, 11> };
type CreateGameFn = (app: AppData, socket: Socket<CreateGameData, any>, io: Server) => (data: CreateGameData) => void;

const createGame: CreateGameFn = (app, socket, io) => (data) => {
  if (!socket.player || !data.owner || !data.maxPlayers) return;

  const id = uuid();

  const game = new Take6Game(id, data.owner, data.maxPlayers);

  app.take6Games[id] = game;
  socket.join(id);

  socket.emit('join-take-6-game', game.id);

  console.log('Game created:', game);
};

type GetTake6GameFn = (app: AppData, socket: Socket<never, any>) => (data: never) => void;

const updateGame = (app: AppData, game: Take6Game) => {
  let resetPlayedCards = true;

  while (true) {
    // const minPlayableCard =
    //   Math.min(
    //     ...values<PlayingCard[]>(app.take6Games[game.id].columns)
    //       .map((col) => lastEl(col))
    //       .filter(isDefined)
    //       .map((c) => c.rank),
    //   ) + 1;

    const smallestCardPlayerId = Object.keys(app.take6Games[game.id].playedCard).find(
      (id) =>
        isDefined(app.take6Games[game.id].playedCard[id]) &&
        app.take6Games[game.id].playedCard[id].rank ===
          Math.min(
            ...values<PlayingCard>(app.take6Games[game.id].playedCard)
              .filter(isDefined)
              .map((a) => a.rank),
          ),
    );
    if (!smallestCardPlayerId) break;

    // when the user has already been handled, his playedCard value is set to undefined
    // skip in this case
    if (app.take6Games[game.id].playedCard[smallestCardPlayerId] === undefined) {
      console.log('Player played card is undefined');
      continue;
    }

    const smallestCardRank = app.take6Games[game.id].playedCard[smallestCardPlayerId].rank;
    console.log('Smallest card rank is :', smallestCardRank);

    const replaceColumn = () => {
      const cardsToAdd = app.take6Games[game.id].columns[app.take6Games[game.id].columnToReplace[smallestCardPlayerId]];
      if (smallestCardPlayerId in app.take6Games[game.id].playerPickedCards) {
        console.log(app.take6Games[game.id].playerPickedCards[smallestCardPlayerId]);
        app.take6Games[game.id].playerPickedCards[smallestCardPlayerId].push(...cardsToAdd);
      } else {
        app.take6Games[game.id].playerPickedCards[smallestCardPlayerId] = cardsToAdd;
      }

      app.take6Games[game.id].columns[app.take6Games[game.id].columnToReplace[smallestCardPlayerId]] = [
        new Take6Card(smallestCardRank),
      ];
      app.take6Games[game.id].playedCard[smallestCardPlayerId] = undefined;
    };

    // find the appropriate column for the card
    let columnIndex = -1;
    let columnLastCardValue = -99999;

    for (let i = 0; i < app.take6Games[game.id].columns.length; i++) {
      const el = lastEl<Take6Card>(app.take6Games[game.id].columns[i]);
      console.log(`> ${i} - ${columnLastCardValue} < ${el?.rank} < ${smallestCardRank}`);
      if (el && el.rank > columnLastCardValue && el.rank < smallestCardRank) {
        columnIndex = i;
        columnLastCardValue = el.rank;
      }
    }

    // if one of the played cards is smaller than the smallest card in the columns
    // we update the game status and wait for the user to set his column to replace
    if (columnIndex === -1) {
      console.log('The smallest card rank is smaller than the minimum playable card.');
      if (app.take6Games[game.id].columnToReplace[smallestCardPlayerId] === undefined) {
        console.log('The user has not set his column to replace.');
        resetPlayedCards = false;
        break;
      }

      console.log('Replacing the column.');
      replaceColumn();
      continue;
    }

    console.log('Appropriate column index is', columnIndex, 'with value of', columnLastCardValue);

    // if the column is full, we add the cards to the player's picked cards
    if (app.take6Games[game.id].columns[columnIndex].length === 5) {
      console.log('Column is full, replacing the column.');
      replaceColumn();
      continue;
    }

    console.log('Adding the card to the column.');
    app.take6Games[game.id].columns[columnIndex].push(new Take6Card(smallestCardRank));
    app.take6Games[game.id].playedCard[smallestCardPlayerId] = undefined;
  }

  if (resetPlayedCards) {
    console.log('Resetting the players cards.');
    app.take6Games[game.id].playedCard = {};

    for (const id in app.take6Games[game.id].playerCards) {
      const card = app.take6Games[game.id].deck.pop();
      if (card) app.take6Games[game.id].playerCards[id].push(card);
      else break;
    }
  }

  console.log(app.take6Games[game.id].playerCards);
  console.log(app.take6Games[game.id].playerPickedCards);

  const maxPlayerCardsCount = Math.max(
    ...values<Take6Card[]>(app.take6Games[game.id].playerCards).map((c) => c.filter(isDefined).length),
  );
  const maxSummedPlayerPickedCards = Math.max(
    ...values<Take6Card[]>(app.take6Games[game.id].playerPickedCards).map((c) =>
      Array.isArray(c) ? c.reduce((acc, curr) => acc + calculateBeefHead(curr), 0) : 0,
    ),
  );
  console.log(
    'Max player cards count :',
    maxPlayerCardsCount,
    ' | Max summed player picked cards :',
    maxSummedPlayerPickedCards,
  );

  if (maxPlayerCardsCount === 0 || maxSummedPlayerPickedCards >= 66) {
    console.log('Game is finished.');
    app.take6Games[game.id].isFinished = true;
  }
};

const getTake6Game: GetTake6GameFn = (app, socket) => (data) => {
  const { game } = getGameFromSocket(app, socket);
  if (!game) return socket.emit('take-6-game-not-found');

  socket.emit('take-6-game-update', game);
};

type PlayTake6GameCardData = { rank: number };
type PlayTake6GameCardFn = (
  app: AppData,
  socket: Socket<PlayTake6GameCardData, any>,
  io: Server,
) => (data: PlayTake6GameCardData) => void;

const playTake6GameCard: PlayTake6GameCardFn = (app, socket, io) => (data) => {
  const { game, player } = getGameFromSocket(app, socket);
  if (!game || !player) return socket.emit('take-6-game-not-found');

  const canPlay = !Object.keys(game.playedCard).includes(player.id);
  if (!canPlay) {
    console.log('Cannot play.');
    return;
  }

  const playedCardIndex = game.playerCards[player.id].findIndex((card) => card && card.rank === data.rank);
  if (playedCardIndex === -1) {
    console.log('Played card not found in the player deck.');
    return;
  }

  app.take6Games[game.id].playedCard[player.id] = game.playerCards[player.id][playedCardIndex];
  delete app.take6Games[game.id].playerCards[player.id][playedCardIndex];

  console.log(app.take6Games[game.id].playedCard);
  if (Object.keys(app.take6Games[game.id].playedCard).length === game.maxPlayers) updateGame(app, game);

  io.to(game.id).emit('take-6-game-update', app.take6Games[game.id]);
};

type SetColumnToReplaceData = { column: number };
type SetColumnToReplaceFn = (
  app: AppData,
  socket: Socket<SetColumnToReplaceData, any>,
  io: Server,
) => (data: SetColumnToReplaceData) => void;

const setColumnToReplace: SetColumnToReplaceFn = (app, socket, io) => (data) => {
  const { game, player } = getGameFromSocket(app, socket);
  if (!game || !player) return socket.emit('take-6-game-not-found');

  app.take6Games[game.id].columnToReplace[player.id] = data.column;
  updateGame(app, game);

  io.to(game.id).emit('take-6-game-update', app.take6Games[game.id]);
};

type DeleteTake6GameFn = (app: AppData, socket: Socket<never, any>, io: Server) => (data: never) => void;

const deleteTake6Game: DeleteTake6GameFn = (app, socket, io) => (data) => {
  const { game, player } = getGameFromSocket(app, socket);
  if (!game || !player || player.id !== game.owner.id) return socket.emit('take-6-game-not-found');

  delete app.take6Games[game.id];
  io.to(game.id).emit('take-6-game-deleted', game);
};

export default take6Game;
