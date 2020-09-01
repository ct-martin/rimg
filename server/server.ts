import express from 'express';
import { PORT } from './constants';
import {
  handler,
  libraries,
  middleware,
  run,
} from './app';

export default function server() {
  // Create server
  const app: express.Application = express();

  // Setup & run
  libraries();
  middleware(app);
  handler(app);
  run(app, PORT);
}
