//let allTransactions = [];
let filteredTransactions = [];
//let allAdjustments = [];
//let allClosing = [];


document.addEventListener(
    "DOMContentLoaded",
    init
);

async function init() {
    showLoading();
	await loadData();

	wireEvents();

	const msg =
		sessionStorage.getItem(
			"appMessage"
		);

	if(msg){

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

        allTransactions =
            (await getAllTransactions()).slice(1);

        allAdjustments =
            (await getAdjustments()).slice(1);

        allClosing =
            (await getMonthlyClosing()).slice(1);

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

    document
        .getElementById("btnBalances")
        .addEventListener("click", () => {

            const month =
                document.getElementById("cmbMonth").value;

            const balances =
                calculateBalances(month);

            renderBalancesPopup(balances);

            document
                .getElementById("balancesModal")
                .classList.add("show");

        });

    document
        .getElementById("btnCloseBalancesModal")
        .addEventListener("click", () => {

            document
                .getElementById("balancesModal")
                .classList.remove("show");

        });

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
    let ccPayment = 0;

    filteredTransactions.forEach(row => {

        const amount =
            Number(row[2]) || 0;

        const category =
            row[4];

        const mode =
            row[5];

        if (
            mode === "CashOut" ||
            mode === "TRCASH"
        ) {
            cashExpense += amount;
        }

        if (
            mode === "CRHD" ||
            mode === "CRAX" ||
            mode === "TRHD" ||
            mode === "TRPN"
        ) {
            onlineExpense += amount;
        }

        if (
            category === "CC"
        ) {
            ccPayment += amount;
        }

        totalExpense += amount;
    });

    document.getElementById(
        "lblTotalExpense"
    ).textContent =
        "₹" +
        totalExpense.toLocaleString("en-IN");

    document.getElementById(
        "lblCashExpense"
    ).textContent =
        "₹" +
        cashExpense.toLocaleString("en-IN");

    document.getElementById(
        "lblOnlineExpense"
    ).textContent =
        "₹" +
        onlineExpense.toLocaleString("en-IN");

    document.getElementById(
        "lblCCPayment"
    ).textContent =
        "₹" +
        ccPayment.toLocaleString("en-IN");
}

function renderEntries() {

    const container =
        document.getElementById(
            "entriesContainer"
        );

    if (!container) {
        console.error(
            "entriesContainer not found"
        );
        return;
    }

    container.innerHTML = "";

    const grouped = {};

    filteredTransactions.forEach(row => {

        const category = row[4];

        if (!grouped[category]) {

            grouped[category] = [];
        }

        grouped[category].push(row);

    });

    Object.keys(grouped)
        .sort()
        .forEach(category => {

            const rows =
                grouped[category];

            const total =
                rows.reduce(
                    (sum, r) =>
                        sum + Number(r[2] || 0),
                    0
                );

            const card =
                document.createElement("div");

            card.className =
                "category-card";

            card.innerHTML = `

            <div class="category-header">

                <div class="category-left">

                    <div class="category-icon">

                        <i class="fa-solid ${getCategoryIcon(category)}"></i>

                    </div>

                    <div>

                        <div class="category-name">

                            ${category}

                        </div>

                        <div class="category-count">

                            ${rows.length} Entries

                        </div>

                    </div>

                </div>

                <div>

                    <div class="category-total">

                        ₹${total.toLocaleString("en-IN")}

                    </div>

                </div>

            </div>

            <div class="category-transactions">

            </div>

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

                const amount = Number(row[2]) || 0;

                html += `
                    <tr>
                    <td>${new Date(row[1]).toLocaleDateString("en-GB")}</td>
                    <td class="amount-cell">
                    ${amount.toLocaleString("en-IN")}
                    </td>
                    <td>${row[3]}</td>
                    <td>${row[4]}</td>
                    <td>${row[5]}</td>
                    <td>${row[6]}</td>
                    <td>
                    <button class="btnEdit" data-id="${row[0]}">
                    <i class="fa fa-pen"></i>
                    </button>

                    <button class="btnDelete" data-id="${row[0]}">
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
                .querySelector(
                    ".category-header"
                )
                .addEventListener(
                    "click",
                    () => {

                        card.classList.toggle(
                            "expanded"
                        );

                    }
                );

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
                    "add.html?id=" +
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