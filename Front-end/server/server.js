
const express = require("express");
const cors = require("cors");
const { sql, getPool } = require("./db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Validate course codes and other submitted data
function validCourseCode(value) {
    return typeof value === "string" &&
        /^[A-Za-z]{2,10}\s+[0-9]{3,5}$/.test(value.trim());
}

// GET - Retrieve all courses from Azure SQL
app.get("/api/courses", async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT
                CourseCode AS code,
                CourseName AS name,
                Credits AS credits
            FROM Courses
            ORDER BY CourseCode
        `);

        res.json(result.recordset);

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({
            error: "Unable to retrieve courses."
        });
    }
});

// POST - Search for a course
app.post("/api/search", async (req, res) => {
    const { courseCode } = req.body || {};

    if (!validCourseCode(courseCode)) {
        return res.status(400).json({
            found: false,
            message: "Enter a valid course code, such as CS 4412."
        });
    }

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input("code", sql.VarChar(20), courseCode.trim().toUpperCase())
            .query(`
                SELECT
                    CourseCode AS code,
                    CourseName AS name,
                    Credits AS credits
                FROM Courses
                WHERE CourseCode = @code
            `);

        if (result.recordset.length > 0) {
            res.json({
                found: true,
                ...result.recordset[0]
            });
        } else {
            res.json({
                found: false,
                message: "Course not found."
            });
        }

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
            error: "Unable to search courses."
        });
    }
});

// POST - Add a new course to Azure SQL
app.post("/api/courses", async (req, res) => {
    const { code, name, credits } = req.body || {};

    if (
        !validCourseCode(code) ||
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100 ||
        !Number.isInteger(credits) ||
        credits < 1 ||
        credits > 6
    ) {
        return res.status(400).json({
            message: "Invalid course information."
        });
    }

    try {
        const pool = await getPool();

        await pool.request()
            .input("code", sql.VarChar(20), code.trim().toUpperCase())
            .input("name", sql.VarChar(100), name.trim())
            .input("credits", sql.Int, credits)
            .query(`
                INSERT INTO Courses
                    (CourseCode, CourseName, Credits)
                VALUES
                    (@code, @name, @credits)
            `);

        res.status(201).json({
            message: "Course added successfully."
        });

    } catch (error) {
        console.error("Insert error:", error);

        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({
                message: "This course already exists."
            });
        }

        res.status(500).json({
            error: "Unable to add course."
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
