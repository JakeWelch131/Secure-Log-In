const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'welch.DB');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL
    )`);
	db.run(`CREATE TABLE IF NOT EXISTS email ( 
		id INTEGER PRIMARY KEY AUTOINCREMENT, 
		username TEXT NOT NULL, 
		password TEXT NOT NULL, 
		email TEXT NOT NULL 
	)`);
	//insert default data
	const stmt = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
    stmt.run('admin', 'adminpassword');
    stmt.run('user', 'userpassword');
    stmt.finalize();
    console.log('Initial data inserted into the users table.');
	const stmt2 = db.prepare(`INSERT INTO email (username, password, email) VALUES (?, ?, ?)`);
    stmt2.run('admin', 'adminpassword', 'admin@admin.com');
    stmt2.run('user', 'userpassword', 'user@user.com');
    stmt2.finalize();
});

module.exports = db;