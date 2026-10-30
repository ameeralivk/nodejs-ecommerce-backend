import dotenv from 'dotenv';
dotenv.config();

import app from './src/app';
import connectDB from './src/config/db';

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
