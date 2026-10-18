import { Server } from 'socket.io';
import { config } from './config.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.CLIENT_ORIGIN,
    },
  });

  io.on('connection', (socket) => {
    console.log('client connected');
    socket.on('disconnect', () => {
      console.log('client disconnected');
    });
  });

  return io;
}

function serializeJob(job) {
  if (!job) return job;
  if (typeof job.toObject === 'function') {
    return job.toObject();
  }
  return job;
}

export function emitEvent(name, job) {
  if (!io) return;
  io.emit(name, { job: serializeJob(job) });
}
