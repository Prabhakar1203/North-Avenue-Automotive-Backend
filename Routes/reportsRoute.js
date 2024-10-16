
const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path as necessary


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


router.get('/getAverageTimeInInventory', async (req, res) => {
    const query = `
        SELECT 
            v.Vehicle_type, 
            CASE 
                WHEN COUNT(v.Sold_date) > 0 THEN ROUND(AVG(DATEDIFF(v.Sold_date, v.Purchase_date) + 1), 2)
                ELSE 'N/A'
            END AS Avg_Days_In_Inventory
        FROM 
            Vehicles v
        GROUP BY 
            v.Vehicle_type
    `;

    try {
        const [results] = await db.query(query); // Execute the query
        res.json(results); // Return the results as a JSON response
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Database error: ' + err.message); // Handle any errors
    }
});

router.get('/getAveragePricePerCondition', async (req, res) => {
    try {
        const query = `
                        
                SELECT 
                    v.Vehicle_type,
                    COALESCE(Round(AVG(CASE WHEN v.Vehicle_condition = 'Excellent' THEN v.Purchase_Price END), 2), 0) AS Avg_Price_Excellent,
                    COALESCE(Round(AVG(CASE WHEN v.Vehicle_condition = 'Very Good' THEN v.Purchase_Price END), 2), 0) AS Avg_Price_Very_Good,
                    COALESCE(Round(AVG(CASE WHEN v.Vehicle_condition = 'Good' THEN v.Purchase_Price END), 2), 0) AS Avg_Price_Good,
                    COALESCE(Round(AVG(CASE WHEN v.Vehicle_condition = 'Fair' THEN v.Purchase_Price END), 2), 0) AS Avg_Price_Fair
                FROM 
                    Vehicles v
                GROUP BY 
                    v.Vehicle_type
                ORDER BY 
                    v.Vehicle_type;

        `;

        const [results] = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Error fetching average price per condition:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/getPartsStatistics', async (req, res) => {
    try {
        
        const query = `
            SELECT 
                v.Vendor_Name,
                COALESCE(SUM(pi.Part_quantity), 0) AS Total_Quantity_Supplied,
                COALESCE(SUM(pi.Part_unit_price * pi.Part_quantity), 0) AS Total_Amount_Spent
            FROM 
                Vendors v
            LEFT JOIN 
                Part_orders po ON v.Vendor_id = po.Vendor_id
            LEFT JOIN 
                Parts_items pi ON po.Order_id = pi.Order_id
            GROUP BY 
                v.Vendor_id
            ORDER BY 
                Total_Amount_Spent DESC;
        `;

        const [results] = await db.query(query);
        res.json(results); // Send the data as a JSON response
       
    } catch (error) {
        console.error('Error fetching parts statistics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/getMontlySales', async(req, res)=>{

    try{
        const query = `SELECT 
            YEAR(Sold_date) AS Sale_Year,
            MONTH(Sold_date) AS Sale_Month,
            COUNT(VIN) AS Total_Vehicles_Sold,
            SUM(Selling_Price) AS Gross_Sales_Income,
            SUM(Selling_Price - Purchase_Price) AS Total_Net_Income
        FROM 
            Vehicles
        WHERE 
            Sold_date IS NOT NULL
        GROUP BY 
            Sale_Year, Sale_Month
        ORDER BY 
            Sale_Year DESC, Sale_Month DESC`;

        const [results] = await db.query(query);
        res.json(results); // Send the data as a JSON response

    }catch(error){
        console.error('Error while fetching monthly sales', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


// Get Monthly Sales Drilldown with Employee Names
router.get('/getMonthlySalesDrilldown/:year/:month', async (req, res) => {
    const { year, month } = req.params;

    try {
      
        const query = `
            SELECT 
                e.First_Name,
                e.Last_Name,
                COUNT(v.VIN) AS Vehicles_Sold,
                SUM(v.Selling_Price) AS Total_Sales
            FROM 
                Vehicles v
            JOIN 
                Employees e ON v.Sold_by_employee = e.Username
            WHERE 
                YEAR(v.Sold_date) = ? AND MONTH(v.Sold_date) = ?
            GROUP BY 
                e.Username, e.First_Name, e.Last_Name
            ORDER BY 
                Vehicles_Sold DESC, Total_Sales DESC;
        `;

        const [results] = await db.query(query,[year, month]);
        res.json(results); // Send the data as a JSON response

    } catch (error) {
        console.error('Error fetching monthly sales drilldown:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router; // Correctly export the router