const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const facebookAccountsRoutes = require('./routes/facebookAccountsRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adAccountsRoutes = require('./routes/adAccountsRoutes');
const commentsTasksRoutes = require('./routes/commentsTasksRoutes');
const proxyRoutes = require('./routes/proxyRoutes');

const { errorHandler } = require('./utils/errorHandler');

dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.dev' : '.env'
});

const app = express();

const bullBoardRouter = require('./queues/bullBoard');
app.use('/bull-board', bullBoardRouter);

const { bootstrapSchedule } = require('./queues/commentTasks.scheduler');
require('./queues/commentTasks.worker');

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/accounts', facebookAccountsRoutes);
app.use('/ad-accounts', adAccountsRoutes);
app.use('/comments-tasks', commentsTasksRoutes);
app.use('/proxies', proxyRoutes);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

const PORT = process.env.PORT || 1222;

async function main() {
  // 1) ініціалізація scheduler/queues
  await bootstrapSchedule();
  console.log('⏱ Comment tasks scheduler initialized');

  // 2) старт HTTP сервера
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Server started on http://127.0.0.1:${PORT}`);
  });
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
