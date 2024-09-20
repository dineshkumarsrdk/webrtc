import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

// initializing express app
const app = express();
app.use(cors());
app.use(express.urlencoded({extended:true}));
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

const emailToSocketMap = new Map();
const socketToEmailMap = new Map();

io.on('connection', (socket)=>{
    // listening to new user join event
    socket.on('user-join', (data)=>{
        const {email, roomId} = data;
        console.log('User', email, roomId);
        emailToSocketMap.set(email, socket.id);
        socketToEmailMap.set(socket.id, email);
        socket.join(roomId);
        socket.emit('user-joined', roomId);
        // broadcasting new user joined event to other users in the room
        socket.broadcast.to(roomId).emit('newUser-joined', email);
    });

    socket.on('call-user', data => {
        const {email, offer} = data;
        const fromEmail = socketToEmailMap.get(socket.id);
        const socketId = emailToSocketMap.get(email);
        socket.to(socketId).emit('incoming-call', {from: fromEmail, offer})
    });

    socket.on('call-response', data=>{
        const {email, ans} = data;
        const socketId = emailToSocketMap.get(email);
        socket.to(socketId).emit('call-accepted', {ans});
    });
});

server.listen(8000, ()=>{
    console.log('Server running on port 8000');
});