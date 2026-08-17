const express = require('express');
const path = require('path');

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware 
app.use(express.json());       
app.use(logger);               

//  Static files 
app.use(express.static(path.join(__dirname, 'public')));

//  API routes 
app.use('/tasks', tasksRouter);

// 404 fallback for unmatched routes 
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
});

// Centralized error handler 
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TaskForge API listening on http://localhost:${PORT}`);
});