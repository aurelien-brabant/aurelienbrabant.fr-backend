#!/usr/bin/env ts-node

/**
 * Module dependencies.
 */

import app from '../app';
import debugModule from 'debug';
import * as http from 'http';

import { pool, initialize } from '../src/database/database';

const debug = debugModule('aurelienbrabant.fr-backend:server');
const port = process.env.PORT || '3000';

/**
 * Get port from environment and store in Express.
 */

app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
server.on('close', async () => {
  await pool.end();
});

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = 'port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(): void {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);

  initialize();
}
