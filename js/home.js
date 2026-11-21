/* ==========================================================
   HOME PAGE  (index.html)
   ----------------------------------------------------------
   1. Start-up and events
   2. Filters
   3. Expense summary (total, cash / online / card)
   4. Account balances
   5. Categories, recent list, "All transactions" popup
========================================================== */

let filteredTransactions = [];

// Payment-type buttons: "" (all), "CASH", "ONLINE", "CARD"
let activeModeGroup = "";

const $ = id => document.getElementById(id);

document.addEventListener("headerLoaded", init);


/* ==========================================================
   1. START-UP AND EVENTS
========================================================== */

async function init() {

    showLoading();

    try {

        await loadCachedData();

        buildTiles();

        populateMonths(allTransactions, allAdjustments, null, true);
        populateFilters();

        wireEvents();

        render();

        const msg = sessionStorage.getItem("appMessage");

        if (msg) {
            showMessage(msg);
            sessionStorage.removeItem("appMessage");
        }
    }
    catch (err) {

        console.error(err);

        alert("Unable to load dashboard");
    }
    finally {

        hideLoading();
    }
}

/** Called by the refresh button (core.js) and after a delete */
window.reloadPage = async function () {

    const month = $("cmbMonth").value;

    await loadCachedData();

    populateMonths(allTransactions, allAdjustments, month, true);
    populateFilters();

    render();
};

/** Redraws everything for the chosen month */
function render() {

    applyFilters();
    renderBalances();
}

function wireEvents() {
	// Daily Reconciliation
	$("btnDailySummary").addEventListener(
		"click",
		openDailyReconciliation
	);

	$("btnCloseDailySummary").addEventListener(
		"click",
		closeDailyReconciliation
	);

	$("btnApplyDailyRange").addEventListener(
		"click",
		applyDailyReconciliationRange
	);

    $("cmbMonth").addEventListener("change", render);

    ["txtSearch"].forEach(id => $(id).addEventListener("input", applyFilters));
    ["cmbCategory", "cmbMode"].forEach(id => $(id).addEventListener("change", applyFilters));

    document.querySelectorAll("#modeSeg button").forEach(btn => {

        btn.addEventListener("click", () => {

            activeModeGroup = btn.dataset.group || "";

            document.querySelectorAll("#modeSeg button").forEach(b =>
                b.classList.toggle("on", b === btn)
            );

            applyFilters();
        });
    });

    $("btnViewAll").addEventListener("click", () => {

        renderAllTransactionsModal();

        $("allEntriesModal").classList.add("show");
    });

    $("btnCloseEntriesModal").addEventListener("click", () =>
        $("allEntriesModal").classList.remove("show")
    );

    // Edit / delete buttons inside the category cards
    $("entriesContainer").addEventListener("click", async event => {

        const edit = event.target.closest(".btnEdit");
        const del = event.target.closest(".btnDelete");

        if (edit) {

            location.href = "pages/add.html?id=" + encodeURIComponent(edit.dataset.id);
        }
        else if (del) {

            if (!confirm("Delete this transaction?")) return;

            const result = await deleteTransaction(del.dataset.id);

            if (result.success) {

                await refreshExpenseCache(false);

                await window.reloadPage();
            }
        }
    });
}


/* ==========================================================
   2. FILTERS
========================================================== */

function populateFilters() {

    const cmbCategory = $("cmbCategory");
    const cmbMode = $("cmbMode");

    const fill = (select, allLabel, values) => {

        const keep = select.value;

        select.innerHTML = "";
        select.add(new Option(allLabel, ""));

        [...new Set(values)].sort().forEach(v => select.add(new Option(v, v)));

        select.value = [...select.options].some(o => o.value === keep) ? keep : "";
    };

    fill(cmbCategory, "All Categories", allTransactions.map(r => r[4]));
    fill(cmbMode, "All Modes", allTransactions.map(r => r[5]));
}

function applyFilters() {

    const search = $("txtSearch").value.toLowerCase().trim();
    const month = $("cmbMonth").value;            // "" = All months
    const category = $("cmbCategory").value;
    const mode = $("cmbMode").value;
    const group = PAYMENT_MODE_GROUPS[activeModeGroup] || null;

    filteredTransactions = allTransactions.filter(row =>

        (search === "" ||
            row[3].toLowerCase().includes(search) ||
            row[4].toLowerCase().includes(search)) &&

        (month === ALL_MONTHS || rowMonth(row) === month) &&
        (category === "" || row[4] === category) &&
        (mode === "" || row[5] === mode) &&
        (group === null || group.includes(row[5]))
    );

    renderSummary();
    renderEntries();
    renderRecent();
}


/* ==========================================================
   3. EXPENSE SUMMARY
========================================================== */

function renderSummary() {

    const sumOf = modes =>
        filteredTransactions
            .filter(r => !modes || modes.includes(r[5]))
            .reduce((t, r) => t + (Number(r[2]) || 0), 0);

    const total = sumOf();
    const cash = sumOf(PAYMENT_MODE_GROUPS.CASH);
    const online = sumOf(PAYMENT_MODE_GROUPS.ONLINE);
    const card = sumOf(PAYMENT_MODE_GROUPS.CARD);

    const month = $("cmbMonth").value;

    $("lblSpentMonth").textContent = month === ALL_MONTHS ? "All months" : month;

    $("lblTotalExpense").textContent = formatMoney(total);
    $("lblCashExpense").textContent = formatMoney(cash);
    $("lblOnlineExpense").textContent = formatMoney(online);
    $("lblCCPayment").textContent = formatMoney(card);

    const share = amount => total > 0 ? (amount / total) * 100 : 0;

    // Ring chart (circumference of r = 50)
    const C = 2 * Math.PI * 50;
    const gap = cash > 0 && online > 0 ? 3 : 0;

    const ringCash = $("ringCash");
    const ringOnline = $("ringOnline");

    ringCash.style.strokeDasharray = Math.max(0, C * share(cash) / 100 - gap) + " " + C;
    ringCash.style.strokeDashoffset = 0;

    ringOnline.style.strokeDasharray = Math.max(0, C * share(online) / 100 - gap) + " " + C;
    ringOnline.style.strokeDashoffset = -(C * share(cash) / 100);

    $("ringPct").textContent = Math.round(share(online)) + "%";
    $("pctCash").textContent = Math.round(share(cash)) + "%";
    $("pctOnline").textContent = Math.round(share(online)) + "%";
    $("pctCard").textContent = Math.round(share(card)) + "%";
}


/* ==========================================================
   4. ACCOUNT BALANCES
========================================================== */

/** One tile per account in config.js */
function buildTiles() {

    $("accountTiles").innerHTML = ACCOUNTS.map(a => `
        <div class="tile" data-acc="${a.id}" title="${a.name}">
            <div class="tile-k"><span class="hp-dot"></span>${a.id}</div>
            <strong class="tile-v">₹0</strong>
            <small class="opening-balance">OB ₹0</small>
            <div class="tile-bar"><i></i></div>
            <span class="tile-delta"></span>
        </div>`).join("");
}

function renderBalances() {

    const month = $("cmbMonth").value;
    const balances = calculateBalances(month);

    let total = 0;
    let openingTotal = 0;

    BALANCE_ACCOUNTS.forEach(acc => {

        const tile = document.querySelector('.tile[data-acc="' + acc + '"]');

        const balance = Number(balances[acc]) || 0;
        const opening = Number(getOpeningBalance(acc, month)) || 0;

        total += balance;
        openingTotal += opening;

        tile.querySelector(".tile-v").textContent = formatAmount(balance);
        tile.querySelector(".opening-balance").textContent = "OB " + formatAmount(opening);

        setTileBar(tile.querySelector(".tile-bar i"), balance, opening);
        showChange(tile.querySelector(".tile-delta"), balance - opening, false);
    });

    $("lblTotalBalance").textContent = formatAmount(total);

    showChange($("chipVsOpening"), total - openingTotal, true);

    renderComposition(balances);
}

/** Progress bar on an account tile: balance as a share of its opening balance */
function setTileBar(bar, balance, opening) {

    let pct = 0;

    if (opening > 0) {
        pct = Math.min(Math.max(balance, 0) / opening, 1) * 100;
    }
    else if (balance > 0) {
        pct = 100;
    }

    bar.style.width = pct + "%";
}

/** Stacked bar + legend: how the total balance is spread over accounts */
function renderComposition(balances) {

    const comp = $("balComp");
    const legend = $("balLegend");

    comp.innerHTML = "";
    legend.innerHTML = "";

    const positive = BALANCE_ACCOUNTS
        .map(acc => ({ acc, value: Number(balances[acc]) || 0 }))
        .filter(x => x.value > 0)
        .sort((a, b) => b.value - a.value);

    const sum = positive.reduce((t, x) => t + x.value, 0);

    positive.forEach(x => {

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
 * "+₹1,000" / "−₹500" / "no change" on an account tile,
 * or "₹x below opening" in the total chip.
 */
function showChange(el, diff, isTotal) {

    el.classList.remove("is-pos", "is-neg", "is-zero");

    if (Math.abs(diff) < 0.005) {

        el.textContent = isTotal ? "Same as opening" : "no change";
        el.classList.add("is-zero");

        return;
    }

    const amount = formatAmount(Math.abs(diff));

    el.textContent = isTotal
        ? amount + (diff < 0 ? " below" : " above") + " opening"
        : (diff < 0 ? "−" : "+") + amount;

    el.classList.add(diff < 0 ? "is-neg" : "is-pos");
}


/* ==========================================================
   5. CATEGORIES, RECENT LIST, ALL TRANSACTIONS
========================================================== */

const TABLE_HEAD = (extra = "") => `
    <thead>
        <tr>
            <th>Date</th><th>Amount</th><th>Description</th>
            <th>Category</th><th>Mode</th><th>Pay</th>${extra}
        </tr>
    </thead>`;

/** One table row (with edit / delete buttons when withActions) */
function transactionRow(row, withActions) {

    const actions = withActions
        ? `<td>
               <button class="btnEdit" data-id="${esc(row[0])}"><i class="fa fa-pen"></i></button>
               <button class="btnDelete" data-id="${esc(row[0])}"><i class="fa fa-trash"></i></button>
           </td>`
        : "";

    return `
        <tr>
            <td>${new Date(row[1]).toLocaleDateString("en-GB")}</td>
            <td class="amount-cell">${formatMoney(row[2])}</td>
            <td>${esc(row[3])}</td>
            <td>${esc(row[4])}</td>
            <td>${esc(row[5])}</td>
            <td>${esc(row[6])}</td>
            ${actions}
        </tr>`;
}

const sumAmount = rows => rows.reduce((t, r) => t + (Number(r[2]) || 0), 0);

function renderEntries() {

    const container = $("entriesContainer");

    // Group by category, biggest spend first
    const groups = {};

    filteredTransactions.forEach(row => (groups[row[4]] = groups[row[4]] || []).push(row));

    const categories = Object.entries(groups)
        .map(([category, rows]) => ({ category, rows, total: sumAmount(rows) }))
        .sort((a, b) => b.total - a.total);

    const grandTotal = sumAmount(filteredTransactions);

    $("lblCatCount").textContent =
        categories.length + (categories.length === 1 ? " category" : " categories");

    if (categories.length === 0) {

        container.innerHTML =
            '<div class="empty-state">No transactions match these filters.</div>';

        return;
    }

    container.innerHTML = "";

    categories.forEach(({ category, rows, total }) => {

        const percentage = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(2) : "0.00";

        const card = document.createElement("div");
        card.className = "category-card";

        card.innerHTML = `
            <div class="category-header">

                <div class="category-icon">
                    <i class="fa-solid ${getCategoryIcon(category)}"></i>
                </div>

                <div class="category-info">
                    <div class="category-name">${esc(category)}</div>
                    <div class="category-count">
                        ${rows.length} ${rows.length === 1 ? "transaction" : "transactions"}
                    </div>
                </div>

                <div class="category-bar">
                    <div class="category-progress">
                        <div class="category-progress-fill" style="width:${percentage}%;"></div>
                    </div>
                    <span class="percent">${percentage}% of spend</span>
                </div>

                <div class="category-total">${formatMoney(total)}</div>

                <i class="fa-solid fa-chevron-down category-arrow"></i>

            </div>

            <div class="category-transactions">
                <table class="transactions-table">
                    ${TABLE_HEAD("<th></th>")}
                    <tbody>${rows.map(r => transactionRow(r, true)).join("")}</tbody>
                </table>
            </div>`;

        card.querySelector(".category-header").addEventListener("click", () =>
            card.classList.toggle("expanded")
        );

        container.appendChild(card);
    });
}

const byNewestFirst = (a, b) => new Date(b[1]) - new Date(a[1]);

/** "Recent" panel: the 5 latest transactions that match the filters */
function renderRecent() {

    const list = $("recentList");

    const latest = [...filteredTransactions].sort(byNewestFirst).slice(0, 5);

    if (latest.length === 0) {
        list.innerHTML = '<div class="recent-empty">No transactions yet.</div>';
        return;
    }

    list.innerHTML = latest.map(row => {

        const d = new Date(row[1]);
        const day = isNaN(d) ? "" : d.getDate();
        const mon = isNaN(d) ? "" : d.toLocaleDateString("en-GB", { month: "short" });

        return `
            <div class="recent-row">
                <div class="recent-date"><b>${day}</b><small>${mon}</small></div>
                <div class="recent-info">
                    <div class="recent-desc">${esc(row[3])}</div>
                    <div class="recent-meta">${esc(row[4])} · ${esc(row[5])}</div>
                </div>
                <div class="recent-amt">${formatMoney(row[2])}</div>
            </div>`;
    }).join("");
}

/** "All transactions" popup: every row that matches the filters, newest first */
function renderAllTransactionsModal() {

    $("allEntriesTableContainer").innerHTML = `
        <table class="transactions-table">
            ${TABLE_HEAD()}
            <tbody>
                ${[...filteredTransactions].sort(byNewestFirst)
                    .map(r => transactionRow(r, false)).join("")}
            </tbody>
        </table>`;
}



/* ==========================================================
   6. DATE RANGE RECONCILIATION
   Read-only. Does not modify core.js calculations.

   Reconciliation starts from 01-Oct-2026.
   Historical movements before selected From Date are used
   to calculate the opening balance.

   TRANSACTIONS:
   [0] ID
   [1] Date
   [2] Amount
   [3] Description
   [4] Category
   [5] Mode
   [6] PaymentMedium
   [7] Remarks
   [8] CreatedOn
   [9] UpdatedOn

   ADJUSTMENTS:
   [0] ID
   [1] Date
   [2] Amount
   [3] FromMode
   [4] ToMode
   [5] Type
   [6] Description
   [7] Remarks
   [8] CreatedOn
========================================================== */

const DAILY_RECON_START_DATE = "2026-10-01";


/* ---------- Date helpers ---------- */

function dailyDateKey(value) {

    if (!value) return "";

    const s = String(value).trim();

    // ISO timestamp converted to India date
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {

        const d = new Date(s);

        if (isNaN(d.getTime())) return "";

        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(d);

        const get = type =>
            parts.find(p => p.type === type)?.value || "";

        return `${get("year")}-${get("month")}-${get("day")}`;
    }

    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (m) return `${m[1]}-${m[2]}-${m[3]}`;

    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

    if (m) {
        return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
    }

    m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);

    if (m) {

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const month = months.findIndex(
            x => x.toLowerCase() === m[2].toLowerCase()
        );

        if (month >= 0) {
            return `${m[3]}-${String(month + 1).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
        }
    }

    return "";
}


function dailyTodayKey() {

    return dailyDateKey(new Date().toISOString());
}


/*
   Financial month rule:
   7th to 6th.

   Example:
   07-Oct to 06-Nov = October financial month.
*/

function dailyFinancialMonthKey(dateKey) {

    if (!dateKey) return "";

    const parts = dateKey.split("-").map(Number);

    const d = new Date(parts[0], parts[1] - 1, parts[2]);

    if (d.getDate() <= 6) {
        d.setMonth(d.getMonth() - 1);
    }

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0")
    ].join("-");
}


/* ---------- Movement structure ---------- */

function createDailyMovement() {

    const movement = {};

    BALANCE_ACCOUNTS.forEach(account => {
        movement[account] = 0;
    });

    return movement;
}


/* ---------- Transaction movement ---------- */

function addDailyExpenseMovement(movement, row) {

    const amount = Number(row[2]) || 0;
    const mode = String(row[5] || "").trim();

    if (mode === "CashIn") {

        movement.CASH += amount;

    }
    else if (mode === "CashOut") {

        movement.CASH -= amount;

    }
    else if (
        Object.prototype.hasOwnProperty.call(movement, mode)
    ) {

        movement[mode] -= amount;

    }
}


/* ---------- Adjustment movement ---------- */

// Follows the existing processMonth() rules in core.js.

function addDailyAdjustmentMovement(movement, row) {

    const amount = Number(row[2]) || 0;

    const fromMode = String(row[3] || "").trim();
    const toMode = String(row[4] || "").trim();
    const adjType = String(row[5] || "").trim();

    const fromIsAccount = LEDGER_ACCOUNTS.includes(fromMode);
    const toIsAccount = LEDGER_ACCOUNTS.includes(toMode);

    if (
        fromMode === "TRCASH" &&
        toMode === "CASH" &&
        adjType === "Internal"
    ) {

        movement.TRCASH -= amount;
        movement.CASH += amount;

    }
    else if (
        fromMode === "TRCASH" &&
        toMode === "CASH"
    ) {

        movement.CASH += amount;

    }
    else if (fromIsAccount && toIsAccount) {

        if (Object.prototype.hasOwnProperty.call(movement, fromMode)) {
            movement[fromMode] -= amount;
        }

        if (Object.prototype.hasOwnProperty.call(movement, toMode)) {
            movement[toMode] += amount;
        }

    }
    else if (fromIsAccount) {

        if (Object.prototype.hasOwnProperty.call(movement, fromMode)) {
            movement[fromMode] -= amount;
        }

    }
    else if (toIsAccount) {

        if (Object.prototype.hasOwnProperty.call(movement, toMode)) {
            movement[toMode] += amount;
        }

    }
}


/* ---------- Original opening balances ---------- */

// Uses the same initial balance source as core.js.

function getDailyBaseBalances() {

    const balances = {};

    BALANCE_ACCOUNTS.forEach(account => {
        balances[account] = 0;
    });

    allClosing.forEach(row => {

        const account = String(row[1] || "").trim();

        if (Object.prototype.hasOwnProperty.call(balances, account)) {
            balances[account] = Number(row[2]) || 0;
        }

    });

    return balances;
}


/* ---------- Apply movement to balances ---------- */

function applyDailyMovement(balances, transactionMovement, adjustmentMovement) {

    BALANCE_ACCOUNTS.forEach(account => {

        balances[account] +=
            (Number(transactionMovement[account]) || 0) +
            (Number(adjustmentMovement[account]) || 0);

    });
}


/* ---------- Collect entries for selected range ---------- */

function getDailyReconciliationData(fromDate, toDate) {

    const expenses = [];
    const adjustments = [];

    const editedExpenses = [];
    const unknownExpenses = [];

    const historicalEditedExpenses = [];
    const historicalUnknownExpenses = [];

    // Movements before From Date
    const openingExpenseMovement = createDailyMovement();
    const openingAdjustmentMovement = createDailyMovement();

    // Movements inside selected range
    const expenseMovement = createDailyMovement();
    const adjustmentMovement = createDailyMovement();


    // TRANSACTIONS

    allTransactions.forEach(row => {

        const created = dailyDateKey(row[8]);
        const updated = dailyDateKey(row[9]);

        // Use UpdatedOn, otherwise CreatedOn.
        const activityDate = updated || created;

        if (!activityDate) {

            unknownExpenses.push(row);
            return;

        }

        // Existing transaction edited after creation.
        // Previous amount/account is not available.
        const isEdited = created && updated && created !== updated;


        // Before selected range:
        // Include in opening balance if reconstructable.

        if (activityDate < fromDate) {

            if (isEdited) {
                historicalEditedExpenses.push(row);
                return;
            }

            if (!created) {
                historicalUnknownExpenses.push(row);
                return;
            }

            addDailyExpenseMovement(openingExpenseMovement, row);
            return;

        }

        // After selected range

		if (activityDate > toDate) {

			// An older transaction may have been edited after
			// the selected reconciliation period.
			if (isEdited && created && created <= toDate) {
				historicalEditedExpenses.push(row);
			}

			return;
		}


        expenses.push(row);

        if (isEdited) {
            editedExpenses.push(row);
            return;
        }

        if (!created) {
            unknownExpenses.push(row);
            return;
        }

        addDailyExpenseMovement(expenseMovement, row);

    });


    // ADJUSTMENTS

    allAdjustments.forEach(row => {

        const created = dailyDateKey(row[8]);

        if (!created) return;


        // Before selected range

        if (created < fromDate) {

            addDailyAdjustmentMovement(
                openingAdjustmentMovement,
                row
            );

            return;

        }


        // After selected range

        if (created > toDate) return;


        adjustments.push(row);

        addDailyAdjustmentMovement(
            adjustmentMovement,
            row
        );

    });


    // Calculate opening balance:
    // Original opening + all movements before From Date.

    const openingBalances = getDailyBaseBalances();

    applyDailyMovement(
        openingBalances,
        openingExpenseMovement,
        openingAdjustmentMovement
    );


    // Calculate closing balance:
    // Opening balance + movements inside selected range.

    const closingBalances = { ...openingBalances };

    applyDailyMovement(
        closingBalances,
        expenseMovement,
        adjustmentMovement
    );


    return {

        fromDate,
        toDate,

        expenses,
        adjustments,

        editedExpenses,
        unknownExpenses,

        historicalEditedExpenses,
        historicalUnknownExpenses,

        openingBalances,
        closingBalances,

        expenseMovement,
        adjustmentMovement

    };
}


/* ---------- Render account reconciliation ---------- */

function renderDailyReconciliation(data) {

    const tbody = $("dailyReconciliationRows");
    const tfoot = $("dailyReconciliationFoot");

    tbody.innerHTML = "";

    let openingTotal = 0;
    let expenseTotal = 0;
    let adjustmentTotal = 0;
    let closingTotal = 0;


    const movementClass = value => {

        if (value > 0.005) return "daily-positive";
        if (value < -0.005) return "daily-negative";

        return "";

    };


    BALANCE_ACCOUNTS.forEach(account => {

        const opening =
            Number(data.openingBalances[account]) || 0;

        const expense =
            Number(data.expenseMovement[account]) || 0;

        const adjustment =
            Number(data.adjustmentMovement[account]) || 0;

        const closing =
            Number(data.closingBalances[account]) || 0;


        openingTotal += opening;
        expenseTotal += expense;
        adjustmentTotal += adjustment;
        closingTotal += closing;


        tbody.innerHTML += `

            <tr>

                <td><strong>${esc(account)}</strong></td>

                <td>${formatMoney(opening)}</td>

                <td class="${movementClass(expense)}">
                    ${formatMoney(expense)}
                </td>

                <td class="${movementClass(adjustment)}">
                    ${formatMoney(adjustment)}
                </td>

                <td>
                    <strong>${formatMoney(closing)}</strong>
                </td>

            </tr>

        `;

    });


    tfoot.innerHTML = `

        <tr>

            <th>Total</th>

            <th>${formatMoney(openingTotal)}</th>

            <th>${formatMoney(expenseTotal)}</th>

            <th>${formatMoney(adjustmentTotal)}</th>

            <th>${formatMoney(closingTotal)}</th>

        </tr>

    `;


    $("dailySummaryCards").innerHTML = `

        <div class="daily-summary-card">
            <small>OPENING BALANCE</small>
            <strong>${formatMoney(openingTotal)}</strong>
        </div>

        <div class="daily-summary-card">
            <small>NET MOVEMENT</small>
            <strong>${formatMoney(expenseTotal + adjustmentTotal)}</strong>
        </div>

        <div class="daily-summary-card">
            <small>CLOSING BALANCE</small>
            <strong>${formatMoney(closingTotal)}</strong>
        </div>

    `;


    return {
        openingTotal,
        expenseTotal,
        adjustmentTotal,
        closingTotal
    };

}


/* ---------- Expense entry details ---------- */

function renderDailyExpenseEntries(data) {

    const container = $("dailyExpenseEntries");

    if (!data.expenses.length) {

        container.innerHTML =
            '<div class="daily-empty">No transactions found in this date range.</div>';

        return;

    }


    container.innerHTML = data.expenses.map(row => {

        const created = dailyDateKey(row[8]);
        const updated = dailyDateKey(row[9]);

        let warning = "";

        if (!created) {

            warning = "CreatedOn missing - excluded from movement";

        }
        else if (created !== updated) {

            warning = "Edited transaction - previous value unavailable; excluded from movement";

        }


        return `

            <div class="daily-entry">

                <div class="daily-entry-main">

                    <strong>${esc(row[3])}</strong>

                    <strong>${formatMoney(row[2])}</strong>

                </div>

                <div class="daily-entry-meta">

                    Date: ${esc(row[1])}
                    | Category: ${esc(row[4])}
                    | Mode: ${esc(row[5])}
                    | Payment: ${esc(row[6])}

                </div>

                ${warning ? `
                    <div class="daily-negative daily-entry-meta">
                        ⚠ ${esc(warning)}
                    </div>
                ` : ""}

            </div>

        `;

    }).join("");

}


/* ---------- Adjustment entry details ---------- */

function renderDailyAdjustmentEntries(data) {

    const container = $("dailyAdjustmentEntries");

    if (!data.adjustments.length) {

        container.innerHTML =
            '<div class="daily-empty">No adjustments found in this date range.</div>';

        return;

    }


    container.innerHTML = data.adjustments.map(row => {

        return `

            <div class="daily-entry">

                <div class="daily-entry-main">

                    <strong>${esc(row[6])}</strong>

                    <strong>${formatMoney(row[2])}</strong>

                </div>

                <div class="daily-entry-meta">

                    Date: ${esc(row[1])}
                    | Type: ${esc(row[5])}
                    | ${esc(row[3])} → ${esc(row[4])}

                </div>

            </div>

        `;

    }).join("");

}


/* ---------- Apply selected date range ---------- */

function applyDailyReconciliationRange() {

    const fromDate = $("dailyFromDate").value;
    const toDate = $("dailyToDate").value;


    if (!fromDate || !toDate) {

        alert("Please select both From Date and To Date.");
        return;

    }

    if (fromDate < DAILY_RECON_START_DATE) {

        alert("Reconciliation is available from 1 October 2026 onwards.");

        $("dailyFromDate").value = DAILY_RECON_START_DATE;

        return;

    }

    if (toDate < fromDate) {

        alert("To Date cannot be earlier than From Date.");
        return;

    }

    if (toDate > dailyTodayKey()) {

        alert("To Date cannot be in the future.");
        return;

    }


    const data = getDailyReconciliationData(fromDate, toDate);

    renderDailyReconciliation(data);

    renderDailyExpenseEntries(data);

    renderDailyAdjustmentEntries(data);


    $("dailySummaryDate").textContent =
        fromDate + "  →  " + toDate;


    const notes = [];


    if (data.editedExpenses.length) {

        notes.push(
            `${data.editedExpenses.length} transaction(s) edited during this range. Previous amounts/accounts are unavailable, so these were excluded from movement.`
        );

    }


    if (data.unknownExpenses.length) {

        notes.push(
            `${data.unknownExpenses.length} transaction(s) have missing CreatedOn values and were excluded from movement.`
        );

    }


    if (data.historicalEditedExpenses.length) {

        notes.push(
            `${data.historicalEditedExpenses.length} earlier edited transaction(s) could not be reconstructed for the opening balance.`
        );

    }


    if (data.historicalUnknownExpenses.length) {

        notes.push(
            `${data.historicalUnknownExpenses.length} earlier transaction(s) could not be included in the opening balance because CreatedOn is missing.`
        );

    }


    if (notes.length) {

        $("dailyReconciliationNote").innerHTML =
            notes.map(n =>
                `<p class="daily-negative">⚠ ${esc(n)}</p>`
            ).join("");

    }
    else {

        $("dailyReconciliationNote").innerHTML = `

            <p class="daily-positive">
                ✓ All identifiable transactions and adjustments have been included.
            </p>

        `;

    }

}


/* ---------- Open reconciliation modal ---------- */

function openDailyReconciliation() {

    const today = dailyTodayKey();

    if (!$("dailyFromDate").value) {
        $("dailyFromDate").value = DAILY_RECON_START_DATE;
    }

    if (!$("dailyToDate").value) {
        $("dailyToDate").value = today;
    }

    $("dailyFromDate").min = DAILY_RECON_START_DATE;
    $("dailyFromDate").max = today;

    $("dailyToDate").min = DAILY_RECON_START_DATE;
    $("dailyToDate").max = today;


    applyDailyReconciliationRange();

    $("dailySummaryModal").classList.add("show");

}


/* ---------- Close reconciliation modal ---------- */

function closeDailyReconciliation() {

    $("dailySummaryModal").classList.remove("show");

}

