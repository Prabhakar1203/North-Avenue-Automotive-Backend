const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path as necessary
const bcrypt = require('bcrypt');

router.get('/getPendingCars', async (req, res) => {
    // SQL query to count pending parts for vehicles
    const query = `
        SELECT 
        COUNT(DISTINCT V.VIN) AS Pending_Parts_Count
        FROM 
            Vehicles V
        JOIN 
            Part_orders PO ON V.VIN = PO.VIN
        JOIN 
            Parts_items PI ON PO.Order_id = PI.Order_id
        WHERE 
            PI.Order_status = 'Ordered'; -- Specify the statuses you consider pending
       
        `;
    
    try {
        const [results] = await db.query(query); // Await the promise and destructure to get the results

        // Format results to convert buffer fields to strings (if needed)
        const formattedResults = results.map(row => {
            const cleanedRow = { ...row }; // Copy all properties from `row` to `cleanedRow`
            
            for (const key in cleanedRow) {
                if (Buffer.isBuffer(cleanedRow[key])) {
                    cleanedRow[key] = cleanedRow[key].toString('utf-8'); // Convert buffer to string
                }
            }
            
            return cleanedRow; // Return the cleaned row
        });

        res.json(formattedResults); // Send all formatted results
    } catch (err) {
        console.error('Error fetching pending cars:', err);
        return res.status(500).json({ error: err.message });
    }
});


router.get('/getAvailableCars', async(req,res)=>{
    // SQL query to count  Available  vehicles for sale.
    // VIN, Vehicle_type, Manufacturer_name, Model_name, Model_year, Mileage, Color, Selling_Price
    const query = `SELECT count(1) as "available cars"
                    FROM Vehicles
                    WHERE Sold_to_customer_id IS NULL;`

    try {
        const [results] = await db.query(query); // Await the promise and destructure to get the results
                
        // Format results to convert buffer fields to strings (if needed)
        const formattedResults = results.map(row => {
        const cleanedRow = { ...row }; // Copy all properties from `row` to `cleanedRow`
                            
        for (const key in cleanedRow) {
            if (Buffer.isBuffer(cleanedRow[key])) {
                    cleanedRow[key] = cleanedRow[key].toString('utf-8'); // Convert buffer to string
                }
            }
                            
                return cleanedRow; // Return the cleaned row
            });
                
            res.json(formattedResults); // Send all formatted results
    } catch (err) {
         console.error('Error fetching pending cars:', err);
        return res.status(500).json({ error: err.message });
    }
})



// Get Sold Cars
router.get("/getSoldCars", async (req, res) => {
    const query = `SELECT 
        COUNT(DISTINCT VIN) AS "sold_Vehicles_Count"
        FROM 
            Vehicles
        WHERE 
            Sold_to_customer_id IS NOT NULL; -- Only sold vehicles`; // Only sold vehicles

    try {
        const [results] = await db.query(query);

        // Format results to convert buffer fields to strings (if needed)
        const formattedResults = results.map(row => {
            const cleanedRow = { ...row };
            for (const key in cleanedRow) {
                if (Buffer.isBuffer(cleanedRow[key])) {
                    cleanedRow[key] = cleanedRow[key].toString('utf-8');
                }
            }
            return cleanedRow;
        });

        res.json(formattedResults); // Send the formatted results
    } catch (err) {
        console.error('Error fetching sold cars:', err);
        return res.status(500).json({ error: err.message });
    }
});

// Get Unsold Cars
router.get("/getUnsoldCars", async (req, res) => {
    const query = `SELECT COUNT(DISTINCT VIN) AS "Unsold_Vehicles_Count"
                   FROM Vehicles
                   WHERE Sold_to_customer_id IS NULL;`; // Only unsold vehicles

    try {
        const [results] = await db.query(query);

        // Format results to convert buffer fields to strings (if needed)
        const formattedResults = results.map(row => {
            const cleanedRow = { ...row };
            for (const key in cleanedRow) {
                if (Buffer.isBuffer(cleanedRow[key])) {
                    cleanedRow[key] = cleanedRow[key].toString('utf-8');
                }
            }
            return cleanedRow;
        });

        res.json(formattedResults); // Send the formatted results
    } catch (err) {
        console.error('Error fetching unsold cars:', err);
        return res.status(500).json({ error: err.message });
    }
});

router.post('/getManagerSearchByVIN', async(req,res)=>{
    const { searched_Car } = req.body;
    // Check if the search word is provided
    if (!searched_Car) {
        console.error('Search word is missing from the request');
        return res.status(400).send('Search word is required');
    }
      // SQL query with placeholders
      const query = `
      SELECT VIN, Vehicle_Type, Manufacturer_name, Model_year, Fuel_type, Color 
      FROM vehicles
      WHERE VIN = ? 
      ORDER BY VIN
        `;
    // Parameters for the SQL query
    const queryParams = [
            searched_Car ]

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

})

router.post('/getSellerDetailsByVIN', async (req, res) => {
    const { searched_Car } = req.body;
    
    if (!searched_Car) {
        return res.status(400).send('VIN is required');
    }

    const query = `
        SELECT 
            C.Customer_id AS Seller_Customer_ID, 
            C.First_name AS Seller_First_Name, 
            C.Last_name AS Seller_Last_Name, 
            C.Street AS Seller_Street, 
            C.City AS Seller_City, 
            V.Purchase_date, 
            V.Purchase_Price, 
            C.State AS Seller_State, 
            C.Postal_code AS Seller_Postal_Code, 
            C.Phone_number AS Seller_Phone_Number, 
            E.First_Name AS Inventory_Clerk_First_Name,
            E.Last_Name AS Inventory_Clerk_Last_Name
        FROM 
            Vehicles V
        JOIN 
            Customers C
        ON 
            V.Bought_from_customer_id = C.Customer_id
        JOIN 
            Employees E
        ON 
            V.Purchased_by_employee = E.Username
        WHERE 
            V.VIN = ?
    `;

    try {
        const [results] = await db.query(query, [searched_Car]);

        if (results.length === 0) {
            return res.status(404).send('No vehicle found for the provided VIN');
        }

        res.json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Database error: ' + err.message);
    }
});


router.post('/getBuyerDetailsByVIN', async (req, res) => {
    const { searched_Car } = req.body;

    if (!searched_Car) {
        return res.status(400).send('VIN is required');
    }

    const query = `
        SELECT 
            C2.Customer_id AS Buyer_Customer_ID, 
            C2.First_name AS Buyer_First_Name, 
            C2.Last_name AS Buyer_Last_Name, 
            C2.Street AS Buyer_Street, 
            C2.City AS Buyer_City, 
            C2.State AS Buyer_State, 
            C2.Postal_code AS Buyer_Postal_Code, 
            C2.Phone_number AS Buyer_Phone_Number, 
            C2.Email AS Buyer_Email,
            V.Purchase_date, 
            V.Purchase_Price, 
            E.First_Name AS Salesperson_First_Name,
            E.Last_Name AS Salesperson_Last_Name
        FROM 
            Vehicles V
        LEFT JOIN 
            Customers C2 ON V.Sold_to_customer_id = C2.Customer_id      -- Buyer details
        LEFT JOIN 
            Employees E ON V.Sold_by_employee = E.Username              -- Salesperson details
        WHERE 
            V.VIN = ?;
    `;

    const queryParams = [searched_Car];

    try {
        const [results] = await db.query(query, queryParams);
        const cleanedResults = results.map(row => {
            const cleanedRow = {};
            for (const key in row) {
                if (Buffer.isBuffer(row[key])) {
                    cleanedRow[key] = row[key].toString();
                } else {
                    cleanedRow[key] = row[key];
                }
            }
            return cleanedRow;
        });

        if (cleanedResults.length === 0) {
            return res.status(404).send('No vehicle found with the provided VIN.');
        }

        res.json(cleanedResults);
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error: ' + err.message);
    }
});


router.post('/totalCostOfParts', async (req, res) => {
    const { VIN } = req.body; // Extract VIN from the request body

    if (!VIN) {
        return res.status(400).json({ message: "VIN is required" });
    }

    try {
        // SQL query to calculate the parts price for the given VIN
        const query = `
            SELECT 
                po.VIN,
                SUM(pi.Part_unit_price * pi.Part_quantity) AS "parts_price_actual",
                SUM((pi.Part_unit_price * pi.Part_quantity) * 1.2) AS "total_parts_price"
            FROM 
                Parts_items pi
            JOIN 
                Part_orders po ON pi.Order_id = po.Order_id
            WHERE 
                po.VIN = ? 
            GROUP BY 
                po.VIN;
        `;

        // Execute the query with VIN as a parameter
        const [results] = await db.query(query, [VIN]); // Correct query execution

        // If no parts found for the VIN, return a message
        if (results.length === 0) {
            return res.status(404).send('No parts ordered for this Vehicle.');
        }

        // Cleaning the results to handle buffer data types
        const cleanedResults = results.map(row => {
            const cleanedRow = {};
            for (const key in row) {
                if (Buffer.isBuffer(row[key])) {
                    cleanedRow[key] = row[key].toString(); // Convert buffer to string
                } else {
                    cleanedRow[key] = row[key];
                }
            }
            return cleanedRow;
        });

        // Send the cleaned results as a response
        res.json(cleanedResults[0]); // Since you're querying by VIN, you expect only one row
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error: ' + err.message);
    }
});

router.post('/addingEmployee', async (req, res) => {
    const { Username, First_Name, Last_Name, JobTitle, Password, Entitlements } = req.body;

    // Check if all required fields are provided
    if (!Username || !First_Name || !Last_Name || !JobTitle || !Password || !Entitlements) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Hash the password using bcrypt with a salt round of 10
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Insert into MySQL database
        const sql = 'INSERT INTO Employees (Username, First_Name, Last_Name, JobTitle, Password, Entitlements) VALUES (?, ?, ?, ?, ?, ?)';
        const [results] = await db.query(sql, [Username, First_Name, Last_Name, JobTitle, hashedPassword, Entitlements]);

        res.status(201).json({ message: 'Employee added successfully', employeeId: results.insertId });
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding employee', error: err });
    }
});

module.exports = router; // Correctly export the router
