let allTransactions = [];
let allAdjustments = [];
let allClosing = [];


const CHART_COLORS = [
    "#4F46E5",
    "#0EA5E9",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#84CC16",
    "#F97316",
    "#6366F1",
    "#06B6D4"
];

function showMessage(msg, color) {

    const box =
        document.getElementById("msgBox");

    box.style.color =
        color;

    box.innerHTML =
        msg;
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showMessage(msg, color) {

    const box =
        document.getElementById("msgBox");

    box.style.color =
        color;

    box.innerHTML =
        msg;
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

        // New additions
        "School": "fa-school",
        "Investment": "fa-chart-line",
        "Utility": "fa-wrench"
    };

    return icons[category] || "fa-folder";
}

function getExpenseMonth(dateObj) {

    let month =
        dateObj.getMonth();

    let year =
        dateObj.getFullYear();

    if (dateObj.getDate() <= 6) {

        month--;

        if (month < 0) {

            month = 11;
            year--;
        }
    }

    const monthNames = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    return (
        monthNames[month] +
        "-" +
        year
    );
}

function sortExpenseMonths(months) {

    const monthMap = {

        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11
    };

    return [...months].sort(
        (a, b) => {

            const [m1, y1] =
                a.split("-");

            const [m2, y2] =
                b.split("-");

            const d1 =
                new Date(
                    Number(y1),
                    monthMap[m1],
                    1
                );

            const d2 =
                new Date(
                    Number(y2),
                    monthMap[m2],
                    1
                );

            return d1 - d2;
        }
    );
}

function populateMonths(
    transactions,
    adjustments,
    selectedValue = null
) {

    const cmb =
        document.getElementById(
            "cmbMonth"
        );

    if (!cmb)
        return;

    const months =
        new Set();

    transactions.forEach(row => {

        months.add(
            getExpenseMonth(
                new Date(row[1])
            )
        );

    });

    adjustments.forEach(row => {

        months.add(
            getExpenseMonth(
                new Date(row[1])
            )
        );

    });

    const sortedMonths =
        sortExpenseMonths(
            Array.from(months)
        );

    cmb.innerHTML = "";

    sortedMonths.forEach(month => {

        cmb.innerHTML +=
            `<option value="${month}">
                ${month}
            </option>`;
    });

    if (selectedValue) {

        cmb.value =
            selectedValue;

    } else {

        cmb.value =
            sortedMonths[
            sortedMonths.length - 1
            ];
    }
}

function populateFilters() {

    const cmbCategory =
        document.getElementById(
            "cmbCategory"
        );

    const cmbMode =
        document.getElementById(
            "cmbMode"
        );

    cmbCategory.innerHTML =
        '<option value="">All Categories</option>';

    cmbMode.innerHTML =
        '<option value="">All Modes</option>';

    const categories =
        new Set();

    const modes =
        new Set();

    allTransactions.forEach(row => {

        categories.add(
            row[4]
        );

        modes.add(
            row[5]
        );

    });

    [...categories]
        .sort()
        .forEach(category => {

            cmbCategory.innerHTML +=
                `<option value="${category}">
                    ${category}
                </option>`;
        });

    [...modes]
        .sort()
        .forEach(mode => {

            cmbMode.innerHTML +=
                `<option value="${mode}">
                    ${mode}
                </option>`;
        });

    cmbMode.value = "";
}

function applyFilters() {

    const search =
        document
            .getElementById(
                "txtSearch"
            )
            .value
            .toLowerCase()
            .trim();

    const month =
        document
            .getElementById(
                "cmbMonth"
            )
            .value;

    const category =
        document
            .getElementById(
                "cmbCategory"
            )
            .value;

    const mode =
        document
            .getElementById(
                "cmbMode"
            )
            .value;

    filteredTransactions =
        allTransactions.filter(row => {

            const date =
                new Date(row[1]);

            const rowMonth = getExpenseMonth(date);

            const matchesSearch =

                search === "" ||

                row[3]
                    .toLowerCase()
                    .includes(search) ||

                row[4]
                    .toLowerCase()
                    .includes(search);

            const matchesMonth =

                month === "" ||
                rowMonth === month;

            const matchesCategory =

                category === "" ||
                row[4] === category;

            const matchesMode =

                mode === "" ||
                row[5] === mode;

            return (

                matchesSearch &&
                matchesMonth &&
                matchesCategory &&
                matchesMode
            );
        });

    calculateSummary();

    renderEntries();
}

function calculateSummary() {

    let totalExpense = 0;
    let cashExpense = 0;
    let onlineExpense = 0;
    let cardExpense = 0;

    filteredTransactions.forEach(row => {

        const amount = Number(row[2]) || 0;
        const mode = row[5];

        totalExpense += amount;

        if (PAYMENT_MODE_GROUPS.CASH.includes(mode))
            cashExpense += amount;

        if (PAYMENT_MODE_GROUPS.ONLINE.includes(mode))
            onlineExpense += amount;

        if (PAYMENT_MODE_GROUPS.CARD.includes(mode))
            cardExpense += amount;

    });

    document.getElementById("lblTotalExpense").textContent =
        "₹" + totalExpense.toLocaleString("en-IN");

    document.getElementById("lblCashExpense").textContent =
        "₹" + cashExpense.toLocaleString("en-IN");

    document.getElementById("lblOnlineExpense").textContent =
        "₹" + onlineExpense.toLocaleString("en-IN");

    document.getElementById("lblCCPayment").textContent =
        "₹" + cardExpense.toLocaleString("en-IN");

}

function calculateBalances(
    selectedMonth
) {

    const balances = {};

    // Base Opening

    //console.log("ALL CLOSING");
    //console.table(allClosing);

    //console.log("ALL ADJUSTMENTS");
    //console.table(allAdjustments);

    allClosing.forEach(row => {

        const account = row[1];

        balances[account] =
            Number(row[2]) || 0;
    });

    const cashRow =
        allClosing.find(
            r => r[1] === "CASH"
        );

    balances["CASH"] =
        cashRow
            ? Number(cashRow[2]) || 0
            : 0;

    // Get all months

    const allMonths =
        [...new Set(

            [
                ...allTransactions.map(
                    r =>
                        getExpenseMonth(
                            new Date(r[1])
                        )
                ),

                ...allAdjustments.map(
                    r =>
                        getExpenseMonth(
                            new Date(r[1])
                        )
                )
            ]

        )];

    const orderedMonths =
        sortExpenseMonths(
            allMonths
        );

    // Process month by month

    for (
        let m = 0;
        m < orderedMonths.length;
        m++
    ) {

        const month =
            orderedMonths[m];

        processMonth(
            month,
            balances
        );

        if (
            month === selectedMonth
        ) {
            break;
        }
    }

    return balances;

    //renderBalances(
    //    balances
    //)
}

function processMonth(
    month,
    balances
) {

    //console.log("NEW PROCESSMONTH RUNNING");
    const accounts = [

        "CASH",
        "CRHD",
        "CRAX",
        "TRHD",
        "TRPN",
        "TRCASH",
        "KRHD",
        "CC"

    ];

    // =====================
    // EXPENSES
    // =====================

    // =====================
    // EXPENSES
    // =====================

    allTransactions.forEach(row => {

        const trxMonth =
            getExpenseMonth(
                new Date(row[1])
            );

        if (trxMonth !== month)
            return;

        const amount =
            Number(row[2]) || 0;

        const mode =
            String(
                row[5] || ""
            ).trim();

        // CASH special logic

        if (mode === "CashIn") {

            balances["CASH"] += amount;

            return;
        }

        if (mode === "CashOut") {

            balances["CASH"] -= amount;

            return;
        }

        // Normal account expense

        if (
            balances.hasOwnProperty(
                mode
            )
        ) {

            balances[mode] -= amount;

        }

    });

    // =====================
    // ADJUSTMENTS
    // =====================

    allAdjustments.forEach(row => {

        const adjMonth =
            getExpenseMonth(
                new Date(row[1])
            );

        if (
            adjMonth !== month
        ) return;

        const amount =
            Number(row[2]) || 0;

        const fromMode =
            String(
                row[3] || ""
            ).trim();

        const toMode =
            String(
                row[4] || ""
            ).trim();

        const fromIsAccount =
            accounts.includes(
                fromMode
            );

        const toIsAccount =
            accounts.includes(
                toMode
            );

        // -------------------
        // Internal Transfer
        // -------------------

        if (
            fromMode === "TRCASH" &&
            toMode === "CASH"
        ) {

            // CASH receives money

            balances["CASH"] += amount;

        }
        else if (
            fromIsAccount &&
            toIsAccount
        ) {

            balances[fromMode] -= amount;

            balances[toMode] += amount;

        }

        // -------------------
        // Outward Investment
        // Example:
        // CRHD -> GROWW
        // -------------------

        else if (
            fromIsAccount &&
            !toIsAccount
        ) {

            balances[fromMode] -= amount;

        }

        // -------------------
        // Income / Cashback /
        // Dividend / Refund
        // Example:
        // Salary -> CRHD
        // Bank -> CRHD
        // HP -> CRHD
        // Zerodha -> TRHD
        // -------------------

        else if (
            !fromIsAccount &&
            toIsAccount
        ) {

            balances[toMode] += amount;

        }

    });

}

function getOpeningBalance(
    account,
    selectedMonth
) {

    // First month opening comes
    // from MonthlyBalances

    const firstRow =
        allClosing.find(
            r => r[1] === account
        );

    if (!firstRow)
        return 0;

    let opening =
        Number(firstRow[2]) || 0;

    const allMonths =
        sortExpenseMonths(

            [...new Set([

                ...allTransactions.map(
                    r =>
                        getExpenseMonth(
                            new Date(r[1])
                        )
                ),

                ...allAdjustments.map(
                    r =>
                        getExpenseMonth(
                            new Date(r[1])
                        )
                )

            ])]

        );

    for (
        let i = 0;
        i < allMonths.length;
        i++
    ) {

        const month =
            allMonths[i];

        if (
            month === selectedMonth
        ) {
            break;
        }

        opening =
            calculateAccountClosing(
                account,
                opening,
                month
            );
    }

    return opening;
}

function calculateAccountClosing(
    account,
    opening,
    month
) {

    let balance = opening;

    // Transactions

    allTransactions.forEach(r => {

        const trxMonth =
            getExpenseMonth(
                new Date(r[1])
            );

        if (
            trxMonth !== month
        ) return;

        const amount =
            Number(r[2]) || 0;

        const mode =
            String(
                r[5] || ""
            ).trim();

        // CASH special logic

        if (account === "CASH") {

            if (mode === "CashIn") {

                balance += amount;

            }
            else if (mode === "CashOut") {

                balance -= amount;

            }

            return;
        }

        // Normal account logic

        if (
            mode === account
        ) {

            balance -= amount;

        }

    });

    // Adjustments

    allAdjustments.forEach(r => {

        const adjMonth =
            getExpenseMonth(
                new Date(r[1])
            );

        if (
            adjMonth !== month
        ) return;

        const amount =
            Number(r[2]) || 0;

        const fromMode =
            String(
                r[3] || ""
            ).trim();

        const toMode =
            String(
                r[4] || ""
            ).trim();

        // Special Rule
        // TRCASH -> CASH
        // increases CASH only
        // does NOT reduce TRCASH

        if (
            fromMode === "TRCASH" &&
            toMode === "CASH"
        ) {

            if (account === "CASH") {

                balance += amount;

            }

        }
        else {

            if (
                fromMode === account
            ) {

                balance -= amount;

            }

            if (
                toMode === account
            ) {

                balance += amount;

            }

        }

    });

    return balance;
}

function formatAmount(value) {

    return "₹" +
        Number(value)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            );
}

/* ==========================================
   Expense Cache Functions
========================================== */

const EXPENSE_CACHE_KEY = "expenseCache";

/**
 * Returns cached data if available,
 * otherwise builds a new cache.
 */
async function getExpenseCache() {

    const cache =
        JSON.parse(localStorage.getItem(EXPENSE_CACHE_KEY));

    if (cache && cache.version === 1) {

        //console.log("📦 Expense Cache : Loaded");

        return cache;

    }

    console.log("📦 Expense Cache : Invalid or Missing");

    return await buildExpenseCache();

}


/**
 * Builds cache.
 * (Currently only a placeholder.)
 */
async function buildExpenseCache() {

    //console.log("🔄 Building Expense Cache...");

    const transactions =
        await getAllTransactions();

    const adjustments =
        await getAdjustments();

    const monthlyClosing =
        await getMonthlyClosing();

    const cache = {

        version: 1,

        createdOn: new Date().toISOString(),

        transactions,

        adjustments,

        monthlyClosing

    };

    localStorage.setItem(
        EXPENSE_CACHE_KEY,
        JSON.stringify(cache)
    );

    //console.log("✅ Expense Cache Built");

    return cache;

}


/**
 * Clears cache.
 */
function invalidateExpenseCache() {

    console.log("🗑 Expense Cache Cleared");

    localStorage.removeItem(EXPENSE_CACHE_KEY);

}


/**
 * Rebuilds cache.
 */

async function refreshCurrentPageData() {

    const selectedMonth =
        document.getElementById("cmbMonth")?.value;

    await refreshExpenseCache(false);

    if (typeof loadDashboardData === "function") {

        await loadDashboardData();

        populateMonths(
            allTransactions,
            allAdjustments,
            selectedMonth
        );

        loadDashboard();

    }

    if (typeof loadData === "function") {

        await loadData();

    }

    showMessage(
        "Latest data refreshed successfully.",
        "green"
    );

}

async function refreshExpenseCache(showMessageBox = true) {

    try {

        showLoading();

        //console.log("🔄 Refreshing Expense Cache...");

        invalidateExpenseCache();

        const cache =
            await buildExpenseCache();

        //console.log("✅ Expense Cache Refreshed");

        if (showMessageBox) {

            showMessage(
                "✅ Latest data loaded successfully.",
                "green"
            );

        }

        return cache;

    }
    catch (err) {

        console.error(err);

        if (showMessageBox) {

            showMessage(
                "❌ Unable to refresh latest data.",
                "red"
            );

        }

        throw err;

    }
    finally {

        hideLoading();

    }

}

/* ==========================================
   Cached Data Access Functions
========================================== */

async function getTransactionsData() {

    const cache =
        await getExpenseCache();

    console.log(cache);
    console.log(cache.transactions.length);
    console.log(cache.adjustments.length);
    console.log(cache.monthlyClosing.length);

    return cache.transactions;

}

async function getAdjustmentsData() {

    const cache =
        await getExpenseCache();

    return cache.adjustments;

}

async function getMonthlyClosingData() {

    const cache =
        await getExpenseCache();

    return cache.monthlyClosing;

}

async function ensureExpenseCache() {

    return await getExpenseCache();

}

async function loadCachedData() {

    console.log("📦 Loading Cached Data...");

    const cache =
        await getExpenseCache();

    allTransactions =
        cache.transactions.slice(1);

    allAdjustments =
        cache.adjustments.slice(1);

    allClosing =
        cache.monthlyClosing.slice(1);

}

async function saveTransaction(data) {

    const qs = new URLSearchParams({

        action: "save",

        id: data.id,
        date: data.date,
        amount: data.amount,
        description: data.description,
        category: data.category,
        mode: data.mode,
        paymentMedium: data.paymentMedium,
        remarks: data.remarks,
        createdOn: data.createdOn,
        updatedOn: data.updatedOn

    });

    const response = await fetch(
        CONFIG.apiUrl + "?" + qs.toString()
    );

    return await response.json();
}

async function getAllTransactions() {

    const response = await fetch(
        CONFIG.apiUrl +
        "?action=getall"
    );

    const result =
        await response.json();

    if (!result.success)
        throw result.message;

    return result.data;
}

async function deleteTransaction(id) {
    showLoading();
    try {
        const response = await fetch(
            CONFIG.apiUrl +
            "?action=delete&id=" +
            encodeURIComponent(id)
        );

        const result = await response.json();
        hideLoading();
        return result;
    }
    catch (err) {
        hideLoading();

        console.error(err);
        return {
            success: false
        };
    }
}

async function getTransactionById(id) {

    const response =
        await fetch(

            CONFIG.apiUrl +

            "?action=getbyid&id=" +

            encodeURIComponent(id)

        );

    return await response.json();
}

async function getMonthlyClosing() {

    const response =
        await fetch(
            CONFIG.apiUrl +
            "?action=getmonthlyclosing"
        );

    const result =
        await response.json();

    if (!result.success)
        throw result.message;

    return result.data;
}

async function getAdjustments() {

    const response =
        await fetch(
            CONFIG.apiUrl +
            "?action=getadjustments"
        );

    const result =
        await response.json();

    if (!result.success)
        throw result.message;

    return result.data;
}

async function updateTransaction(data) {

    const qs = new URLSearchParams({

        action: "update",

        id: data.id,
        date: data.date,
        amount: data.amount,
        description: data.description,
        category: data.category,
        mode: data.mode,
        paymentMedium: data.paymentMedium,
        remarks: data.remarks,
        updatedOn: data.updatedOn

    });

    const response =
        await fetch(
            CONFIG.apiUrl + "?" + qs.toString()
        );

    return await response.json();
}

/----------------------------------------------------------Payment Mode Groups----------------------------------------------------------/

const PAYMENT_MODE_GROUPS = {

    CASH: [
        "CashOut",
        "TRCASH"
    ],

    ONLINE: [
        "CRHD",
        "CRAX",
        "TRHD",
        "TRPN",
        "CC",
        "CC-KiWi"
    ],

    CARD: [
        "CC",
        "CC-KiWi"
    ]

};