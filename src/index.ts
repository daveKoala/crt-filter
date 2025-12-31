import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import scanRouter from './modules/scan/scan.router';
import './db/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use(scanRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
