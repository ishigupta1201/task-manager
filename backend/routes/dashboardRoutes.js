// backend/routes/dashboardRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/auth'); // Assuming your auth middleware is auth.js
const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Dashboard
 * description: Dashboard specific routes for authenticated users
 */

/**
 * @swagger
 * /api/dashboard/summary:
 * get:
 * summary: Get a summary of tasks for the authenticated user
 * tags: [Dashboard]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: User's task summary data.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * totalTasks:
 * type: integer
 * tasksToDo:
 * type: integer
 * tasksInProgress:
 * type: integer
 * tasksDone:
 * type: integer
 * 401:
 * description: Unauthorized.
 * 500:
 * description: Server error.
 */
router.get('/summary', authMiddleware, async (req, res) => {
  // This is a placeholder. You would implement actual logic here
  // to fetch a summary of tasks related to req.user.id
  // e.g., count tasks by status for the logged-in user.
  try {
    // Example: Replace with actual database queries
    // const totalTasks = await Task.countDocuments({ createdBy: req.user.id });
    // const tasksToDo = await Task.countDocuments({ createdBy: req.user.id, status: 'To Do' });
    // ... etc.

    res.json({
      message: 'Dashboard summary data (placeholder)',
      user: req.user.email,
      summary: {
        totalTasks: 10, // Dummy data
        tasksToDo: 3,
        tasksInProgress: 5,
        tasksDone: 2,
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard summary.' });
  }
});


module.exports = router;