import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gemini_nexus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create Pool
const pool = mysql.createPool(dbConfig);

// Initialize Database Tables Automatically
const initDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL/MariaDB Database connected successfully');
        
        // 1. Create Sessions Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Create Messages Table
        // Use JSON type if supported, otherwise LONGTEXT is fine for storing JSON string
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(36) PRIMARY KEY,
                session_id VARCHAR(36) NOT NULL,
                role VARCHAR(20) NOT NULL,
                content LONGTEXT NOT NULL,
                metrics JSON, 
                timestamp BIGINT NOT NULL,
                CONSTRAINT fk_session
                FOREIGN KEY (session_id) 
                REFERENCES sessions(id) 
                ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Database tables initialized (sessions & messages).');
        connection.release();
    } catch (err) {
        console.error('❌ Database initialization failed:', err);
        console.error('   Please checks your .env file for DB_USER and DB_PASSWORD.');
    }
};

// Run init on startup
initDB();

// API Routes

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
    }
});

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
        console.error("Create session error:", err);
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
        // Ensure session exists (safeguard against race conditions)
        const [sessionCheck] = await pool.query('SELECT id FROM sessions WHERE id = ?', [session_id]);
        if (sessionCheck.length === 0) {
             return res.status(404).json({ error: "Session not found" });
        }

        await pool.query(
            'INSERT INTO messages (id, session_id, role, content, metrics, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [messageId, session_id, role, content, JSON.stringify(metrics || {}), timestamp]
        );
        
        // Update session timestamp to move it to top of list
        await pool.query('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [session_id]);

        res.json({ success: true, id: messageId });
    } catch (err) {
        console.error("Save message error:", err);
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

// Priority: APP_PORT -> PORT -> 3001
const PORT = process.env.APP_PORT || process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use.`);
        if (PORT == 3306) {
             console.error(`⚠️  It looks like you are trying to run the server on port 3306.`);
             console.error(`   This is typically used by MySQL/MariaDB. Please change APP_PORT in your .env file to 3001.`);
        } else {
             console.error(`   Please change the APP_PORT in .env to a different number (e.g., 3002) or stop the process using port ${PORT}.`);
        }
        process.exit(1);
    } else {
        console.error(e);
    }
});