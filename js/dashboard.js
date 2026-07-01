
document.addEventListener(
    "headerLoaded",
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

    await loadCachedData();
}

function loadDashboard() {

    const month =
        document.getElementById("cmbMonth").value;

    const balances =
        calculateBalances(month);

    renderBalances(balances);

}

function renderBalances(
    balances
) {

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

