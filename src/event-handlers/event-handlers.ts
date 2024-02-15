import { Server } from 'socket.io';

import { AppData, Socket } from '@/type/socket.types';

export default (io: Server) => {
  io.on('connection', (socket: Socket<any, any>) => {
    const eventHandlers = [];

    eventHandlers.forEach((handler) => {
      for (let eventName in handler) {
        socket.on(eventName, handler[eventName]);
      }
    });
  });
};
