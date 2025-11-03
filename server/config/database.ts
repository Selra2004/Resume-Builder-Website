import mysql from 'mysql2/promise';
import { logger } from '../utils/logger.js';

let connection: mysql.Connection | null = null;

export const createConnection = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT),
      ssl: {
    ca: fs.readFileSync('/etc/secrets/aiven-ca.pem')
  },
      timezone: '+00:00',
      dateStrings: true,
    });

    // Test the connection
    await connection.ping();
    logger.info('Database connected successfully');
    
    return connection;
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

export const getConnection = () => {
  if (!connection) {
    throw new Error('Database connection not initialized. Call createConnection() first.');
  }
  return connection;
};

export const closeConnection = async () => {
  if (connection) {
    await connection.end();
    connection = null;
    logger.info('Database connection closed');
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});
