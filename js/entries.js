let allTransactions = [];
let filteredTransactions = [];

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

        const data =
            await getAllTransactions();

        allTransactions =
            data.slice(1);

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
                    <th>Description</th>
                    <th>Mode</th>
                    <th>Pay</th>
                    <th>Amount</th>
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
                    <td>${row[3]}</td>
                    <td>${row[5]}</td>
                    <td>${row[6]}</td>
                    <td class="amount-cell">
                    ₹${amount.toLocaleString("en-IN")}
                    </td>
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