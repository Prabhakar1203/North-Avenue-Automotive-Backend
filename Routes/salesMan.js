const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path as necessary

// Route to search for a customer
// Route to search for a customer
router.post('/serachingCustomer', async (req, res) => {
    const { searched_name } = req.body;

    // Check if the search word is provided
    if (!searched_name) {
        console.error('Search word is missing from the request');
        return res.status(400).send('Search word is required');
    }

    // SQL query with placeholders to select customer_id and Last_name
    const query = `SELECT customer_id, Last_name FROM customers WHERE Last_name = ?`;

    try {
        // Execute the query
        const [results] = await db.query(query, [searched_name]);

        // Clean the results to remove any buffer data
        const cleanedResults = results.map(row => {
            const cleanedRow = {};
            for (const key in row) {
                cleanedRow[key] = Buffer.isBuffer(row[key]) ? row[key].toString() : row[key];
            }
            return cleanedRow;
        });

        if (cleanedResults.length === 0) {
            console.log('Sorry, it looks like we don’t have that in stock!');
            return res.status(404).json({ message: "User not found" });
        }

        console.log('User found:', cleanedResults);
        // Send the customer_id and other details to the frontend
        res.status(200).json({ message: "User found, you can sell!", data: cleanedResults });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error: ' + err.message);
    }
});


// Route to add a customer
router.post('/addingUser', async (req, res) => {
    const {
        Customer_id,
        Street,
        City,
        State,
        Postal_code,
        Phone_number,
        Email,
        Customer_type_Bus_Or_Ind,
        First_name,
        Last_name,
        Driver_License,
        Business_tax_identification,
        Business_Name,
        Contact_Name,
        Contact_Title,
    } = req.body; // Destructure request body

    try {
        // Step 1: Check if user with the provided phone number already exists
        const checkQuery = `SELECT * FROM Customers WHERE Phone_number = ?`;
        const [existingUser] = await db.query(checkQuery, [Phone_number]);

        // if (existingUser.length > 0) {
        //     // If user exists, return a message
        //     return res.status(400).json({
        //         message: `User with phone number ${Phone_number} already exists.`,
        //         existingUser: existingUser[0], // Optionally return the existing user details
        //     });
        // }

        // Step 2: If user doesn't exist, insert the new user into the database
        const insertQuery = `
            INSERT INTO Customers (
            Customer_id,
              Street, 
              City, 
              State, 
              Postal_code, 
              Phone_number, 
              Email, 
              Customer_type_Bus_Or_Ind, 
              First_name, 
              Last_name, 
              Driver_License, 
              Business_tax_identification, 
              Business_Name, 
              Contact_Name, 
              Contact_Title
            ) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await db.query(insertQuery, [
            Customer_id,
            Street,
            City,
            State,
            Postal_code,
            Phone_number,
            Email,
            Customer_type_Bus_Or_Ind,
            First_name,
            Last_name,
            Driver_License,
            Business_tax_identification,
            Business_Name,
            Contact_Name,
            Contact_Title,
        ]);

        // Respond with a success message
        res.status(200).json({
            message: 'User added successfully',
         
        });

    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({
            message: 'Failed to add user',
            error: error.message,
        });
    }
});

// Route to search for a vehicle by VIN (excluding vehicles with pending parts on order)
router.post('/searchVehicleByVIN', async (req, res) => {
    const { VIN } = req.body; 
    if (!VIN) {
        return res.status(400).send('VIN is required');
    }

    try {
        // SQL query to search for vehicle by VIN excluding vehicles with pending parts on order
        const query = `
            SELECT * 
            FROM Vehicle
            WHERE VIN = ?`

        const [vehicle] = await db.query(query, [VIN]);

        if (vehicle.length === 0) {
            return res.status(404).send('No vehicle found or the vehicle has pending parts on order');
        }

        res.status(200).json(vehicle);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).send('Database error: ' + error.message);
    }
});

router.post('/sellConfirmation', async (req, res) => {
    // Destructure the required fields from the request body
    const { Customer_id, Username, Selling_Price, Sold_date, VIN } = req.body;

    // const formattedSoldDate = new Date(Sold_date).toISOString().split('T')[0];

    // Check if all required fields are provided
    if (!Customer_id || !Username || !Selling_Price || !Sold_date || !VIN) {
        return res.status(400).send('All fields are required: Customer_id, Username, Selling_Price, Sold_date, VIN');
    }

    try {
        // SQL query to check if the customer exists in the customer table
        const checkCustomerQuery = `
            SELECT * 
            FROM customers
            WHERE Customer_ID = ?
        `;

        // Execute the query to check if the customer exists
        const [customer] = await db.query(checkCustomerQuery, [Customer_id]);

        // If no customer is found, return an error
        if (customer.length === 0) {
            return res.status(404).send('Customer not found. Please check the Customer_id.');
        }

        // If customer exists, proceed with updating the vehicle data
        const updateVehicleQuery = `
            UPDATE vehicles
            SET 
                Sold_to_customer_id = ?, 
                Sold_by_employee = ?, 
                Selling_Price = ?, 
                Sold_date = ?
            WHERE VIN = ?
        `;

        // Execute the query to update the vehicle table with the sale data
        const [updateResult] = await db.query(updateVehicleQuery, [
            Customer_id,
            Username,
            Selling_Price,
            Sold_date,
            VIN
        ]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).send('Vehicle not found. Please check the VIN.');
        }

        // If the vehicle update was successful, return a success response
        res.status(200).json({
            message: 'Car successfully sold and vehicle data updated',
        });
    } catch (error) {
        // Log and return the error if something goes wrong
        console.error('Error selling car or updating vehicle:', error);
        res.status(500).send('Database error: ' + error.message);
    }
});

// DELETE route to delete vehicle after sold
// router.delete('/deleteVehicleAfterSold', async (req, res) => {
//     const { VIN } = req.body;  // The VIN will be passed in the body

//     if (!VIN) {
//         return res.status(400).send('VIN is required');
//     }

//     try {
//         // SQL query to delete vehicle by VIN
//         const query = 'DELETE FROM vehicle WHERE VIN = ?';

//         const [results] = await db.query(query, [VIN]);

//         // If no rows were affected, that means the vehicle was not found
//         if (results.affectedRows === 0) {
//             return res.status(404).send('No vehicle found with the provided VIN');
//         }

//         // Successfully deleted vehicle
//         res.status(200).json({ message: 'Vehicle successfully deleted' });
//     } catch (error) {
//         console.error('Error deleting vehicle:', error);
//         res.status(500).send('Database error: ' + error.message);
//     }
// });



// router.get('/getSoldCars', async (req, res) => {
//     const query = 'SELECT * FROM sales';
//     try {
//         const [results] = await db.query(query); // Await the promise and destructure to get the results

//         // Format results to convert buffer fields to strings
//         const formattedResults = results.map(row => {
//             const cleanedRow = { ...row }; // Copy all properties from `row` to `cleanedRow`
            
//             for (const key in cleanedRow) {
//                 if (Buffer.isBuffer(cleanedRow[key])) {
//                     cleanedRow[key] = cleanedRow[key].toString('utf-8'); // Convert buffer to string
//                 }
//             }
            
//             return cleanedRow; // Return the cleaned row
//         });

//         res.json(formattedResults); // Send all formatted results
//     } catch (err) {
//         console.error('Error fetching sold cars:', err);
//         return res.status(500).json({ error: err.message });
//     }
// });

router.get('/getSellerHistory', async (req, res) => {
    const query = `
        SELECT 
            CONCAT(c.First_name, ' ', c.Last_name) AS Name,
            c.Customer_type_Bus_Or_Ind AS Seller_Type,
            COUNT(v.VIN) AS Total_Vehicles_Sold,
            AVG(v.Purchase_Price) AS Avg_Purchase_Price,
            COALESCE(SUM(p.Part_quantity) / COUNT(v.VIN), 0) AS Avg_Parts_Per_Vehicle,
            COALESCE(SUM(p.Part_unit_price * p.Part_quantity) / COUNT(v.VIN), 0) AS Avg_Part_Cost_Per_Vehicle,
            -- Adding a flag for sellers who need attention
            CASE 
                WHEN COALESCE(SUM(p.Part_quantity) / COUNT(v.VIN), 0) >= 5 
                  OR COALESCE(SUM(p.Part_unit_price * p.Part_quantity) / COUNT(v.VIN), 0) >= 500 
                THEN 1 ELSE 0 
            END AS needs_attention
        FROM 
            Vehicles v
            JOIN Customers c ON v.Bought_from_customer_id = c.Customer_id
            LEFT JOIN Part_orders po ON po.VIN = v.VIN
            LEFT JOIN Parts_items p ON p.Order_id = po.Order_id
        GROUP BY 
            c.Customer_id
        ORDER BY 
            Total_Vehicles_Sold DESC, 
            Avg_Purchase_Price ASC;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Database error: ' + err.message);
    }
});

module.exports = router; // Correctly export the router
