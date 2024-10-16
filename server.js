const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const RouteOrder = require('./Routes/partOrderRoute'); // Adjust the path as necessary
const searchRoute = require('./Routes/searchRoute')
const loginRoute = require('./Routes/login')
const salesManRoute = require('./Routes/salesMan')
const managerRoute = require('./Routes/managerRoute')
const InventeryClerkRoute = require('./Routes/InventeryClerkRoute')
const reportRoute = require('./Routes/reportsRoute')

const db = require('./db'); // Import the DB connection

const app = express();
const PORT = 9004;

// app.use(cors());

app.use(cors({
  origin: 'http://localhost:5173', // No trailing slash here
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Define the allowed methods
  credentials: true, // If you are sending credentials like cookies, set this to true
}));


app.use(bodyParser.json());
app.use(express.json())

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
app.use('/api',salesManRoute)
app.use('/api',managerRoute)
app.use('/api',InventeryClerkRoute)
app.use('/api', reportRoute)

// Start the server
app.listen(PORT, () => {
    console.log("Port running on", PORT);
});
