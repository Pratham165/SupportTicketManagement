const db = require('../config/db');

exports.addComment = async (req, res) => {
    try {
        const { id } = req.params; 
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        
        const [result] = await db.query(
            "INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)",
            [id, req.user.userId, comment]
        );

        const commentId = result.insertId;

        
        const [rows] = await db.query(`
            SELECT 
                c.id, c.comment, c.created_at,
                u.id as u_id, u.name as u_name, u.email as u_email, u.created_at as u_at,
                r.id as r_id, r.name as r_name
            FROM ticket_comments c
            JOIN users u ON c.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE c.id = ?
        `, [commentId]);

        const data = rows[0];

        
        const response = {
            id: data.id,
            comment: data.comment,
            user: {
                id: data.u_id,
                name: data.u_name,
                email: data.u_email,
                role: {
                    id: data.r_id,
                    name: data.r_name
                },
                created_at: data.u_at
            },
            created_at: data.created_at
        };

        res.status(201).json(response);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTicketComments = async (req, res) => {
    try {
        const { id } = req.params; 

        
        const [rows] = await db.query(`
            SELECT 
                c.id, c.comment, c.created_at,
                u.id as u_id, u.name as u_name, u.email as u_email, u.created_at as u_at,
                r.id as r_id, r.name as r_name
            FROM ticket_comments c
            JOIN users u ON c.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE c.ticket_id = ?
            ORDER BY c.created_at DESC
        `, [id]);

       
        const formattedComments = rows.map(data => ({
            id: data.id,
            comment: data.comment,
            user: {
                id: data.u_id,
                name: data.u_name,
                email: data.u_email,
                role: {
                    id: data.r_id,
                    name: data.r_name
                },
                created_at: data.u_at
            },
            created_at: data.created_at
        }));

        res.status(200).json(formattedComments);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        
        const [result] = await db.query("DELETE FROM ticket_comments WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Comment not found" });
        }

        
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};