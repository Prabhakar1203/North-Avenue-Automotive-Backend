const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path as necessary

// Route to search for vehicles
// Route to search for vehicles
router.post('/search', async (req, res) => {
    const { searched_word } = req.body;

    // Check if the search word is provided
    if (!searched_word) {
        console.error('Search word is missing from the request');
        return res.status(400).send('Search word is required');
    }

    // SQL query with LIKE operator for partial matches
    const query = `
        SELECT VIN, Vehicle_Type, Manufacturer_name, Model_year, Fuel_type, Color, Selling_Price 
        FROM vehicles
        WHERE (Vehicle_Type LIKE ? 
        OR Manufacturer_name LIKE ? 
        OR Model_year LIKE ? 
        OR Fuel_type LIKE ? 
        OR Color LIKE ? 
        OR VIN LIKE ?)
        AND Sold_to_customer_id IS NULL
        ORDER BY VIN
    `;

    // Parameters for the SQL query, with '%' for partial matches
    const queryParams = [
        `%${searched_word}%`, // Vehicle type
        `%${searched_word}%`, // Manufacturer name
        `%${searched_word}%`, // Model year
        `%${searched_word}%`, // Fuel type
        `%${searched_word}%`, // Color
        `%${searched_word}%`  // VIN
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
