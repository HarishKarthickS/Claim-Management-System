import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next/types';
import { Socket } from 'net';

// Extended interface for Next.js API Response with Socket.IO
export interface NextApiResponseServerIO extends NextApiResponse {
  socket: Socket & {
    server: {
      io: SocketIOServer;
    };
  };
} 