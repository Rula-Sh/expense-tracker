const API_URL = "http://localhost:3000/api/expenses";
const loader = document.getElementById("loader");
const barChart = document.getElementById("bar-chart");
const pieChart = document.getElementById("pie-chart");
let expenses;
let filteredExpenses;

const Addform = document.getElementById("add-form");
const newTitle = document.getElementById("title-input");
const newAmount = document.getElementById("amount-input");
const newCategory = document.getElementById("category-input");
const newDate = document.getElementById("date-input");

const expensesTable = document.getElementById("expenses-table");
const tableBody = document.querySelector("tbody");
const noExpenses = document.getElementById("no-expenses");
const categoryFilter = document.getElementById("category-filter");
const search = document.getElementById("search");

const editModal = new bootstrap.Modal(document.getElementById("edit-modal"));
const EditForm = document.getElementById("edit-form");
const editTitle = document.getElementById("title-input-modal");
const editAmount = document.getElementById("amount-input-modal");
const editCategory = document.getElementById("category-input-modal");
const editDate = document.getElementById("date-input-modal");
const mustUpdateMsg = document.getElementById("must-update");
let editingExpense = null;

const alert = document.getElementById("alert");

getExpenses();
newDate.valueAsDate = new Date();

window.addEventListener("load", function () {
  if (loader) {
    loader.classList.add("hidden");
  }
});

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

function renderExpenses(expenses) {
  const totalExpenses = document.getElementById("exp-total");
  const expenseCount = document.getElementById("exp-count");
  const highestExpenseAmount = document.getElementById("highest-exp-amount");
  const highestExpenseTitle = document.getElementById("highest-exp-title");

  expenseCount.textContent = expenses.length;

  let total = 0;
  let highestExpenseObj = expenses[0] ?? null;

  tableBody.innerHTML = "";
  search.value = "";

  for (const expense of expenses) {
    addExpenseRow(expense);

    total += expense.amount;
    highestExpenseObj =
      highestExpenseObj.amount > expense.amount ? highestExpenseObj : expense;
  }
  totalExpenses.textContent = total.toFixed(2) ?? 0;
  highestExpenseAmount.textContent = highestExpenseObj?.amount?.toFixed(2) ?? 0;
  highestExpenseTitle.textContent = highestExpenseObj?.title ?? "";
  styleCategories();
  updateChart();
}

function addExpenseRow(expense) {
  const row = document.createElement("tr");

  const title = document.createElement("td");
  const amount = document.createElement("td");
  const category = document.createElement("td");
  const date = document.createElement("td");
  const actions = document.createElement("td");

  title.textContent = expense.title;
  amount.textContent = expense.amount.toFixed(2);
  category.textContent = expense.category;
  date.textContent = expense.date;

  const btnWrapper = document.createElement("div");
  btnWrapper.classList.add("d-flex", "justify-content-end", "gap-1");
  const deleteBtn = document.createElement("button");
  const editBtn = document.createElement("button");
  deleteBtn.classList.add("btn", "btn-outline-danger", "btn-sm");
  editBtn.classList.add("btn", "btn-outline-secondary", "btn-sm");
  deleteBtn.textContent = "Delete";
  editBtn.textContent = "Edit";
  btnWrapper.appendChild(editBtn);
  btnWrapper.appendChild(deleteBtn);
  actions.appendChild(btnWrapper);
  editBtn.addEventListener("click", () => showEditExpenseModal(expense));
  deleteBtn.addEventListener("click", () => deleteExpense(expense.id));
  editBtn.setAttribute("data-bs-toggle", "modal");
  editBtn.setAttribute("data-bs-target", "#edit-modal");

  row.appendChild(title);
  row.appendChild(amount);
  row.appendChild(category);
  row.appendChild(date);
  row.appendChild(actions);

  tableBody.appendChild(row);
}

Addform.addEventListener("submit", (event) => {
  event.preventDefault();
  Addform.classList.add("was-validated");

  let newExpense = {
    title: newTitle.value,
    amount: newAmount.valueAsNumber,
    category: newCategory.value,
    date: newDate.value,
  };

  if (Addform.checkValidity()) {
    addExpense(newExpense);
    Addform.classList.remove("was-validated");
    Addform.reset();
  } else {
    showAlert("Warning!", "Make sure to fill in all fields!", "alert-warning");
  }
});

async function addExpense(newExpense) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newExpense),
    });

    await throwIfNotOk(response);

    await getExpenses();
    newDate.valueAsDate = new Date();

    showAlert("Success!", "Expense has been created!", "alert-success");
  } catch (error) {
    handleFetchError(error, "add expense");
  }
}

function showEditExpenseModal(expense) {
  editTitle.value = expense.title;
  editAmount.value = expense.amount;
  editCategory.value = expense.category;
  editDate.value = expense.date;
  editingExpense = expense;
  mustUpdateMsg.textContent = "";
}

EditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!editingExpense) return;

  const updatedExpense = {
    id: editingExpense.id,
    title: editTitle.value,
    amount: editAmount.valueAsNumber,
    category: editCategory.value,
    date: editDate.value,
  };

  const unchanged =
    editingExpense.title === updatedExpense.title &&
    Number(editingExpense.amount) === updatedExpense.amount &&
    editingExpense.category === updatedExpense.category &&
    editingExpense.date === updatedExpense.date;

  if (unchanged) {
    mustUpdateMsg.textContent = "You must update at least one field first!";
    showAlert(
      "Warning!",
      "Can't update an expense with the same info!",
      "alert-warning",
    );
    return;
  }

  EditForm.classList.add("was-validated");
  if (EditForm.checkValidity()) {
    await updateExpense(updatedExpense);
    EditForm.classList.remove("was-validated");
    editModal.hide();
    mustUpdateMsg.textContent = "";
    editingExpense = null;
  }
});

async function updateExpense(expense) {
  try {
    const response = await fetch(`${API_URL}/${expense.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });

    await throwIfNotOk(response);

    await getExpenses();
    showAlert("Success!", "Expense has been updated!", "alert-success");
  } catch (error) {
    handleFetchError(error, "update expense");
  }
}

async function deleteExpense(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    await throwIfNotOk(response);

    await getExpenses();
    showAlert("", "Expense has been deleted!", "alert-info");
  } catch (error) {
    handleFetchError(error, "delete expense");
  }
}

async function throwIfNotOk(response) {
  if (response.ok) return;

  const errorData = await response.json();
  const err = new Error(errorData.error || "Something went wrong");
  err.isResponseError = true;
  err.status = response.status;
  throw err;
}

function handleFetchError(error, message) {
  if (error.isResponseError) {
    showAlert("Failed!", error.message, "alert-danger");
  } else {
    console.error(`Failed to ${message}:`, error);
    showAlert("Failed!", "Something went wrong.", "alert-danger");
  }
}

function styleCategories() {
  const rows = Array.from(document.querySelectorAll("tr")).slice(1, -1);
  rows.forEach((row) => {
    const categoryTd = row.children[2];
    const categoryElem = document.createElement("span");
    categoryElem.textContent = categoryTd.textContent;
    categoryTd.innerHTML = "";

    switch (categoryElem.textContent) {
      case "Food":
        categoryElem.classList.add("food");
        break;
      case "Transport":
        categoryElem.classList.add("transport");
        break;
      case "Bills":
        categoryElem.classList.add("bills");
        break;
      case "Entertainment":
        categoryElem.classList.add("entertainment");
        break;
      default:
        categoryElem.classList.add("other");
        break;
    }
    categoryTd.appendChild(categoryElem);
  });
}

function updateChart() {
  try {
    if (expenses.length == 0) {
      document.getElementById("charts-parent").style.display = "none";
      return;
    } else {
      document.getElementById("charts-parent").style.display = "flex";
    }

    let categoryList = ["Food", "Transport", "Bills", "Entertainment", "Other"];
    let totalCategoriesAmount = [];
    let totalCategoriesCount = [];
    for (let i = 0; i < categoryList.length; i++) {
      let totalCategoryAmount = 0;
      let totalCategoryCount = 0;
      for (const exp of expenses) {
        if (exp.category === categoryList[i]) {
          totalCategoryAmount += exp.amount;
          totalCategoryCount++;
        }
      }
      totalCategoriesAmount.push(totalCategoryAmount);
      totalCategoriesCount.push(totalCategoryCount);
    }

    Chart.helpers.each(Chart.instances, function (instance) {
      instance.destroy();
    });

    new Chart(barChart, {
      type: "bar",
      data: {
        labels: categoryList,
        datasets: [
          {
            label: "# expenses per category",
            data: totalCategoriesCount,
            borderWidth: 1,
            backgroundColor: [
              "rgba(52, 134, 79, 0.2)",
              "rgba(72, 102, 252, 0.2)",
              "rgba(238, 192, 4, 0.2)",
              "rgba(95, 198, 234, 0.2)",
              "rgba(109, 115, 122, 0.2)",
            ],
            borderColor: [
              "rgba(52, 134, 79, 1)",
              "rgba(72, 102, 252, 1)",
              "rgba(238, 192, 4, 1)",
              "rgba(95, 198, 234, 1)",
              "rgba(109, 115, 122, 1)",
            ],
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
    new Chart(pieChart, {
      type: "pie",
      data: {
        labels: categoryList,
        datasets: [
          {
            label: "total amount",
            data: totalCategoriesAmount,
            borderWidth: 1,
            backgroundColor: [
              "rgba(52, 134, 79, 0.9)",
              "rgba(72, 102, 252, 0.9)",
              "rgba(238, 192, 4, 0.9)",
              "rgba(95, 198, 234, 0.9)",
              "rgba(109, 115, 122, 0.9)",
            ],
          },
        ],
      },
    });
  } catch (error) {
    console.error("Failed to Load Charts:", error);
  }
}

function showAlert(title, message, type) {
  const alertTitle = document.getElementById("alert-title");
  const alertDesc = document.getElementById("alert-description");

  alert.className = `alert ${type}`;
  alertTitle.textContent = title;
  alertDesc.textContent = message;

  alert.classList.remove("show-alert");
  void alert.offsetWidth;
  alert.classList.add("show-alert");
}

categoryFilter.addEventListener("change", () => {
  filteredExpenses = filterByTitleAndCategory();

  showFilteredExpenses();
});

search.addEventListener("keyup", () => {
  filteredExpenses = filterByTitleAndCategory();

  showFilteredExpenses();
});

function filterByTitleAndCategory() {
  const title = search.value.toLowerCase();
  const category = categoryFilter.value;

  return expenses.filter((e) =>
    category === "All"
      ? e.title.toLowerCase().startsWith(title)
      : e.category === category && e.title.toLowerCase().startsWith(title),
  );
}

function showFilteredExpenses() {
  tableBody.innerHTML = "";

  if (filteredExpenses.length === 0) {
    noExpenses.textContent = "Could not find the expense you are looking for";
    expensesTable.style.display = "none";
    noExpenses.style.display = "block";
  } else {
    expensesTable.style.display = "table";
    noExpenses.style.display = "none";

    filteredExpenses.forEach((e) => {
      addExpenseRow(e);
    });

    styleCategories();
  }
}

function tableToCSV() {
  let data = [];
  let rows = document.getElementsByTagName("tr");

  for (let i = 0; i < rows.length - 1; i++) {
    let cols = rows[i].querySelectorAll("td,th");
    let row = [];
    for (let j = 0; j < cols.length - 1; j++) {
      row.push(cols[j].textContent);
    }
    data.push(row.join(","));
  }
  data = data.join("\n");
  downloadCSVFile(data);
}

function downloadCSVFile(csvData) {
  CSVFile = new Blob([csvData], { type: "text/csv" });
  let tempLink = document.createElement("a");
  const categoryName =
    categoryFilter.value === "All"
      ? ""
      : `${categoryFilter.value.toLowerCase()}-`;
  tempLink.download = `${categoryName}expenses.csv`;
  let url = window.URL.createObjectURL(CSVFile);
  tempLink.href = url;
  tempLink.style.display = "none";
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  window.URL.revokeObjectURL(url);
}
