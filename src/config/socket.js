import { Server } from "socket.io";

export const initializeSocket = (httpServer) => {
  const getUserRoom = (userId) => `user:${userId}`;

  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }
  });

  const onlineUsers = new Set();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_chat', (userId) => {
      socket.userId = userId;
      socket.join(getUserRoom(userId));
      onlineUsers.add(userId);
      socket.broadcast.emit('user_connected', userId);
      io.emit('online_users', Array.from(onlineUsers));
      console.log(`User ${userId} joined chat`);
    });

    socket.on('leave_chat', (userId) => {
      socket.leave(getUserRoom(userId));
      onlineUsers.delete(userId);
      socket.broadcast.emit('user_disconnected', userId);
      io.emit('online_users', Array.from(onlineUsers));
      console.log(`User ${userId} left chat`);
    });

    socket.on('send_message', (message) => {
      console.log('Message sent:', message);
      socket.broadcast.emit('receive_message', message);
    });

    socket.on('mark_as_read', (messageId) => {
      console.log('Message marked as read:', messageId);
      socket.broadcast.emit('message_read', messageId);
    });

    socket.on('typing_start', (data) => {
      socket.broadcast.emit('typing', data);
    });

    socket.on('typing_stop', (data) => {
      socket.broadcast.emit('typing', data);
    });

    socket.on('call:invite', (payload) => {
      io.to(getUserRoom(payload.toUserId)).emit('call:incoming', payload);
    });

    socket.on('call:accept', (payload) => {
      io.to(getUserRoom(payload.toUserId)).emit('call:accepted', payload);
    });

    socket.on('call:reject', (payload) => {
      io.to(getUserRoom(payload.toUserId)).emit('call:rejected', payload);
    });

    socket.on('call:end', (payload) => {
      io.to(getUserRoom(payload.toUserId)).emit('call:ended', payload);
    });

    socket.on('webrtc:offer', (payload) => {
      io.to(getUserRoom(payload.toUserId)).emit('webrtc:offer', payload);
    });

    socket.on('webrtc:answer', (payload) => {
      io.to(getUserRoom(payload.toUserId)).emit('webrtc:answer', payload);
    });

    socket.on('webrtc:ice-candidate', (payload) => {
      io.to(getUserRoom(payload.toUserId)).emit('webrtc:ice-candidate', payload);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        socket.broadcast.emit('user_disconnected', socket.userId);
        io.emit('online_users', Array.from(onlineUsers));
        console.log(`User ${socket.userId} disconnected`);
      }
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};
