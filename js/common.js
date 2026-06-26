let allTransactions = [];
let allAdjustments = [];
let allClosing = [];

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