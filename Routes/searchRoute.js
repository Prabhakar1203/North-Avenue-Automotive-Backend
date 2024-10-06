const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path as necessary

// Route to search for vehicles
router.post('/search', async (req, res) => {
    const { searched_word } = req.body;

    // Check if the search word is provided
    if (!searched_word) {
        console.error('Search word is missing from the request');
        return res.status(400).send('Search word is required');
    }

    // SQL query with placeholders
    const query = `
        SELECT VIN, Vehicle_Type, Manufacturer_name, Model_year, Fuel_type, Color, Selling_Price 
        FROM vehicle
        WHERE Vehicle_Type = ? 
        OR Manufacturer_name = ? 
        OR Model_year = ? 
        OR Fuel_type = ? 
        OR Color = ? 
        ORDER BY VIN
    `;

    // Parameters for the SQL query
    const queryParams = [
        searched_word, // Vehicle type
        searched_word, // Manufacturer name
        searched_word, // Model year
        searched_word, // Fuel type
        searched_word, // Color
    ];

    try {
        // Execute the query
        const [results] = await db.query(query, queryParams); // Use destructuring to get the results array

        // Clean the results to remove any buffer data
        
        const cleanedResults = results.map(row => {
            const cleanedRow = {};
            for (const key in row) {
                if (Buffer.isBuffer(row[key])) {
                    cleanedRow[key] = row[key].toString(); // Convert buffer to string
                } else {
                    cleanedRow[key] = row[key]; // Keep the value as is
                }
            }
            return cleanedRow;
        });

        if (cleanedResults.length === 0) {
            console.log('Sorry, it looks like we dont have that in stock!');
            return res.status(404).send('Sorry, it looks like we dont have that in stock!');
        }

        res.json(cleanedResults); // Return the cleaned results
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error: ' + err.message);
    }
});

module.exports = router;
