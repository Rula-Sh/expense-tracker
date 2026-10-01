require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = 3000;
const categories = ["Food", "Transport", "Bills", "Entertainment", "Other"];

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, amount::float8 AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date 
            FROM expenses ORDER BY id;`,
    );
    res.json(result.rows);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(404).json({ error: "ID must be a number." });
    }

    const result = await pool.query(
      `SELECT id, title, amount::float8 AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date 
            FROM expenses WHERE id = $1;`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Internal Server Error.", details: err.message });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title || !amount || !category || !date) {
      return res.status(400).json({ error: "Not all fields are provided." });
    } else if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ error: "The amount should be numeric and above 0." });
    } else if (!categories.includes(category)) {
      return res
        .status(400)
        .json({ error: "The category is not part of the provided list." });
    } else if (isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: "The provided date is invalid." });
    }

    const result = await pool.query(
      `INSERT INTO expenses (title, amount, category, date) VALUES ($1, $2, $3, TO_DATE($4, 'YYYY-MM-DD')) 
        RETURNING id, title, amount::float8 AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date;`,
      [title, Number(amount), category, date],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;

    if (!Number.isInteger(Number(id))) {
      return res.status(404).json({ error: "ID must be a number." });
    }

    const existingExpense = await pool.query("SELECT id FROM expenses WHERE id = $1", [
      id,
    ]);
    if (existingExpense.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found." });
    }

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ error: "Not all fields are provided." });
    } else if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ error: "The amount should be numeric and above 0." });
    } else if (!categories.includes(category)) {
      return res
        .status(400)
        .json({ error: "The category is not part of the provided list." });
    } else if (isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: "The provided date is invalid." });
    }

    const result = await pool.query(
      `UPDATE expenses SET title = $1, amount = $2, category = $3, date = TO_DATE($4, 'YYYY-MM-DD') WHERE id = $5
        RETURNING id, title, amount::float8 AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date;`,
      [title, Number(amount), category, date, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(404).json({ error: "ID must be a number." });
    }

    const result = await pool.query(
      `DELETE FROM expenses WHERE id = $1 
        RETURNING id, title, amount::float8 AS amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date;`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found." });
    }

    res.json({
      message: "Expense deleted successfully.",
      deletedExpense: result.rows[0],
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}
    try the below URLs:
    - http://localhost:3000/api/expenses
    - http://localhost:3000/api/expenses/1
    - http://localhost:3000/api/expenses/55
    - http://localhost:3000/api/expenses/abc`);
});
