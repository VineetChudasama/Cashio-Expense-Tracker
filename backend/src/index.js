import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import forecastRoutes from './routes/forecast.js';
import splitRoutes from './routes/splits.js';
import insightRoutes from './routes/insights.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import { startNotificationScheduler } from './utils/pushScheduler.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/splits', splitRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startNotificationScheduler();
});
