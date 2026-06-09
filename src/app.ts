import express, { Application, Request, Response } from 'express';

export const app: Application = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Skillo Backend is operational' });
});