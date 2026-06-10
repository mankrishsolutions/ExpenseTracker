let allTransactions = [];
let allAdjustments = [];
let allClosing = [];

document.addEventListener(
    "DOMContentLoaded",
    init
);

async function init() {

    try {

        await loadDashboardData();

        populateMonths();

        loadDashboard();

    }
    catch (err) {

        console.error(err);

        alert(
            "Unable to load dashboard"
        );
    }
}

async function loadDashboardData() {

    allTransactions =
        (await getAllTransactions())
            .slice(1);

    allAdjustments =
        (await getAdjustments())
            .slice(1);

    allClosing =
        (await getMonthlyClosing())
            .slice(1);
}

function populateMonths() {

    const cmb =
        document.getElementById(
            "cmbMonth"
        );

    const months =
        new Set();

    allTransactions.forEach(row => {

        months.add(
            getExpenseMonth(
                new Date(row[1])
            )
        );
    });

    allAdjustments.forEach(row => {

        months.add(
            getExpenseMonth(
                new Date(row[1])
            )
        );
    });

    const sortedMonths =
        Array.from(months)
            .sort((a, b) => {

                return new Date(
                    "01-" + a
                ) -
                    new Date(
                        "01-" + b
                    );
            });

    cmb.innerHTML = "";

    sortedMonths.forEach(month => {

        cmb.innerHTML +=
            `<option value="${month}">
                ${month}
            </option>`;
    });

    cmb.value =
        sortedMonths[
        sortedMonths.length - 1
        ];

    cmb.addEventListener(
        "change",
        loadDashboard
    );
}

function loadDashboard() {

    const month =
        document.getElementById(
            "cmbMonth"
        ).value;

    calculateBalances(
        month
    );
}

function renderBalances(
    balances
) {

    console.log("========== BALANCES ==========");

    console.table(balances);

    document.getElementById("lblCash").textContent =
        formatAmount(   
            balances.CASH || 0
        );

    document.getElementById("lblCRHD").textContent =
        formatAmount(
            balances.CRHD || 0
        );

    document.getElementById("lblCRAX").textContent =
        formatAmount(
            balances.CRAX || 0
        );

    document.getElementById("lblTRHD").textContent =
        formatAmount(
            balances.TRHD || 0
        );

    document.getElementById("lblTRPN").textContent =
        formatAmount(
            balances.TRPN || 0
        );

    document.getElementById("lblTRCASH").textContent =
        formatAmount(
            balances.TRCASH || 0
        );

    document.getElementById("lblKRHD").textContent =
        formatAmount(
            balances.KRHD || 0
        );

    let total = 0;

    [
        "CASH",
        "CRHD",
        "CRAX",
        "TRHD",
        "TRPN",
        "TRCASH",
        "KRHD"
    ].forEach(acc => {

        total +=
            Number(
                balances[acc]
            ) || 0;
    });

    document.getElementById(
        "lblTotalBalance"
    ).textContent =
        formatAmount(total);
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
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    return monthNames[month] +
        "-" +
        year;
}

function calculateBalances(
    selectedMonth
) {

    const balances = {};

    // Base Opening

    console.log("ALL CLOSING");
    console.table(allClosing);

    console.log("ALL ADJUSTMENTS");
    console.table(allAdjustments);

    allClosing.forEach(row => {

        const account = row[1];

        balances[account] =
            Number(row[2]) || 0;
    });

    balances["CASH"] = 0;

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
        allMonths.sort(
            (a, b) =>
                new Date("01-" + a) -
                new Date("01-" + b)
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

    renderBalances(
        balances
    );
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

function processMonth(
    month,
    balances
) {

    console.log("NEW PROCESSMONTH RUNNING");
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
            fromIsAccount &&
            toIsAccount
        ) {

            balances[fromMode] -= amount;

            // CASH is calculated separately
            if (toMode !== "CASH") {

                balances[toMode] += amount;

            }

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

            if (toMode !== "CASH") {

                balances[toMode] += amount;

            }

        }

    });

}