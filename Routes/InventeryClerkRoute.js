const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection
const { route } = require('./salesMan');

router.post('/addingVehicle', async (req, res) => {
    const { 
        VIN, 
        Vehicle_type, 
        Manufacturer_name, 
        Model_name, 
        Model_year, 
        Fuel_type,
        Color,
        Mileage, 
        Additional_description, 
        Bought_from_customer_id, 
        Purchase_date, 
        Purchased_by_employee, 
        Updated_by_employee, 
        Vehicle_condition, 
        Purchase_Price
    } = req.body;
    
    console.log(VIN);
    
    try {
        const query = `
            INSERT INTO Vehicles (
                VIN, 
                Vehicle_type, 
                Manufacturer_name, 
                Model_name, 
                Model_year, 
                Fuel_type,
                Color,
                Mileage, 
                Additional_description, 
                Bought_from_customer_id, 
                Purchase_date, 
                Purchased_by_employee, 
                Updated_by_employee, 
                Vehicle_condition, 
                Purchase_Price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Ensure the db.query is asynchronous
        const results = await db.query(query, [
            VIN, 
            Vehicle_type, 
            Manufacturer_name, 
            Model_name, 
            Model_year, 
            Fuel_type,
            Color,
            Mileage, 
            Additional_description, 
            Bought_from_customer_id, 
            Purchase_date, 
            Purchased_by_employee, 
            Updated_by_employee, 
            Vehicle_condition, 
            Purchase_Price
        ]);
        
        res.status(200).json({
            message: 'Vehicle added successfully',
        });
    } catch (error) {
        console.error('Error adding vehicle:', error);
        res.status(500).json({
            message: 'Failed to add vehicle',
            error: error.message,
        });
    }
});


router.post('/totalPartsAndCost', async (req, res) => {
    const { VIN } = req.body; // Extract VIN from the request body

    if (!VIN) {
        return res.status(400).json({ message: "VIN is required" });
    }

    try {
        // SQL query to calculate the parts price for the given VIN
        const query = `
          SELECT 
            v.VIN,
            v.Purchase_Price,
            pi.Part_description AS each_part,
            pi.Part_quantity AS part_quantity,
            pi.Part_unit_price AS Part_unit_price,
            pi.Part_unit_price * pi.Part_quantity AS each_part_cost,
            SUM(pi.Part_unit_price * pi.Part_quantity) AS total_cost_of_parts,
            (v.Purchase_Price * 1.25) + (SUM(pi.Part_unit_price * pi.Part_quantity) * 1.10) AS sale_price
        FROM 
            vehicles v
        JOIN 
            Part_orders po ON v.VIN = po.VIN
        JOIN 
            Parts_items pi ON po.Order_id = pi.Order_id
        WHERE 
            v.VIN = ?  -- Placeholder for the VIN you are searching for
        GROUP BY 
            v.VIN, v.Purchase_Price, pi.Part_description, pi.Part_unit_price, pi.Part_quantity;
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

router.post('/partOrderDetailsWithItems', async (req, res) => {
    const { Order_id, VIN, Vendor_id, parts } = req.body;

    try {
        // Insert into Part_orders
        const orderQuery = `
            INSERT INTO Part_orders (Order_id, VIN, Vendor_id)
            VALUES (?, ?, ?)
        `;
        await db.query(orderQuery, [Order_id, VIN, Vendor_id]);

        // Insert into Parts_items for each part in the parts array
        const itemQuery = `
            INSERT INTO Parts_items (Order_id, Order_line_number, Purchase_order_number, Order_status, Part_unit_price, Part_quantity, Part_description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        for (const part of parts) {
            const { Order_line_number, Purchase_order_number, Order_status, Part_unit_price, Part_quantity, Part_description } = part;
            
            await db.query(itemQuery, [
                Order_id,
                Order_line_number,
                Purchase_order_number,
                Order_status,
                Part_unit_price,
                Part_quantity,
                Part_description
            ]);
        }

        res.status(200).json({
            message: 'Order and parts placed successfully',
        });

    } catch (error) {
        console.error('Error while placing order and parts:', error);
        res.status(500).json({
            message: 'Failed to place order and parts',
            error: error.message,
        });
    }
});


router.post('/addingVendors', async(req,res)=>{
  const {Vendor_id, Vendor_Name, Vendor_Address, Vendor_City, Vendor_State, Vendor_Post_Code, Vendor_Phone_Number} = req.body;

    try{
     const query = `Insert into vendors (Vendor_id, Vendor_Name, Vendor_Address, Vendor_City, Vendor_State, Vendor_Post_Code, Vendor_Phone_Number) 
        Values(?,?,?,?,?,?,?)`;

        await db.query(query, [
            Vendor_id,
            Vendor_Name, 
            Vendor_Address, 
            Vendor_City, 
            Vendor_State, 
            Vendor_Post_Code, 
            Vendor_Phone_Number
        ])

        res.status(200).json({
            message: 'Vendor added Succussfully',
        });

    } catch (error) {
        console.error('Error while adding vendors:', error);
        res.status(500).json({
            message: 'Error while adding vendors',
            error: error.message,
        });
    }
})

router.post('/UpdateSellingPrice', async (req, res) => {
    const { VIN } = req.body;  // VIN should come from the request body

    // Check if VIN is provided
    if (!VIN) {
        return res.status(400).json({ message: 'VIN is required' });
    }

    try {
        // SQL query to update the selling price
        const query = `
            UPDATE vehicles v
            LEFT JOIN (
                SELECT po.VIN, SUM(pi.Part_unit_price * pi.Part_quantity) AS total_parts_cost
                FROM Part_orders po
                JOIN Parts_items pi ON po.Order_id = pi.Order_id
                GROUP BY po.VIN
            ) parts ON v.VIN = parts.VIN
            SET v.Selling_Price = IF(
                parts.total_parts_cost IS NULL,
                v.Purchase_Price * 1.25,
                (v.Purchase_Price * 1.25) + (parts.total_parts_cost * 1.10)
            )
            WHERE v.VIN = ?;
        `;

        // Run the query with the provided VIN
        const result = await db.query(query, [VIN]);

        // Check if the update was successful
      
            res.status(200).json({ message: 'Selling price updated successfully' });
        

    } catch (error) {
        console.error('Error updating selling price:', error);
        res.status(500).json({
            message: 'Failed to update selling price',
            error: error.message,
        });
    }
});


module.exports = router;
