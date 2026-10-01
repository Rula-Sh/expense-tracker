# 🧾 Expense Tracker

A web app to track personal expenses — add, edit, delete, filter, search, export them, and see expenses statistics Built with a **Node.js/Express backend**, a **PostgreSQL database**, and **pure JavaScript frontend** that talks to the API through `fetch`.

## 🚀 How to run

Assuming that **Node.js (LTS)**, **PostgreSQL with pgAdmin**, and **VS Code** are already installed

### 🖥️ Backend

1. Open a terminal and go into the backend folder:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install express cors pg dotenv
   ```
3. Open pgAdmin, create an empty database named `expense_tracker`.
4. Run the `schema.sql` file on that database (it creates the expenses table and adds sample data).
5. create a `.env` file in `backend` folder, and write your PostgreSQL password inside it:
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   DB_NAME=expense_tracker
   ```
6. Start the server:
   ```bash
   node server.js
   ```
   The backend should now be running at `http://localhost:3000`.

### 🎨 Frontend

1. In VS Code, open `frontend/index.html` with the **Live Server** extension (right-click → _"Open with Live Server"_).
2. The app opens in on the browser and talks to the backend (make sure the backend is running before you use it).

## ✨ Features

- ✅ Add an expense (title, amount, category, date) with validation
- ✅ Delete an expense
- ✅ Edit an expense in a Bootstrap modal (PUT)
- ✅ Filter by category (with an "All" option)
- ✅ Summary cards: total amount, number of expenses, highest expense
- ✅ Data is saved in a PostgreSQL database through a REST API
- ✅ Spinner while loading, and clear Bootstrap alerts for every error
- ✅ Responsive design + CSS Grid for the summary cards
- ✅ Search expenses by title
- ✅ Export expenses as an CSV file
- ✅ View expenses in charts (Chart.js)
- [ ] Sort tables by column
- [ ] Dark mode toggle

## 🔌 API Endpoints

| Method     | Path                | What it does         | Success | Errors   |
| :--------- | :------------------ | :------------------- | :------ | :------- |
| **GET**    | `/api/expenses`     | Returns all expenses | 200     | —        |
| **GET**    | `/api/expenses/:id` | Returns one expense  | 200     | 404      |
| **POST**   | `/api/expenses`     | Adds a new expense   | 201     | 400      |
| **PUT**    | `/api/expenses/:id` | Updates an expense   | 200     | 400, 404 |
| **DELETE** | `/api/expenses/:id` | Deletes an expense   | 200     | 404      |

## 📸 Screenshots

### Expense Tracker UI

![Desktop UI with two Chart.js charts, three expense summary cards, an add expense card, and a card for filtering, editing, deleting, and exporting expenses as CSV.](frontend/assets/expense-tracker-ui-desktop.png)
_Desktop UI._

![Mobile UI showing the responsive layout for smaller screens.](frontend/assets/expense-tracker-ui-mobile.png)

_Mobile UI responsive layout._

### Input Validation & Title Filtering

![Desktop UI showing error handling for invalid inputs and the expense table filtered by title.](frontend/assets/invalid-input-and-filter-by-title-desktop.png)
_Form validation and filtering by title._

### Edit Modal & Category Filtering

![Desktop UI showing the edit modal with validation preventing unchanged data, and the expense table filtered by category.](frontend/assets/edit-modal-validation-and-filter-by-category-desktop.png)
_Edit modal validation and filtering by category._

## 🎥 Video

Drive Link: https://drive.google.com/file/d/1WEdOF-RFHKLR00TSg_T_TOrUXtGDKPTN/view?usp=sharing

## 🧗 What was the hardest part?

The hardest part was getting started on the project — especially the backend, since it was my first time setting up and configuring one. I solved it by searching online and referencing snippets from prior notes and mini-projects to get going.

### 📚 Key Code Snippets & Learnings

#### `server.js`

```javascript
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
```

#### `app.js`

```javascript
async function getExpenses() {
  try {
    loader.classList.remove("hidden");
    await new Promise((r) => setTimeout(r, 200));
    const response = await fetch(API_URL);

    await throwIfNotOk(response);

    expenses = await response.json();

    if (expenses.length == 0) {
      noExpenses.textContent = "No expenses has been added yet.";
      expensesTable.style.display = "none";
      noExpenses.style.display = "block";
      showAlert("", "No Expenses has been created yet", "alert-info");
    } else {
      expensesTable.style.display = "table";
      noExpenses.style.display = "none";
    }
    renderExpenses(expenses);
  } catch (error) {
    handleFetchError(error, "get expenses");
  } finally {
    loader.classList.add("hidden");
  }
}
```

| Concept                                            | Where I used it                                          |
| :------------------------------------------------- | :------------------------------------------------------- |
| `toFixed(2)`                                       | Formatting currency totals (returning X.XX format)       |
| `form.checkValidity()` + `form.reset()`            | Add-expense form handling                                |
| `Array.from(...).slice(1, -1)`                     | Reading table rows (excluding header/footer)             |
| `Chart.helpers.each(Chart.instances, ...)`         | Destroying charts before re-render                       |
| `void element.offsetWidth`                         | Restarting CSS animations (to show it again when needed) |
| `Blob` + `URL.createObjectURL` / `revokeObjectURL` | CSV export                                               |

## 📁 Project structure

```text
expense-tracker/
├── backend/
│   ├── endpoints_test/
│   ├── node_modules
│   ├── .env
│   ├── package-lock.json
│   ├── package.json
│   ├── schema.sql
│   └── server.js
├── frontend/
│   ├── css/style.css
│   ├── js/app.js
│   ├── index.html
├── assets/
│   ├── expense-tracker-demo.mp4
│   ├── expense-tracker-ui-desktop.png
│   ├── expense-tracker-ui-mobile.png
│   ├── invalid-input-and-filter-by-title-desktop.png
│   ├── invalid-input-and-filter-by-title-mobile.png
│   ├── edit-modal-validation-and-filter-by-category-desktop.png
│   └── edit-modal-validation-and-filter-by-category-mobile.png
├── .gitignore
└── README.md
```
