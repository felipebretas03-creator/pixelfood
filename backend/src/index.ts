import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import dotenv from 'dotenv';
import { startEmailWorker } from './cron/emailWorker';

dotenv.config();

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        !origin ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Socket.IO CORS: origem não permitida'));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }
});

// Socket.io Realtime Events
io.on('connection', (socket) => {
  console.log('🔗 Novo cliente conectado:', socket.id);

  socket.on('join_restaurant', (tenantId) => {
    socket.join(tenantId);
    console.log(`Cliente ${socket.id} entrou na sala do restaurante ${tenantId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Start background workers
  startEmailWorker();
});
