
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

    const monthLabel =
        document.getElementById("lblSpentMonth");

    if (monthLabel && month) {
        monthLabel.textContent = month;
    }

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

    // CHANGE vs OPENING (display only - uses the values calculated above)

    const selectedMonth =
        document.getElementById("cmbMonth").value;

    let openingTotal = 0;

    [
        "CASH",
        "CRHD",
        "CRAX",
        "TRHD",
        "TRPN",
        "TRCASH",
        "KRHD"
    ].forEach(acc => {

        const opening =
            Number(
                getOpeningBalance(acc, selectedMonth)
            ) || 0;

        openingTotal += opening;

        setTileBar(
            acc,
            Number(balances[acc]) || 0,
            opening
        );

        showChange(
            "dlt" + acc,
            (Number(balances[acc]) || 0) - opening,
            false
        );

    });

    showChange(
        "chipVsOpening",
        total - openingTotal,
        true
    );

    renderComposition(balances, total);

}

/** Progress bar on an account tile: balance as a share of its opening balance */
function setTileBar(acc, balance, opening) {

    const bar = document.getElementById("tb" + acc);

    if (!bar) return;

    let pct = 0;

    if (opening > 0) {
        pct = Math.min(Math.max(balance, 0) / opening, 1) * 100;
    }
    else if (balance > 0) {
        pct = 100;
    }

    bar.style.width = pct + "%";
}

/** Stacked bar + legend showing how the total balance is spread over accounts */
function renderComposition(balances, total) {

    const comp = document.getElementById("balComp");
    const legend = document.getElementById("balLegend");

    if (!comp || !legend) return;

    const accounts = [
        "CRAX", "TRHD", "TRPN", "TRCASH", "KRHD", "CRHD", "CASH"
    ];

    comp.innerHTML = "";
    legend.innerHTML = "";

    const positive = accounts
        .map(acc => ({ acc, value: Number(balances[acc]) || 0 }))
        .filter(x => x.value > 0);

    const sum = positive.reduce((t, x) => t + x.value, 0);

    positive
        .sort((a, b) => b.value - a.value)
        .forEach(x => {

            const pct = sum > 0 ? (x.value / sum) * 100 : 0;

            const seg = document.createElement("i");
            seg.style.width = pct + "%";
            seg.style.background = "var(--a-" + x.acc + ")";
            seg.title = x.acc + " " + formatAmount(x.value);
            comp.appendChild(seg);

            const item = document.createElement("span");
            item.innerHTML =
                '<i class="hp-dot" style="background:var(--a-' + x.acc + ')"></i>' +
                x.acc + " " + Math.round(pct) + "%";
            legend.appendChild(item);
        });
}

/**
 * Shows "+₹1,000" / "−₹500" / "no change" next to an account,
 * or "₹x below opening" in the total chip.
 */
function showChange(id, diff, isTotal) {

    const el = document.getElementById(id);

    if (!el) return;

    el.classList.remove("is-pos", "is-neg", "is-zero");

    if (Math.abs(diff) < 0.005) {

        el.textContent =
            isTotal ? "Same as opening" : "no change";

        el.classList.add("is-zero");

        return;
    }

    const amount =
        formatAmount(Math.abs(diff));

    if (isTotal) {

        el.textContent =
            amount +
            (diff < 0 ? " below" : " above") +
            " opening";
    }
    else {

        el.textContent =
            (diff < 0 ? "\u2212" : "+") + amount;
    }

    el.classList.add(
        diff < 0 ? "is-neg" : "is-pos"
    );
}

