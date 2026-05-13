// src/app.ts
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes';
import { config } from './config/env';

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());
app.use('/api', apiRoutes);

export default app;