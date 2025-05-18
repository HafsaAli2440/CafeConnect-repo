import { config } from 'dotenv';
import express from 'express'
import { router } from '../routes/route.js';
import cors from 'cors'
import { errorLogger } from './errorMiddleware.js'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({
    path:'./database/.env'
})

export const app = express();

// Increase payload size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cors({
    origin: "*",
    methods:['GET', 'POST','PUT','DELETE','PATCH'],
    credentials: true
}))

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api',router); 
app.use(errorLogger);