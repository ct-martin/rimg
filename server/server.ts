import express from 'express';
import helmet from 'helmet';
import sharp from 'sharp';
import handle from './handler';
import { PORT } from './constants';

// Disable sharp cache (see README)
sharp.cache(false);

// Create server
const app: express.Application = express();

// Use Helmet for security
app.use(helmet());

// Image resizing
app.get('/', handle);

app.listen(PORT, () => {
  console.log(`App listening on localhost:${PORT}`);
});
