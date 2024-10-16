// const mysql = require('mysql2');

// Create MySQL connection
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Prabhakar@123',
//     database: 'northavenueautomotive'
// });

// // Connect to the database
// db.connect((err) => {
//     if (err) throw err;
//     console.log('Connected to MySQL database!');
// });

// // Export the db connection
// module.exports = db;


const mysql = require('mysql2/promise'); // Use the promise-based version of mysql2

// Create a MySQL connection pool (recommended for production apps)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Prabhakar@123',
    database: 'northavenue'
});

// Test the database connection and log a message
db.getConnection()
    .then(connection => {
        console.log('Connected to MySQL database!');
        connection.release(); // Release the connection back to the pool
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });
    
// Export the db connection
module.exports = db;
