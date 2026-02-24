const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');


router.post('/', auth, role('USER'), ticketController.createTicket);


router.get('/', auth, ticketController.getTickets);

router.delete('/:id', auth, role('MANAGER'), ticketController.deleteTicket);

router.patch('/:id/status', auth, role('SUPPORT', 'MANAGER'), ticketController.updateTicketStatus);

module.exports = router;