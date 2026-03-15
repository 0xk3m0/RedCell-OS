const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const auth     = require('../controllers/authController');
const dash     = require('../controllers/dashboardController');
const planner  = require('../controllers/plannerController');
const habits   = require('../controllers/habitsController');
const rm       = require('../controllers/roadmapController');
const projects = require('../controllers/projectsController');
const review   = require('../controllers/reviewController');
const notes    = require('../controllers/notesController');
const settings = require('../controllers/settingsController');

// Auth
router.post('/auth/register', auth.register);
router.post('/auth/login',    auth.login);
router.post('/auth/logout',   auth.logout);
router.get('/auth/me',        auth.me);

// Dashboard
router.get('/dashboard/stats',     requireAuth, dash.getStats);
router.get('/dashboard/focus',     requireAuth, dash.getRecentFocus);
router.get('/dashboard/tasks',     requireAuth, dash.getTodayTasks);
router.get('/dashboard/daily-note',requireAuth, dash.getDailyNote);
router.put('/dashboard/daily-note',requireAuth, dash.saveDailyNote);

// Planner
router.get('/tasks',         requireAuth, planner.getTasks);
router.post('/tasks',        requireAuth, planner.createTask);
router.put('/tasks/:id',     requireAuth, planner.updateTask);
router.delete('/tasks/:id',  requireAuth, planner.deleteTask);
router.post('/focus',        requireAuth, planner.logFocus);
router.get('/energy',        requireAuth, planner.getEnergy);
router.post('/energy',       requireAuth, planner.setEnergy);

// Habits
router.get('/habits',              requireAuth, habits.getHabits);
router.post('/habits',             requireAuth, habits.createHabit);
router.put('/habits/:id',          requireAuth, habits.updateHabit);
router.post('/habits/:id/log',     requireAuth, habits.logHabit);
router.delete('/habits/:id',       requireAuth, habits.deleteHabit);
router.put('/habits/reorder',      requireAuth, habits.reorder);

// Roadmap
router.get('/roadmap/maps',                              requireAuth, rm.getMaps);
router.post('/roadmap/maps',                             requireAuth, rm.createMap);
router.put('/roadmap/maps/:id',                          requireAuth, rm.updateMap);
router.delete('/roadmap/maps/:id',                       requireAuth, rm.deleteMap);
router.get('/roadmap/maps/:mapId/data',                  requireAuth, rm.getMap);
router.post('/roadmap/groups',                           requireAuth, rm.createGroup);
router.put('/roadmap/groups/:id',                        requireAuth, rm.updateGroup);
router.delete('/roadmap/groups/:id',                     requireAuth, rm.deleteGroup);
router.post('/roadmap/items',                            requireAuth, rm.createItem);
router.get('/roadmap/items/:id',                         requireAuth, rm.getItem);
router.put('/roadmap/items/:id',                         requireAuth, rm.updateItem);
router.delete('/roadmap/items/:id',                      requireAuth, rm.deleteItem);
router.post('/roadmap/items/:id/subtopics',              requireAuth, rm.addSubtopic);
router.put('/roadmap/subtopics/:subId/toggle',           requireAuth, rm.toggleSubtopic);
router.delete('/roadmap/subtopics/:subId',               requireAuth, rm.deleteSubtopic);
router.post('/roadmap/items/:id/resources',              requireAuth, rm.addResource);
router.delete('/roadmap/items/:id/resources/:idx',       requireAuth, rm.deleteResource);
router.post('/roadmap/items/:id/labs',                   requireAuth, rm.addLab);
router.get('/roadmap/stats',                             requireAuth, rm.getStats);

// Projects
router.get('/projects',                          requireAuth, projects.getAll);
router.post('/projects',                         requireAuth, projects.create);
router.get('/projects/:id',                      requireAuth, projects.getOne);
router.put('/projects/:id',                      requireAuth, projects.update);
router.delete('/projects/:id',                   requireAuth, projects.remove);
router.post('/projects/:id/tasks',               requireAuth, projects.addTask);
router.put('/projects/:id/tasks/:taskId/toggle', requireAuth, projects.toggleTask);
router.delete('/projects/:id/tasks/:taskId',     requireAuth, projects.deleteTask);
router.put('/projects/:id/note',                 requireAuth, projects.saveNote);

// Notes
router.get('/notes/categories',        requireAuth, notes.getCategories);
router.post('/notes/categories',       requireAuth, notes.createCategory);
router.put('/notes/categories/:id',    requireAuth, notes.updateCategory);
router.delete('/notes/categories/:id', requireAuth, notes.deleteCategory);
router.get('/notes',                   requireAuth, notes.getNotes);
router.get('/notes/:id',               requireAuth, notes.getNote);
router.post('/notes',                  requireAuth, notes.createNote);
router.put('/notes/:id',               requireAuth, notes.updateNote);
router.delete('/notes/:id',            requireAuth, notes.deleteNote);

// Review
router.get('/review',         requireAuth, review.get);
router.post('/review',        requireAuth, review.save);
router.get('/review/history', requireAuth, review.history);

// Settings
router.get('/settings',            requireAuth, settings.get);
router.put('/settings',            requireAuth, settings.update);
router.put('/settings/password',   requireAuth, settings.changePassword);
router.delete('/settings/account', requireAuth, settings.deleteAccount);
router.get('/settings/stats',      requireAuth, settings.getStats);

module.exports = router;
