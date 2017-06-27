/* eslint-disable global-require */
const express = require('express');
const fs = require('fs');
const https = require('https');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');
const expressWs = require('express-ws');


function bootstrap(port) {
  const privateKey = fs.readFileSync('../dummy-keys/key.pem', 'utf8');
  const certificate = fs.readFileSync('../dummy-keys/cert.pem', 'utf8');

  const app = express();
  const server = https.createServer({ key: privateKey, cert: certificate }, app);
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

  app.use(express.static('cc-dist'));
  app.use('/api', index);
  app.use('/signaling', wsSignaling);


  app.use((req, res) => {
    res.status(404).json({ message: 'Resource not found.' });
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
