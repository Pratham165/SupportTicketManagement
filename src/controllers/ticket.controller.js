const db = require('../config/db');


exports.createTicket = async (req, res) => {
    try {
        const { title, description, priority } = req.body;
        if (!title || !description || !priority) {
            return res.status(400).json({ message: "Title, description, and priority are required" });
        }

        const [result] = await db.query(
            "INSERT INTO tickets (title, description, priority, created_by, status) VALUES (?, ?, ?, ?, 'OPEN')",
            [title, description, priority, req.user.userId]
        );

        const ticketId = result.insertId;

        
        const [rows] = await db.query(`
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, t.created_at,
                u1.id as c_id, u1.name as c_name, u1.email as c_email, u1.created_at as c_at,
                r1.id as c_r_id, r1.name as c_r_name,
                u2.id as a_id, u2.name as a_name, u2.email as a_email, u2.created_at as a_at,
                r2.id as a_r_id, r2.name as a_r_name
            FROM tickets t
            JOIN users u1 ON t.created_by = u1.id
            JOIN roles r1 ON u1.role_id = r1.id
            LEFT JOIN users u2 ON t.assigned_to = u2.id
            LEFT JOIN roles r2 ON u2.role_id = r2.id
            WHERE t.id = ?
        `, [ticketId]);

        const ticket = rows[0];

        const response = {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            created_by: {
                id: ticket.c_id,
                name: ticket.c_name,
                email: ticket.c_email,
                role: {
                    id: ticket.c_r_id,
                    name: ticket.c_r_name
                },
                created_at: ticket.c_at
            },
            assigned_to: ticket.a_id ? {
                id: ticket.a_id,
                name: ticket.a_name,
                email: ticket.a_email,
                role: {
                    id: ticket.a_r_id,
                    name: ticket.a_r_name
                },
                created_at: ticket.a_at
            } : null,
            created_at: ticket.created_at
        };

        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getTickets = async (req, res) => {
    try {
        let sql = `
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, t.created_at,
                u1.id as c_id, u1.name as c_name, u1.email as c_email, u1.created_at as c_at,
                r1.id as c_r_id, r1.name as c_r_name,
                u2.id as a_id, u2.name as a_name, u2.email as a_email, u2.created_at as a_at,
                r2.id as a_r_id, r2.name as a_r_name
            FROM tickets t
            JOIN users u1 ON t.created_by = u1.id
            JOIN roles r1 ON u1.role_id = r1.id
            LEFT JOIN users u2 ON t.assigned_to = u2.id
            LEFT JOIN roles r2 ON u2.role_id = r2.id
        `;
        
        let params = [];

        
        if (req.user.role === 'USER') {
            sql += " WHERE t.created_by = ?";
            params.push(req.user.userId);
        }

        const [rows] = await db.query(sql, params);

        
        const formattedTickets = rows.map(ticket => ({
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            created_by: {
                id: ticket.c_id,
                name: ticket.c_name,
                email: ticket.c_email,
                role: {
                    id: ticket.c_r_id,
                    name: ticket.c_r_name
                },
                created_at: ticket.c_at
            },
            assigned_to: ticket.a_id ? {
                id: ticket.a_id,
                name: ticket.a_name,
                email: ticket.a_email,
                role: {
                    id: ticket.a_r_id,
                    name: ticket.a_r_name
                },
                created_at: ticket.a_at
            } : null,
            created_at: ticket.created_at
        }));

        res.status(200).json(formattedTickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        
        const [result] = await db.query("UPDATE tickets SET status = ? WHERE id = ?", [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        
        const [rows] = await db.query(`
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, t.created_at,
                u1.id as c_id, u1.name as c_name, u1.email as c_email, u1.created_at as c_at,
                r1.id as c_r_id, r1.name as c_r_name,
                u2.id as a_id, u2.name as a_name, u2.email as a_email, u2.created_at as a_at,
                r2.id as a_r_id, r2.name as a_r_name
            FROM tickets t
            JOIN users u1 ON t.created_by = u1.id
            JOIN roles r1 ON u1.role_id = r1.id
            LEFT JOIN users u2 ON t.assigned_to = u2.id
            LEFT JOIN roles r2 ON u2.role_id = r2.id
            WHERE t.id = ?
        `, [id]);

        const ticket = rows[0];

        
        const response = {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            created_by: {
                id: ticket.c_id,
                name: ticket.c_name,
                email: ticket.c_email,
                role: { id: ticket.c_r_id, name: ticket.c_r_name },
                created_at: ticket.c_at
            },
            assigned_to: ticket.a_id ? {
                id: ticket.a_id,
                name: ticket.a_name,
                email: ticket.a_email,
                role: { id: ticket.a_r_id, name: ticket.a_r_name },
                created_at: ticket.a_at
            } : null,
            created_at: ticket.created_at
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.assignTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; 

        if (!userId) {
            return res.status(400).json({ message: "userId is required for assignment" });
        }

        const [result] = await db.query(
            "UPDATE tickets SET assigned_to = ? WHERE id = ?",
            [userId, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        
        const [rows] = await db.query(`
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, t.created_at,
                u1.id as c_id, u1.name as c_name, u1.email as c_email, u1.created_at as c_at,
                r1.id as c_r_id, r1.name as c_r_name,
                u2.id as a_id, u2.name as a_name, u2.email as a_email, u2.created_at as a_at,
                r2.id as a_r_id, r2.name as a_r_name
            FROM tickets t
            JOIN users u1 ON t.created_by = u1.id
            JOIN roles r1 ON u1.role_id = r1.id
            LEFT JOIN users u2 ON t.assigned_to = u2.id
            LEFT JOIN roles r2 ON u2.role_id = r2.id
            WHERE t.id = ?
        `, [id]);

        const ticket = rows[0];

        
        const response = {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            created_by: {
                id: ticket.c_id,
                name: ticket.c_name,
                email: ticket.c_email,
                role: { id: ticket.c_r_id, name: ticket.c_r_name },
                created_at: ticket.c_at
            },
            assigned_to: ticket.a_id ? {
                id: ticket.a_id,
                name: ticket.a_name,
                email: ticket.a_email,
                role: { id: ticket.a_r_id, name: ticket.a_r_name },
                created_at: ticket.a_at
            } : null,
            created_at: ticket.created_at
        };

        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query("DELETE FROM tickets WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};