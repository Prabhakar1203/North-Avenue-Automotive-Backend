const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path as necessary

// Route to get all part orders
router.get('/get-part-order', async (req, res) => {
    const query = 'SELECT * FROM part_order';
    try {
        const [results] = await db.query(query); // Await the promise and destructure to get the results
        // console.log("Raw results:", results);
        
        // Format results to convert buffer fields to strings
        const formattedResults = results.map(row => {
            for (const key in row) {
                if (Buffer.isBuffer(row[key])) {
                    row[key] = row[key].toString('utf-8'); // Convert buffer to string
                }
            }
            return row;
        });
        res.json(formattedResults); // Send all results
    } catch (err) {
        console.error('Error fetching part orders:', err);
        return res.status(500).json({ error: err.message });
    }
});

// Route to get vehicle details
router.get('/get-vehicle-details', async (req, res) => {
    const query = 'SELECT * FROM vehicle';
    try {
        const [results] = await db.query(query); // Await the promise and destructure to get the results
        // console.log("Raw results:", results);
        
        // Format results to convert buffer fields to strings
        const formattedResults = results.map(row => {
            for (const key in row) {
                if (Buffer.isBuffer(row[key])) {
                    row[key] = row[key].toString('utf-8'); // Convert buffer to string
                }
            }
            return row;
        });

        // Check if no results were found
        if (formattedResults.length === 0) {
            console.log('No vehicles found.');
            return res.status(404).json({ message: 'No vehicles found.' });
        }

        res.json(formattedResults); // Send all results
    } catch (err) {
        console.error('Error fetching vehicle details:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router; // Correctly export the router
