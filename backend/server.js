import { connectDB } from "./database/connectDB.js";
import { app } from "./middleware/middleware.js";
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Serve static files with proper path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add logging middleware for debugging static files
app.use('/uploads', (req, res, next) => {
    console.log('Static file request:', req.url);
    next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'profile');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create Socket.IO instance
const io = new Server(server, {
    cors: {
        origin: "*", // Be more specific in production
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling']
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('joinOrderRoom', (orderId) => {
        console.log('Joining room:', orderId);
        socket.join(`order_${orderId}`);
    });

    socket.on('updateDeliveryLocation', (data) => {
        const { orderId, location, estimatedArrival } = data;
        console.log('Location update for order:', orderId, location);
        io.to(`order_${orderId}`).emit('locationUpdate', {
            location,
            estimatedArrival
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});  