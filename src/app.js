const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config.js');
const routes = require('./routes.js');

const app = express();

// Config
app.set('port', config.port);

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '25mb' }));

// Routes
app.use(routes);

module.exports = app;