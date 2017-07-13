/* eslint-disable global-require */
const express = require('express');
const fs = require('fs');
const http = require('http');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');
const expressWs = require('express-ws');
const path = require('path');


function bootstrap(port) {
  const app = express();
  const server = http.createServer(app);
  expressWs(app, server);

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PUT, PATCH');
    next();
  });

  const index = require('./routes/index');
  const wsSignaling = require('./ws/signaling');
  const wsListener = require('./ws/listener');

  app.use(express.static('client-dist'));
  app.use('/api', index);
  app.use('/signaling', wsSignaling);
  app.use('/listener', wsListener);


  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '/client-dist/index.html'));
  });

  if (process.env.NODE_ENV === 'development') {
    app.use(errorhandler({ log: false }));
  } else {
    app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
      res.status(err.status || 500);
      res.json({ message: 'Sorry, an error occurred.' });
    });
  }

  server.listen(port);
}


module.exports = {
  bootstrap,
};
