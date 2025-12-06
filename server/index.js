import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gemini_nexus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB Connection
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err);
    });

// API Routes

// 1. Get all sessions
app.get('/api/sessions', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM sessions ORDER BY updated_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create a new session
app.post('/api/sessions', async (req, res) => {
    const { title } = req.body;
    const id = uuidv4();
    try {
        await pool.query('INSERT INTO sessions (id, title) VALUES (?, ?)', [id, title || '新对话']);
        res.json({ id, title, created_at: new Date() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get messages for a session
app.get('/api/sessions/:id/messages', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC', [req.params.id]);
        // Parse metrics JSON back to object
        const messages = rows.map(row => ({
            ...row,
            metrics: typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics
        }));
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Save a message
app.post('/api/messages', async (req, res) => {
    const { session_id, role, content, metrics, timestamp, id } = req.body;
    const messageId = id || uuidv4();
    
    try {
        // Ensure session exists (optional safeguard)
        const [sessionCheck] = await pool.query('SELECT id FROM sessions WHERE id = ?', [session_id]);
        if (sessionCheck.length === 0) {
             return res.status(404).json({ error: "Session not found" });
        }

        await pool.query(
            'INSERT INTO messages (id, session_id, role, content, metrics, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [messageId, session_id, role, content, JSON.stringify(metrics || {}), timestamp]
        );
        
        // Update session timestamp
        await pool.query('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [session_id]);

        res.json({ success: true, id: messageId });
    } catch (err) {
        console.error("Save message error", err);
        res.status(500).json({ error: err.message });
    }
});

// 5. Delete a session
app.delete('/api/sessions/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM sessions WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Update session title
app.patch('/api/sessions/:id', async (req, res) => {
    const { title } = req.body;
    try {
        await pool.query('UPDATE sessions SET title = ? WHERE id = ?', [title, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
