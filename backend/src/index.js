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
import { sanitizeInputs } from './middleware/sanitize.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

// Reject oversized payloads (> 1MB)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sanitize all inputs against script injection and prototype pollution
app.use(sanitizeInputs);

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/splits', splitRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      error: 'Payload size exceeds the 1MB limit. Please reduce the request size.'
    });
  }
  console.error('[SERVER ERROR]:', err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startNotificationScheduler();
});
