

document.addEventListener("headerLoaded", init);

async function init() {
    showLoading(); await loadData();

    wireEvents();

    const msg =
        sessionStorage.getItem(
            "appMessage"
        );

    if (msg) {

        showMessage(msg);

        sessionStorage.removeItem(
            "appMessage"
        );
    }
    hideLoading();

}

async function loadData() {

    try {
        showLoading();

        await loadCachedData();

        populateMonths(
            allTransactions,
            []
        );

        populateFilters();

        applyFilters();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        hideLoading();
    }


    catch (err) {

        console.error(err);

        alert("Unable to load transactions.");
    }

}

function wireEvents() {

    document
        .getElementById("txtSearch")
        .addEventListener(
            "input",
            applyFilters
        );

    document
        .getElementById("cmbMonth")
        .addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById("cmbCategory")
        .addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById("cmbMode")
        .addEventListener(
            "change",
            applyFilters
        );

    document
        .getElementById("btnViewAll")
        .addEventListener("click", () => {

            renderAllTransactionsModal();

            document
                .getElementById("allEntriesModal")
                .classList.add("show");

        });

    document
        .getElementById("btnCloseEntriesModal")
        .addEventListener("click", () => {

            document
                .getElementById("allEntriesModal")
                .classList.remove("show");
        });

}

function renderEntries() {

    const container =
        document.getElementById("entriesContainer");

    if (!container) {
        console.error("entriesContainer not found");
        return;
    }

    container.innerHTML = "";

    const grouped = {};

    // Grand Total
    const grandTotal =
        filteredTransactions.reduce(
            (sum, row) =>
                sum + Number(row[2] || 0),
            0
        );

    // Group by Category
    filteredTransactions.forEach(row => {

        const category = row[4];

        if (!grouped[category]) {
            grouped[category] = [];
        }

        grouped[category].push(row);

    });

    // Convert to Array & Sort by Highest Expense
    const categories =
        Object.entries(grouped)
            .map(([category, rows]) => {

                const total =
                    rows.reduce(
                        (sum, r) =>
                            sum + Number(r[2] || 0),
                        0
                    );

                return {
                    category,
                    rows,
                    total
                };

            })
            .sort((a, b) => b.total - a.total);

    // Render Cards
    categories.forEach(item => {

        const category = item.category;
        const rows = item.rows;
        const total = item.total;

        const percentage =
            grandTotal > 0
                ? ((total / grandTotal) * 100).toFixed(2)
                : "0.00";

        const average =
            rows.length > 0
                ? (total / rows.length).toFixed(0)
                : 0;

        const card =
            document.createElement("div");

        card.className = "category-card";

        card.innerHTML = `

    <div class="category-header">

        <div class="category-left">

            <div class="category-icon">
                <i class="fa-solid ${getCategoryIcon(category)}"></i>
            </div>

            <div class="category-info">

                <div class="category-name">
                    ${category}
                </div>

                <div class="category-progress-row">

                    <span class="txn-count">

                        ${rows.length} Txns

                    </span>

                    <div class="category-progress">

                        <div class="category-progress-fill"
                             style="width:${percentage}%;">
                        </div>

                    </div>

                    <span class="percent">

                        ${percentage}%

                    </span>

                </div>

            </div>

        </div>

        <div class="category-right">

            <div class="category-total">

                ₹${total.toLocaleString("en-IN")}

            </div>

        </div>

    </div>

    <div class="category-transactions"></div>

    `;

        const details =
            card.querySelector(".category-transactions");

        let html = `

    <table class="transactions-table">

        <thead>

            <tr>

                <th>Date</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Category</th>
                <th>Mode</th>
                <th>Pay</th>
                <th></th>

            </tr>

        </thead>

        <tbody>

    `;

        rows.forEach(row => {

            const amount =
                Number(row[2]) || 0;

            html += `

        <tr>

            <td>
                ${new Date(row[1]).toLocaleDateString("en-GB")}
            </td>

            <td class="amount-cell">
                ₹${amount.toLocaleString("en-IN")}
            </td>

            <td>${row[3]}</td>

            <td>${row[4]}</td>

            <td>${row[5]}</td>

            <td>${row[6]}</td>

            <td>

                <button class="btnEdit"
                        data-id="${row[0]}">

                    <i class="fa fa-pen"></i>

                </button>

                <button class="btnDelete"
                        data-id="${row[0]}">

                    <i class="fa fa-trash"></i>

                </button>

            </td>

        </tr>

        `;

        });

        html += `

        </tbody>

    </table>

    `;

        details.innerHTML = html;

        card
            .querySelector(".category-header")
            .addEventListener("click", () => {

                card.classList.toggle("expanded");

            });

        container.appendChild(card);

    });

    bindButtons();

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
        "Personal": "fa-user"
    };

    return icons[category] || "fa-folder";

}

function bindButtons() {

    document
        .querySelectorAll(".btnEdit")
        .forEach(btn => {

            btn.onclick = function () {

                location.href =
                    "pages/add.html?id=" +
                    this.dataset.id;
            };
        });

    document
        .querySelectorAll(".btnDelete")
        .forEach(btn => {

            btn.onclick =
                async function () {

                    if (
                        !confirm(
                            "Delete this transaction?"
                        )
                    ) return;

                    const result =
                        await deleteTransaction(
                            this.dataset.id
                        );

                    if (result.success) {

                        await refreshExpenseCache(false);

                        await loadData();

                    }
                };
        });

}

function renderAllTransactionsModal() {

    const container =
        document.getElementById(
            "allEntriesTableContainer"
        );

    let html = `

<table class="transactions-table">

    <thead>

        <tr>

            <th>Date</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Category</th>
            <th>Mode</th>
            <th>Pay</th>

        </tr>

    </thead>

    <tbody>

`;

    [...filteredTransactions]

        .sort((a, b) =>

            new Date(b[1]) - new Date(a[1])

        )

        .forEach(row => {

            html += `

        <tr>

            <td>${new Date(row[1]).toLocaleDateString("en-GB")}</td>

            <td class="amount-cell">

                ₹${Number(row[2]).toLocaleString("en-IN")}

            </td>

            <td>${row[3]}</td>

            <td>${row[4]}</td>

            <td>${row[5]}</td>

            <td>${row[6]}</td>

        </tr>

        `;

        });

    html += `

    </tbody>

</table>

`;

    container.innerHTML = html;

}

function renderBalancesPopup(balances) {

    const month =
        document.getElementById("cmbMonth").value;

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

        total += Number(balances[acc] || 0);

    });

    document.getElementById("balancesContainer").innerHTML = `

<div class="popup-balance-summary">

<div class="popup-total-card">

    <div>

        <span>Total Available Balance</span>

        <h2>${formatAmount(total)}</h2>

    </div>

    <div class="popup-wallet">

        <i class="fa-solid fa-wallet"></i>

    </div>

</div>


<div class="popup-main-balances">

    ${createBalanceCard("CRHD", "fa-building-columns", balances.CRHD, getOpeningBalance("CRHD", month), "online-color")}

    ${createBalanceCard("CASH", "fa-wallet", balances.CASH, getOpeningBalance("CASH", month), "cash-color")}

</div>


<div class="popup-other-balances">

    ${createBalanceCard("CRAX", "fa-building-columns", balances.CRAX, getOpeningBalance("CRAX", month), "")}

    ${createBalanceCard("TRHD", "fa-building-columns", balances.TRHD, getOpeningBalance("TRHD", month), "")}

    ${createBalanceCard("TRPN", "fa-building-columns", balances.TRPN, getOpeningBalance("TRPN", month), "")}

    ${createBalanceCard("TRCASH", "fa-money-bill-wave", balances.TRCASH, getOpeningBalance("TRCASH", month), "")}

    ${createBalanceCard("KRHD", "fa-piggy-bank", balances.KRHD, getOpeningBalance("KRHD", month), "")}

</div>

</div>
`;

}

function createBalanceCard(name, icon, balance, opening, colorClass) {

    return `

<div class="popup-balance-card">

<div class="popup-balance-icon ${colorClass}">

    <i class="fa-solid ${icon}"></i>

</div>

<div>

    <div class="popup-account-name">

        ${name}

    </div>

    <div class="popup-account-balance">

        ${formatAmount(balance)}

    </div>

    <div class="popup-opening">

        OB ${formatAmount(opening).replace("₹", "")}

    </div>

</div>

</div>

`;

}