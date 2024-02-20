import { Server } from 'socket.io';
import { uuid } from 'uuidv4';

import PlayingCard from '@/class/PlayingCard';
import Take6Card from '@/class/Take6Card';
import Take6Game from '@/class/Take6Game';

import { IntRange } from '@/type/index.types';
import { AppData, Player, Socket } from '@/type/socket.types';

import { countElements, isDefined, lastEl, shuffle, values } from '@/utils';

type Handler = {
  [key: string]: (param: any) => void;
};

const take6Game = (app: AppData, socket: Socket<any, any>, io: Server): Handler => ({
  'create-take-6-game': createGame(app, socket, io),
  'join-take-6-game': joinGame(app, socket, io),
  'get-take-6-game': getTake6Game(app, socket),
  'play-take-6-game-card': playTake6GameCard(app, socket, io),
  'delete-take-6-game': deleteTake6Game(app, socket, io),
});

const getGameFromSocket = (app: AppData, socket: Socket<any, any>): { game?: Take6Game; player?: Player } => {
  const player = socket.player;

  if (!player) return { game: undefined, player: undefined };

  const game = Object.values(app.take6Games).find(
    (g) => !!g.players.find((p) => p.id === player.id) || g.owner.id === player.id,
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

  const playedCardIndex = game.playerCards[player.id].findIndex((card) => card.rank === data.rank);
  app.take6Games[game.id].playedCards[player.id] = [game.playerCards[player.id][playedCardIndex]];
  delete app.take6Games[game.id].playerCards[player.id][playedCardIndex];

  if (
    Object.keys(app.take6Games[game.id].playedCards).length === game.maxPlayers &&
    values<PlayingCard[]>(app.take6Games[game.id].playedCards).every((arr) => arr.length)
  ) {
    const minPlayableCard =
      Math.max(
        ...values<PlayingCard[]>(app.take6Games[game.id].columns)
          .map((col) => lastEl(col))
          .filter(isDefined)
          .map((c) => c.rank),
      ) + 1;

    let resetPlayedCards = true;

    while (true) {
      const smallestCardPlayerId = Object.keys(app.take6Games[game.id].playedCards).find(
        (id) =>
          app.take6Games[game.id].playedCard[id].rank ===
          Math.min(...values<PlayingCard>(app.take6Games[game.id].playedCard).map((a) => a.rank)),
      );
      const smallestCardRank = app.take6Games[game.id].playedCard[smallestCardPlayerId].rank;

      // when the user has already been handled, his playedCard value is set to undefined
      // skip in this case
      if (app.take6Games[game.id].playedCards[smallestCardPlayerId] === undefined) continue;

      const replaceColumn = () => {
        app.take6Games[game.id].playerPickedCards[smallestCardPlayerId] +=
          app.take6Games[game.id].columns[app.take6Games[game.id].columnToReplace[smallestCardPlayerId]];
        app.take6Games[game.id].columns[app.take6Games[game.id].columnToReplace[smallestCardPlayerId]] = [
          new Take6Card(smallestCardRank),
        ];
        app.take6Games[game.id].playedCards[smallestCardPlayerId] = undefined;
      };

      // if one of the played cards is smaller than the smallest card in the columns
      // we update the game status and wait for the user to set his column to replace
      if (smallestCardRank < smallestCardRank) {
        if (app.take6Games[game.id].columnToReplace[smallestCardPlayerId] === undefined) {
          resetPlayedCards = false;
          break;
        }

        replaceColumn();
        continue;
      }

      // find the appropriate column for the card
      let columnIndex = 0;
      let columnLastCardValue = app.take6Games[game.id].columns[columnIndex].length;

      for (let i = 1; i < app.take6Games[game.id].columns.length; i++) {
        const el = lastEl(app.take6Games[game.id].columns[i]);
        if (el && el > columnLastCardValue && el < smallestCardRank) {
          columnIndex = i;
          columnLastCardValue = el;
        }
      }

      // if the column is full, we add the cards to the player's picked cards
      if (app.take6Games[game.id].columns[columnIndex].length === 5) {
        replaceColumn();
        continue;
      }

      app.take6Games[game.id].columns[columnIndex].push(new Take6Card(smallestCardRank));
    }

    if (resetPlayedCards) {
      for (const id in app.take6Games[game.id].playedCards) {
        delete app.take6Games[game.id].playedCards[id];
      }
    }
  }

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
