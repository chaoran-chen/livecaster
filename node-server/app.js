const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');

const index = require('./routes/index');


const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', index);

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


module.exports = app;
