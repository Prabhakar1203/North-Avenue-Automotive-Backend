const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const RouteOrder = require('./Routes/partOrderRoute'); // Adjust the path as necessary
const searchRoute = require('./Routes/searchRoute')
const loginRoute = require('./Routes/login')

const db = require('./db'); // Import the DB connection

const app = express();
const PORT = 9004;

app.use(cors());
app.use(bodyParser.json());

// Basic route
app.get('/', (req, res) => {
    res.send("Server is connected");
});

// Test DB connection
app.get('/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Use the routes
app.use('/api', RouteOrder);
app.use('/api',searchRoute);
app.use('/api',loginRoute)

// Start the server
app.listen(PORT, () => {
    console.log("Port running on", PORT);
});
