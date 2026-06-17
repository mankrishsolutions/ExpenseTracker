let allTransactions = [];
let allAdjustments = [];
let allClosing = [];

document.addEventListener(
    "DOMContentLoaded",
    init
);

async function init() {
    showLoading()
    try {
        await loadDashboardData();

        populateMonths(
            allTransactions,
            allAdjustments
        );

        loadDashboard();

        document
            .getElementById("cmbMonth")
            .addEventListener(
                "change",
                loadDashboard
            );
    }
    catch (err) {
        console.error(err);
        alert(
            "Unable to load dashboard"
        );
    }
    hideLoading()
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

    //console.log(
    //    "========== BALANCES =========="
    //);

    //console.table(
    //    balances
    //);

    // OPENING BALANCES

    document.getElementById(
        "lblCashOpening"
    ).textContent =
        "OB " +
    formatAmount(
            getOpeningBalance(
                "CASH",
                document.getElementById(
                    "cmbMonth"
                ).value
            )
        );

    document.getElementById(
        "lblCRHDOpening"
    ).textContent =
        "OB " +
        formatAmount(
            getOpeningBalance(
                "CRHD",
                document.getElementById(
                    "cmbMonth"
                ).value
            )
        );

    document.getElementById(
        "lblCRAXOpening"
    ).textContent =
        "OB " +
        formatAmount(
            getOpeningBalance(
                "CRAX",
                document.getElementById(
                    "cmbMonth"
                ).value
            )
        );

    document.getElementById(
        "lblTRHDOpening"
    ).textContent =
        "OB " +
        formatAmount(
            getOpeningBalance(
                "TRHD",
                document.getElementById(
                    "cmbMonth"
                ).value
            )
        );

    document.getElementById(
        "lblTRPNOpening"
    ).textContent =
        "OB " +
        formatAmount(
            getOpeningBalance(
                "TRPN",
                document.getElementById(
                    "cmbMonth"
                ).value
            )
        );

    document.getElementById(
        "lblTRCASHOpening"
    ).textContent =
        "OB " +
        formatAmount(
            getOpeningBalance(
                "TRCASH",
                document.getElementById(
                    "cmbMonth"
                ).value
            )
        );

    document.getElementById(
        "lblKRHDOpening"
    ).textContent =
        "OB " +
        formatAmount(
            getOpeningBalance(
                "KRHD",
                document.getElementById(
                    "cmbMonth"
                ).value
            )
        );

    // CLOSING BALANCES

    document.getElementById(
        "lblCash"
    ).textContent =
        formatAmount(
            balances.CASH || 0
        );

    document.getElementById(
        "lblCRHD"
    ).textContent =
        formatAmount(
            balances.CRHD || 0
        );

    document.getElementById(
        "lblCRAX"
    ).textContent =
        formatAmount(
            balances.CRAX || 0
        );

    document.getElementById(
        "lblTRHD"
    ).textContent =
        formatAmount(
            balances.TRHD || 0
        );

    document.getElementById(
        "lblTRPN"
    ).textContent =
        formatAmount(
            balances.TRPN || 0
        );

    document.getElementById(
        "lblTRCASH"
    ).textContent =
        formatAmount(
            balances.TRCASH || 0
        );

    document.getElementById(
        "lblKRHD"
    ).textContent =
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
        formatAmount(
            total
        );

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

    renderBalances(
        balances
    )
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

//function calculateCRHD(selectedMonth) {

//    let opening = 0;

//    // Opening Balance

//    const openingRow =
//        allClosing.find(r =>
//            r[1] === "CRHD"
//        );

//    if (openingRow) {

//        opening =
//            Number(
//                openingRow[2]
//            ) || 0;
//    }

//    let balance = opening;

//    // Adjustments

//    allAdjustments.forEach(r => {

//        const month =
//            getExpenseMonth(
//                new Date(r[1])
//            );

//        if (
//            month !== selectedMonth
//        ) return;

//        const amount =
//            Number(r[2]) || 0;

//        const fromMode =
//            String(
//                r[3] || ""
//            ).trim();

//        const toMode =
//            String(
//                r[4] || ""
//            ).trim();

//        if (
//            toMode === "CRHD"
//        ) {

//            balance += amount;
//        }

//        if (
//            fromMode === "CRHD"
//        ) {

//            balance -= amount;
//        }

//    });

//    // Expenses

//    allTransactions.forEach(r => {

//        const month =
//            getExpenseMonth(
//                new Date(r[1])
//            );

//        if (
//            month !== selectedMonth
//        ) return;

//        const amount =
//            Number(r[2]) || 0;

//        const mode =
//            String(
//                r[5] || ""
//            ).trim();

//        if (
//            mode === "CRHD"
//        ) {

//            balance -= amount;
//        }

//    });

//    return balance;
//}

//function calculateCash(selectedMonth) {
//     //Opening from MonthlyBalances

//     //+ all adjustments where ToMode="CASH"

//     //- all Transactions where Mode="CashOut"

//    return balance;
//}

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



