import { Server } from 'socket.io';
import { uuid } from 'uuidv4';

import PlayingCard, { CardSymbol } from '@/class/PlayingCard';
import WarGame from '@/class/WarGame';

import { IntRange } from '@/type/index.types';
import { AppData, Player, Socket } from '@/type/socket.types';

import { countElements, shuffle, values } from '@/utils';

type Handler = {
  [key: string]: (param: any) => void;
};

const warGame = (app: AppData, socket: Socket<any, any>, io: Server): Handler => ({
  'create-war-game': createGame(app, socket, io),
  'join-war-game': joinGame(app, socket, io),
  'get-war-game': getWarGame(app, socket),
  'play-war-game-card': playWarGameCard(app, socket, io),
  'delete-war-game': deleteWarGame(app, socket, io),
});

const getGameFromSocket = (app: AppData, socket: Socket<any, any>): { game?: WarGame; player?: Player } => {
  const player = socket.player;

  if (!player) return { game: undefined, player: undefined };

  const game = Object.values(app.warGames).find(
    (g) => !!g.players.find((p) => p.id === player.id) || g.owner.id === player.id,
  );
  return { game, player };
};

type CreateGameData = { owner: Player; maxPlayers: IntRange<2, 11> };
type CreateGameFn = (app: AppData, socket: Socket<CreateGameData, any>, io: Server) => (data: CreateGameData) => void;

const createGame: CreateGameFn = (app, socket, io) => (data) => {
  if (!socket.player || !data.owner || !data.maxPlayers) return;

  const id = uuid();

  const game = new WarGame(id, data.owner, data.maxPlayers);

  app.warGames[id] = game;
  socket.join(id);

  socket.emit('join-war-game', game.id);

  console.log('Game created:', game);
};

type JoinGameData = { gameId: string };
type JoinGameFn = (app: AppData, socket: Socket<JoinGameData, any>, io: Server) => (data: JoinGameData) => void;

const joinGame: JoinGameFn = (app, socket, io) => (data) => {
  const game = app.warGames[data.gameId];
  if (
    !socket.player ||
    !game ||
    game.players.length >= game.maxPlayers ||
    !!game.players.find(({ id }) => socket.player?.id === id) ||
    socket.player.id === game.owner.id
  )
    return socket.emit('war-game-not-found');

  app.warGames[game.id].players.push(socket.player);
  socket.join(game.id);

  socket.emit('join-war-game', game.id);

  if (game.players.length + 1 === game.maxPlayers) {
    const deck = shuffle(PlayingCard.generateDeck());

    while (deck.length) {
      for (let i = 0; i <= game.players.length; i++) {
        let id: string;

        if (i === game.players.length) id = game.owner.id;
        else id = game.players[i].id;

        const card = deck.pop();
        if (!card) break;

        if (id in game.playerCards) app.warGames[game.id].playerCards[id].push(card);
        else app.warGames[game.id].playerCards[id] = [card];
      }
    }

    for (let id in game.playerCards) {
      app.warGames[game.id].playerCards[id].push(new PlayingCard(1, CardSymbol.DIAMOND));
    }
  }

  io.to(game.id).emit('war-game-update', app.warGames[game.id]);
};

type GetWarGameFn = (app: AppData, socket: Socket<never, any>) => (data: never) => void;

const getWarGame: GetWarGameFn = (app, socket) => (data) => {
  const { game } = getGameFromSocket(app, socket);
  if (!game) return socket.emit('war-game-not-found');

  socket.emit('war-game-update', game);
};

type PlayWarGameCardFn = (app: AppData, socket: Socket<never, any>, io: Server) => (data: never) => void;

const playWarGameCard: PlayWarGameCardFn = (app, socket, io) => (data) => {
  const { game, player } = getGameFromSocket(app, socket);
  if (!game || !player) return socket.emit('war-game-not-found');

  app.warGames[game.id].playedCards[player.id] = [app.warGames[game.id].playerCards[player.id].pop()];

  if (
    Object.keys(app.warGames[game.id].playedCards).length === game.maxPlayers &&
    values<PlayingCard[]>(app.warGames[game.id].playedCards).every((arr) => arr.length)
  ) {
    // while there are two cards that are equals
    while (true) {
      const lastPlayedCards = values<PlayingCard[]>(app.warGames[game.id].playedCards).map((a) => a[a.length - 1].rank);
      const countedPlayedCards = countElements(lastPlayedCards);
      if (Math.max(...values(countedPlayedCards)) === 1) break;

      for (const id in app.warGames[game.id].playerCards) {
        const playedCards = app.warGames[game.id].playedCards[id];
        const lastPlayerCard = playedCards[playedCards.length - 1];

        if (countedPlayedCards[lastPlayerCard.rank] > 1) {
          for (let i = 0; i < 2; i++)
            app.warGames[game.id].playedCards[id].push(app.warGames[game.id].playerCards[id].pop());
        }
      }
    }

    setTimeout(() => {
      const maxRank = Math.max(
        ...values<PlayingCard[]>(app.warGames[game.id].playedCards).map((a) => a[a.length - 1].rank),
      );

      const winner = [...app.warGames[game.id].players, game.owner].find((player: Player) => {
        const playedCards = app.warGames[game.id].playedCards[player.id];
        return playedCards[playedCards.length - 1].rank === maxRank;
      });
      if (!winner) return;

      const combinedCards = values<PlayingCard[]>(app.warGames[game.id].playedCards).reduce(
        (acc, curr) => [...acc, ...curr],
        [],
      );

      app.warGames[game.id].playerCards[winner.id].unshift(...combinedCards);
      app.warGames[game.id].playedCards = {};

      io.to(game.id).emit('war-game-update', app.warGames[game.id]);
    }, 3000);
  }

  io.to(game.id).emit('war-game-update', app.warGames[game.id]);
};

type DeleteWarGameFn = (app: AppData, socket: Socket<never, any>, io: Server) => (data: never) => void;

const deleteWarGame: DeleteWarGameFn = (app, socket, io) => (data) => {
  const { game, player } = getGameFromSocket(app, socket);
  if (!game || !player || player.id !== game.owner.id) return socket.emit('war-game-not-found');

  delete app.warGames[game.id];
  io.to(game.id).emit('war-game-deleted', game);
};

export default warGame;
