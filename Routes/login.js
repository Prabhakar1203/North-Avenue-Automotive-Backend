// routes/user.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Check if the username exists
        const usernameQuery = 'SELECT * FROM employee WHERE Username = ?';
        const [userRows] = await db.query(usernameQuery, [username]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];
        const storedPassword = user.Password; // Ensure that passwords are hashed in production
        const jobTitle = user.JobTitle;

        // Validate password
        if (storedPassword === password) {
            // Respond with user details, including job title
            return res.status(200).json({ 
                message: 'Login successful', 
                user: { 
                    username: user.Username, // Include username or other needed fields
                    role:jobTitle 
                }
            });
        } else {
            return res.status(401).json({ message: 'Incorrect password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
