/* ==========================================================
   CORE  -  shared by every page
   ----------------------------------------------------------
   1. Small UI helpers (message, loading, escaping, icons)
   2. Formatting
   3. Expense months
   4. Balance calculation          (rules unchanged)
   5. Google Sheet API
   6. Local cache of the sheet data
========================================================== */

let allTransactions = [];
let allAdjustments = [];
let allClosing = [];

const CHART_COLORS = [
    "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#14B8A6", "#84CC16", "#F97316", "#6366F1", "#06B6D4"
];

// Value of the "All months" option in the month dropdown
const ALL_MONTHS = "";


/* ==========================================================
   1. UI HELPERS
========================================================== */

function showMessage(msg, color) {

    const box = document.getElementById("msgBox");

    if (!box) return;

    box.style.color = color || "";
    box.textContent = msg;
}

function showLoading() {

    let overlay = document.getElementById("loadingOverlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "loadingOverlay";
        overlay.className = "loading-overlay";
        overlay.innerHTML = '<div class="spinner" role="status" aria-label="Loading"></div>';
        document.body.appendChild(overlay);
    }

    overlay.style.display = "flex";
}

function hideLoading() {

    const overlay = document.getElementById("loadingOverlay");

    if (overlay) overlay.style.display = "none";
}

/** Makes sheet text safe to put inside HTML */
function esc(text) {

    return String(text == null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function getCategoryIcon(category) {

    const icons = {
        "Household": "fa-house",
        "Mobile": "fa-mobile-screen",
        "Vehicle": "fa-car",
        "Education": "fa-graduation-cap",
        "Entertainment": "fa-film",
        "Grocery": "fa-cart-shopping",
        "Medical": "fa-briefcase-medical",
        "Policy": "fa-shield",
        "Personal": "fa-user",
        "School": "fa-school",
        "Investment": "fa-chart-line",
        "Utility": "fa-wrench"
    };

    return icons[category] || "fa-folder";
}


/* ==========================================================
   2. FORMATTING
========================================================== */

function toRupees(value, minDecimals) {

    return "₹" +
        Number(value).toLocaleString("en-IN", {
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: 2
        });
}

/** ₹1,234.5  (up to 2 decimals) */
function formatAmount(value) {

    return toRupees(value, 0);
}

/** ₹1,234.50  (2 decimals whenever the value is not a whole number) */
function formatMoney(value) {

    const n = Math.round((Number(value) || 0) * 100) / 100;

    return toRupees(n, Number.isInteger(n) ? 0 : 2);
}


/* ==========================================================
   3. EXPENSE MONTHS
   A day from the 1st to the 6th belongs to the previous month.
========================================================== */

const MONTH_NAMES =
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getExpenseMonth(dateObj) {

    let month = dateObj.getMonth();
    let year = dateObj.getFullYear();

    if (dateObj.getDate() <= 6) {

        month--;

        if (month < 0) {
            month = 11;
            year--;
        }
    }

    return MONTH_NAMES[month] + "-" + year;
}

/** Expense month ("Oct-2026") of a transaction or adjustment row */
function rowMonth(row) {

    return getExpenseMonth(new Date(row[1]));
}

function sortExpenseMonths(months) {

    const time = label => {
        const [m, y] = label.split("-");
        return new Date(Number(y), MONTH_NAMES.indexOf(m), 1);
    };

    return [...months].sort((a, b) => time(a) - time(b));
}

/** Every month that has a transaction or an adjustment, oldest first */
function monthsOf(transactions, adjustments) {

    return sortExpenseMonths(
        new Set([
            ...transactions.map(rowMonth),
            ...adjustments.map(rowMonth)
        ])
    );
}

function getAllMonths() {

    return monthsOf(allTransactions, allAdjustments);
}

/**
 * Fills the #cmbMonth dropdown.
 * includeAll adds an "All months" option at the top.
 */
function populateMonths(
    transactions,
    adjustments,
    selectedValue = null,
    includeAll = false
) {

    const cmb = document.getElementById("cmbMonth");

    if (!cmb) return;

    const months = monthsOf(transactions, adjustments);

    cmb.innerHTML = "";

    if (includeAll) {
        cmb.add(new Option("All months", ALL_MONTHS));
    }

    months.forEach(month => cmb.add(new Option(month, month)));

    const wanted =
        selectedValue !== null &&
        (selectedValue === ALL_MONTHS ? includeAll : months.includes(selectedValue));

    cmb.value = wanted
        ? selectedValue
        : months[months.length - 1];
}


/* ==========================================================
   4. BALANCES
   Month by month, starting from the MonthlyBalances sheet.
   selectedMonth = ALL_MONTHS  ->  every month is included.
========================================================== */

function calculateBalances(selectedMonth) {

    const balances = {};

    allClosing.forEach(row => {
        balances[row[1]] = Number(row[2]) || 0;
    });

    const cashRow = allClosing.find(r => r[1] === "CASH");

    balances["CASH"] = cashRow ? Number(cashRow[2]) || 0 : 0;

    for (const month of getAllMonths()) {

        processMonth(month, balances);

        if (month === selectedMonth) break;
    }

    return balances;
}

function processMonth(month, balances) {

    // ---- Expenses ----

    allTransactions.forEach(row => {

        if (rowMonth(row) !== month) return;

        const amount = Number(row[2]) || 0;
        const mode = String(row[5] || "").trim();

        if (mode === "CashIn") {
            balances["CASH"] += amount;
        }
        else if (mode === "CashOut") {
            balances["CASH"] -= amount;
        }
        else if (balances.hasOwnProperty(mode)) {
            balances[mode] -= amount;
        }
    });

    // ---- Adjustments (transfers, income, investments) ----

    allAdjustments.forEach(row => {

        if (rowMonth(row) !== month) return;

        const amount = Number(row[2]) || 0;
        const fromMode = String(row[3] || "").trim();
        const toMode = String(row[4] || "").trim();
        const adjType = String(row[5] || "").trim();

        const fromIsAccount = LEDGER_ACCOUNTS.includes(fromMode);
        const toIsAccount = LEDGER_ACCOUNTS.includes(toMode);

        if (fromMode === "TRCASH" && toMode === "CASH" && adjType === "Internal") {
            // Real transfer
            balances["TRCASH"] -= amount;
            balances["CASH"] += amount;
        }
        else if (fromMode === "TRCASH" && toMode === "CASH") {
            // Historical rule: only CASH goes up
            balances["CASH"] += amount;
        }
        else if (fromIsAccount && toIsAccount) {
            balances[fromMode] -= amount;
            balances[toMode] += amount;
        }
        else if (fromIsAccount) {
            // Money going out, e.g. CRHD -> GROWW
            balances[fromMode] -= amount;
        }
        else if (toIsAccount) {
            // Money coming in, e.g. Salary -> CRHD, cashback, dividend
            balances[toMode] += amount;
        }
    });
}

/**
 * Opening balance of one account for a month
 * (for "All months" it is the opening of the very first month).
 */
function getOpeningBalance(account, selectedMonth) {

    const firstRow = allClosing.find(r => r[1] === account);

    if (!firstRow) return 0;

    let opening = Number(firstRow[2]) || 0;

    for (const month of getAllMonths()) {

        if (selectedMonth === ALL_MONTHS || month === selectedMonth) break;

        opening = calculateAccountClosing(account, opening, month);
    }

    return opening;
}

function calculateAccountClosing(account, opening, month) {

    let balance = opening;

    allTransactions.forEach(r => {

        if (rowMonth(r) !== month) return;

        const amount = Number(r[2]) || 0;
        const mode = String(r[5] || "").trim();

        if (account === "CASH") {

            if (mode === "CashIn") balance += amount;
            else if (mode === "CashOut") balance -= amount;

            return;
        }

        if (mode === account) balance -= amount;
    });

    allAdjustments.forEach(r => {

        if (rowMonth(r) !== month) return;

        const amount = Number(r[2]) || 0;
        const fromMode = String(r[3] || "").trim();
        const toMode = String(r[4] || "").trim();

        // TRCASH -> CASH increases CASH only
        if (fromMode === "TRCASH" && toMode === "CASH") {

            if (account === "CASH") balance += amount;
        }
        else {

            if (fromMode === account) balance -= amount;
            if (toMode === account) balance += amount;
        }
    });

    return balance;
}


/* ==========================================================
   5. GOOGLE SHEET API  (Apps Script, see AppScript.txt)
========================================================== */

async function callApi(params) {

    const url = CONFIG.apiUrl + "?" + new URLSearchParams(params).toString();

    const response = await fetch(url);

    return await response.json();
}

/** Reads a list from the API, or throws the server's message */
async function fetchList(action) {

    const result = await callApi({ action });

    if (!result.success) throw result.message;

    return result.data;
}

const getAllTransactions = () => fetchList("getall");
const getMonthlyClosing = () => fetchList("getmonthlyclosing");
const getAdjustments = () => fetchList("getadjustments");

const getTransactionById = id => callApi({ action: "getbyid", id });

function transactionParams(action, d) {

    return {
        action,
        id: d.id,
        date: d.date,
        amount: d.amount,
        description: d.description,
        category: d.category,
        mode: d.mode,
        paymentMedium: d.paymentMedium,
        remarks: d.remarks,
        createdOn: d.createdOn,
        updatedOn: d.updatedOn
    };
}

const saveTransaction = data => callApi(transactionParams("save", data));
const updateTransaction = data => callApi(transactionParams("update", data));

async function deleteTransaction(id) {

    showLoading();

    try {
        return await callApi({ action: "delete", id });
    }
    catch (err) {
        console.error(err);
        return { success: false };
    }
    finally {
        hideLoading();
    }
}


/* ==========================================================
   6. CACHE
   The sheet is read once and kept in localStorage.
   The refresh button (or a save / delete) rebuilds it.
========================================================== */

const EXPENSE_CACHE_KEY = "expenseCache";

async function getExpenseCache() {

    try {
        const cache = JSON.parse(localStorage.getItem(EXPENSE_CACHE_KEY));

        if (cache && cache.version === 1) return cache;
    }
    catch (err) {
        console.warn("Expense cache could not be read, rebuilding.", err);
    }

    return await buildExpenseCache();
}

async function buildExpenseCache() {

    const [transactions, adjustments, monthlyClosing] = await Promise.all([
        getAllTransactions(),
        getAdjustments(),
        getMonthlyClosing()
    ]);

    const cache = {
        version: 1,
        createdOn: new Date().toISOString(),
        transactions,
        adjustments,
        monthlyClosing
    };

    localStorage.setItem(EXPENSE_CACHE_KEY, JSON.stringify(cache));

    return cache;
}

/** Loads the cached sheet data into allTransactions / allAdjustments / allClosing */
async function loadCachedData() {

    const cache = await getExpenseCache();

    // row 0 of every sheet is the heading row
    allTransactions = cache.transactions.slice(1);
    allAdjustments = cache.adjustments.slice(1);
    allClosing = cache.monthlyClosing.slice(1);
}

async function refreshExpenseCache(showMessageBox = true) {

    try {

        showLoading();

        localStorage.removeItem(EXPENSE_CACHE_KEY);

        const cache = await buildExpenseCache();

        if (showMessageBox) {
            showMessage("✅ Latest data loaded successfully.", "green");
        }

        return cache;
    }
    catch (err) {

        console.error(err);

        if (showMessageBox) {
            showMessage("❌ Unable to refresh latest data.", "red");
        }

        throw err;
    }
    finally {
        hideLoading();
    }
}

/**
 * Header refresh button.
 * A page can define  window.reloadPage = async () => {...}
 * to redraw itself with the new data.
 */
async function refreshCurrentPageData() {

    try {

        await refreshExpenseCache(false);

        if (typeof window.reloadPage === "function") {
            await window.reloadPage();
        }

        showMessage("Latest data refreshed successfully.", "green");
    }
    catch (err) {

        showMessage("❌ Unable to refresh latest data.", "red");
    }
}
