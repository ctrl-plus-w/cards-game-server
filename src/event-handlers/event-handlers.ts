import { Server } from 'socket.io';

import users from '@/handler/users';
import warGame from '@/handler/war-game';

import { AppData, Socket } from '@/type/socket.types';

const app: AppData = {
  allSockets: [],
  games: [],
  players: [],
};

export default (io: Server) => {
  io.on('connection', (socket: Socket<any, any>) => {
    const eventHandlers = [warGame(app, socket), users(app, socket)];

    eventHandlers.forEach((handler) => {
      for (let eventName in handler) {
        socket.on(eventName, handler[eventName]);
      }
    });

    // Keep track of the socket
    app.allSockets.push(socket);
  });
};
