import './config/env'; // 환경변수 검증을 가장 먼저 실행
import app from './app';
import { env } from './config/env';
import { startInvitationExpiryJob } from './jobs/invitationExpiry.job';

const server = app.listen(env.PORT, () => {
  console.info(`[SERVER] Started on port ${env.PORT} (${env.NODE_ENV})`);
  startInvitationExpiryJob();
});

process.on('SIGTERM', () => {
  console.info('[SERVER] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.info('[SERVER] Closed');
    process.exit(0);
  });
});

export default server;
