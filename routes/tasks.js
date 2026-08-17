const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { nanoid } = require('nanoid');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

// Persistence helpers
async function readTasks() {
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

async function writeTasks(tasks) {
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

// Small helper to build a consistent "throwable" HTTP error.
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

//  Routes 

// GET /tasks — return all tasks
router.get('/', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id — return a single task
router.get('/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find((t) => t.id === req.params.id);
    if (!task) throw httpError(404, `Task ${req.params.id} not found`);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id/verify 
router.get('/:id/verify', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find((t) => t.id === req.params.id);
    if (!task) throw httpError(404, `Task ${req.params.id} not found`);

    // Simulate a slow external check (1.5s) using a Promise-wrapped setTimeout,
    // so that the server can still handle other requests in the meantime.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // One seeded task is deliberately missing "title" so this detects and reports
    // it cleanly instead of letting the server crash on bad data.
    if (!task.title) {
      throw httpError(400, `Task ${req.params.id} is invalid: missing required field "title"`);
    }

    res.status(200).json({
      id: task.id,
      verified: true,
      message: `Task "${task.title}" passed verification`,
    });
  } catch (err) {
    next(err);
  }
});

// POST /tasks — create a new task
router.post('/', async (req, res, next) => {
  try {
    const { title, completed } = req.body || {};

    if (!title || typeof title !== 'string') {
      throw httpError(400, 'Field "title" is required and must be a string');
    }

    const tasks = await readTasks();
    const newTask = {
      id: nanoid(10),
      title,
      completed: typeof completed === 'boolean' ? completed : false,
      createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    await writeTasks(tasks);

    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id — update a task
router.put('/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const index = tasks.findIndex((t) => t.id === req.params.id);
    if (index === -1) throw httpError(404, `Task ${req.params.id} not found`);

    const { title, completed } = req.body || {};

    if (title !== undefined && typeof title !== 'string') {
      throw httpError(400, 'Field "title" must be a string');
    }
    if (completed !== undefined && typeof completed !== 'boolean') {
      throw httpError(400, 'Field "completed" must be a boolean');
    }

    tasks[index] = {
      ...tasks[index],
      ...(title !== undefined && { title }),
      ...(completed !== undefined && { completed }),
    };

    await writeTasks(tasks);
    res.status(200).json(tasks[index]);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id — remove a task
router.delete('/:id', async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const index = tasks.findIndex((t) => t.id === req.params.id);
    if (index === -1) throw httpError(404, `Task ${req.params.id} not found`);

    tasks.splice(index, 1);
    await writeTasks(tasks);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;