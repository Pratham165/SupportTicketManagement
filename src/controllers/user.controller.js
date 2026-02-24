
const db = require("../config/db");
const bcrypt = require("bcrypt");



exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are necessary" });
        }

        const roleMapping = { 'MANAGER': 1, 'SUPPORT': 2, 'USER': 3 };
        const role_id = roleMapping[role.toUpperCase()];

        if (!role_id) {
            return res.status(400).json({ message: "Invalid role. Use MANAGER, SUPPORT, or USER." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

       
        const [result] = await db.query(
            "INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role_id]
        );

        
        const [rows] = await db.query(`
            SELECT 
                u.id, u.name, u.email, u.created_at,
                r.id as r_id, r.name as r_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `, [result.insertId]);

        const user = rows[0];

        
        const response = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: {
                id: user.r_id,
                name: user.r_name
            },
            created_at: user.created_at
        };

        res.status(201).json(response);

    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        
        const [rows] = await db.query(`
            SELECT 
                u.id, u.name, u.email, u.created_at,
                r.id as r_id, r.name as r_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
        `);

        
        const formattedUsers = rows.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: {
                id: user.r_id,
                name: user.r_name
            },
            created_at: user.created_at
        }));

        res.status(200).json(formattedUsers);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};