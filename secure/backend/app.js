const express = require('express');
const path = require('path');
const app = express();
const db = require('./database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// this is for phase 2 to use 256 AES bit encryption
const key = crypto.randomBytes(32); // this gives us the 256 bit key

// encryption function to send to database
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = ?`; // Use parameterized query for phase 2
    console.log(query);
    db.all(query, [username], async (err, rows) => {
        if (err) {
            console.error('Database error:', err.message); 
            return res.status(500).json({ error: err.message });
        }
        if (rows.length > 0) {
            const user = rows[0];
			const decryptPassword = decrypt(user.password);	// decrypt the password for phase 2
            const isEqual = await bcrypt.compare(password, decryptPassword);	//compare the hashed and decrypted password
            if (isEqual) {
                console.log('Extracted data:', rows);
                res.json({ success: true, message: 'Login successful', data: rows });
            } else {
                res.status(401).json({ success: false, message: 'Invalid username or password' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    });
});

// post request to register a new user
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
	try {

		const hashedPassword = await bcrypt.hash(password, 10);	// hash the password for phase 2
		const encryptPassword = encrypt(hashedPassword);	// encrypt the hashed password for phase 2
		// Vulnerable query using string interpolation	
		const query = `SELECT * FROM users WHERE username = ?`; // safe query construction
		db.get(query, [username], async (err, row) => {		// [username] is the parameter for the query
			if (err) {
				console.error('Database error:', err.message);
				return res.status(500).json({ error: err.message });
			}
			if (row) {
				return res.status(400).json({ success: false, message: 'Username already exists' });
			} else {
				// Insert new user into the database
				const insertUserQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
				db.run(insertUserQuery, [username, encryptPassword], function(err) {
					if (err) {
						console.error('Database error:', err.message);
						return res.status(500).json({ error: err.message });
					}
				});
				const insertEmailQuery = `INSERT INTO email (username, password, email) VALUES (?, ?, ?)`;
				db.run(insertEmailQuery, [username, encryptPassword, email], function(err) {
					if (err) {
						console.error('Database error:', err.message);
						return res.status(500).json({ error: err.message });
					}
					res.json({ success: true, message: 'User registered successfully' });
				});
			}
		});
	} catch (error) {
		console.error('Error in hashing:', error);
		return res.status(500).json({ error: error.message });
	}
});

app.put('/update-password', async (req, res) => {
    const { username, originalPassword, newPassword } = req.body;
    try {
        const query = `SELECT * FROM users WHERE username = ?`;
        db.get(query, [username], async (err, user) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            if (user) {
                    const hashedNewPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
                    const encryptedNewPassword = encrypt(hashedNewPassword); // Encrypt the hashed new password

                    const updateQuery = `UPDATE users SET password = ? WHERE username = ?`;
                    db.run(updateQuery, [encryptedNewPassword, username], function(err) {
                        if (err) {
                            console.error('Database error:', err.message);
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ success: true, message: 'Password updated successfully' });
                    });
            }  
			 else {
                    res.status(401).json({ success: false, message: 'Invalid original password' });
            } 
        });
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
	console.log('Server listening on port 3000');
});