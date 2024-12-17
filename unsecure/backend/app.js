const express = require('express');
const path = require('path');
const app = express();
const db = require('./database');

app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', (req, res) => {
	const { username, password } = req.body;
	const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
	console.log(query);
	db.all(query, (err, rows) => {
        if (err) {
			console.error('Database error:', err.message); 
            return res.status(500).json({ error: err.message });
        }
        if (rows.length > 0) {
            // Log or display the extracted data
            console.log('Extracted data:', rows);
            res.json({ success: true, message: 'Login successful', data: rows });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    });
});

// post request to register a new user
app.post('/register', (req, res) => {
    const { username, password, email } = req.body;

    // Vulnerable query using string interpolation
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`; // unsafe query construction
    db.get(query, (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        } else {
            // Insert new user into the database
            const insertUserQuery = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;
            db.run(insertUserQuery, function(err) {
                if (err) {
                    console.error('Database error:', err.message);
                    return res.status(500).json({ error: err.message });
                }
            });
			const insertEmailQuery = `INSERT INTO email (username, password, email) VALUES ('${username}', '${password}', '${email}')`;
            db.run(insertEmailQuery, function(err) {
                if (err) {
                    console.error('Database error:', err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, message: 'User registered successfully' });
            });
        }
    });
});

app.put('/update-password', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
	console.log(`username: ${username}, oldpassword: ${oldPassword}, newPassword: ${newPassword}`);
    const checkQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${oldPassword}'`;
    
    db.get(checkQuery, (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(400).json({ success: false, message: 'Invalid username or old password' });
        }
        
        const updateQuery = `UPDATE users SET password = '${newPassword}' WHERE username = '${username}'`;
        db.run(updateQuery, function(err) {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: 'Password updated successfully' });
        });
    });
});

app.listen(3000, () => {
	console.log('Server listening on port 3000');
});