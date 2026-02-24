const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/tickets/:id/comments', auth, commentController.addComment);

router.get('/tickets/:id/comments', auth, commentController.getTicketComments);

router.delete('/comments/:id', auth, commentController.deleteComment);

module.exports = router;