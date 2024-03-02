const express = require('express');
const router = express.Router();
const testUser = require('../middleware/testUser');

const {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    showStats,
    getAllPosts
} = require('../controllers/jobs');
const { createTracer } = require('../middleware/custom-tracer');

router.route('/').post(createJob).get(createTracer('/get-posts'), getAllPosts);
router.route('/stats').get(showStats);

router
    .route('/:id')
    .get(createTracer('/get-post'), getJob)
    .patch(testUser, updateJob)
    .delete(testUser, deleteJob);

module.exports = router;
