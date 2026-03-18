require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const cron      = require('node-cron');
const path      = require('path');

const connectDB = require('./config/db');
const routes    = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { expireStaleBookings }    = require('./services/bookingService');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, slow down.' },
}));

app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => {
    const c = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${c}${res.statusCode}\x1b[0m ${req.method.padEnd(6)} ${req.path} ${Date.now()-t}ms`);
  });
  next();
});

app.use('/api', routes);

try {
  const sui  = require('swagger-ui-express');
  const YAML = require('yamljs');
  const fs   = require('fs');
  const p    = path.join(__dirname, '../docs/swagger.yaml');
  if (fs.existsSync(p)) {
    app.use('/api-docs', sui.serve, sui.setup(YAML.load(p), { customSiteTitle: 'Modex Ticket API' }));
    console.log('📄  Swagger UI at http://localhost:' + PORT + '/api-docs');
  }
} catch {}

app.use(notFound);
app.use(errorHandler);

cron.schedule('* * * * *', expireStaleBookings);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n  🎟  Modex Ticket API  →  http://localhost:${PORT}\n`);
  });
};

start();
module.exports = app;
