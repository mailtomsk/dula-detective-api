import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import insightRoute from './routes/insightRoute.js';
import openaiRoute from './routes/openaiRoute.js';
import basicAuth from './middlewares/basicAuth.js';

dotenv.config();

const app = express();

const corsOptions = {
    origin: ['http://localhost:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-api-key'],
    credentials: true,
  };

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static('public/uploads'));

app.use('/api/analysis', openaiRoute);
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/insights', insightRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
