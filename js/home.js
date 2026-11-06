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
