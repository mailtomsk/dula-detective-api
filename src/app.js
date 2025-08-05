import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import statsRoute from './routes/statsRoute.js';
import openaiRoute from './routes/openaiRoute.js';
import insightRoute from './routes/insightRoute.js';
import basicAuth from './middlewares/basicAuth.js';
import adminAuthRoute from './routes/admin/adminAuthRoute.js';
import adminUserRoute from './routes/admin/adminUserRoute.js';
import notificationRoute from './routes/notificationRoute.js';
import adminSettingsRoute from './routes/admin/adminSettingsRoute.js';
import adminDashboardRoute from './routes/admin/adminDashboardRoute.js';
import FoodAnalysisRoute from './routes/FoodAnalysisRoute.js';

dotenv.config();

const app = express();

const corsOptions = {
    origin: ['http://localhost:5000', 'http://localhost:5173', 'https://duladetective.yourhostingnow.com'],
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
app.use('/api/stats', statsRoute);
app.use('/api/notifications', notificationRoute);

app.use('/api/food-analysis', FoodAnalysisRoute);

//Frontend admin
app.use('/api/admin/auth', adminAuthRoute);
app.use('/api/admin/users', adminUserRoute);
app.use('/api/admin/dashboard', adminDashboardRoute);
app.use('/api/admin/settings', adminSettingsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
