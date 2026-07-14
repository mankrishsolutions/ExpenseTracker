let filteredTransactions = [];
let filteredAdjustments = [];
let filteredClosing = [];
let categoryChart = null;
let paymentChart = null;
let monthlyTrendChart = null;
let monthlyComparisonChart = null;
let onlineBreakupChart = null;
let balanceDistributionChart = null;
let balanceHistoryChart = null;
let categoryTrendChart = null;

Chart.register(ChartDataLabels);



document.addEventListener(
    "headerLoaded",
    init
);

async function init() {

    initializeTabs();

    await loadData();


    Chart.register(
        ChartDataLabels,
        doughnutCenterText
    );
}



/* ==========================================
   TABS
========================================== */

function initializeTabs() {

    const tabs =
        document.querySelectorAll(".analytics-tab");

    const panels =
        document.querySelectorAll(".analytics-panel");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            // Remove active tab
            tabs.forEach(t =>
                t.classList.remove("active")
            );

            // Hide all panels
            panels.forEach(panel =>
                panel.classList.remove("active")
            );

            // Activate clicked tab
            tab.classList.add("active");

            // Show corresponding panel
            const panel =
                document.getElementById(
                    "panel" +
                    tab.dataset.tab.charAt(0).toUpperCase() +
                    tab.dataset.tab.slice(1)
                );

            if (panel) {

                panel.classList.add("active");

            }

        });

    });

}

async function loadData() {

    showLoading();

    try {

        const cache =
            await getExpenseCache();

        allTransactions =
            cache.transactions.slice(1);

        allAdjustments =
            cache.adjustments.slice(1);

        allClosing =
            cache.monthlyClosing.slice(1);

        initializeMonth();

        applyFilters();

    }

    catch (err) {

        console.error(err);

    }

    finally {

        hideLoading();

    }

}

function initializeMonth() {

    populateMonths(

        allTransactions,

        allAdjustments

    );

    document
        .getElementById("cmbMonth")
        .addEventListener(
            "change",
            applyFilters
        );

}

function applyFilters() {

    const month =
        document
            .getElementById("cmbMonth")
            .value;

    filteredTransactions =
        allTransactions.filter(t =>
            getExpenseMonth(
                new Date(t[1])
            ) === month

        );

    filteredAdjustments =
        allAdjustments.filter(a =>

            getExpenseMonth(
                new Date(a[1])
            ) === month

        );

    filteredClosing =
        allClosing.filter(c =>
            c[0] === month
        );

    renderSummary();
    renderCategoryChart();
    renderPaymentChart();
    renderMonthlyTrendChart();
    renderMonthlyComparisonChart();
    renderOnlineBreakupChart();
    renderBalanceDistributionChart();
    renderBalanceHistoryChart();
    renderTopCategories();
    renderTopExpenses();
    renderCategoryTrendChart();
}

function renderSummary() {

    /* ===============================
       Total Expense
    =============================== */

    const totalExpense =
        filteredTransactions.reduce(
            (sum, row) =>
                sum + Number(row[2] || 0),
            0
        );

    /* ===============================
       Total Income
    =============================== */

    const totalIncome =
        filteredAdjustments.reduce(
            (sum, row) => {

                const type =
                    String(row[5] || "");

                if (type.startsWith("External")) {

                    return sum +
                        Number(row[2] || 0);

                }

                return sum;

            },
            0
        );

    /* ===============================
       Transaction Count
    =============================== */

    const transactionCount =
        filteredTransactions.length;

    /* ===============================
       Average Daily Expense
    =============================== */

    const transactionDates =
        filteredTransactions.map(row =>
            new Date(row[1]).toDateString()
        );

    const uniqueDays =
        new Set(transactionDates).size;

    const averageDaily =
        uniqueDays > 0
            ? totalExpense / uniqueDays
            : 0;

    /* ===============================
       Render Cards
    =============================== */

    document.getElementById("lblIncome").textContent =
        formatAmount(totalIncome);

    document.getElementById("lblExpense").textContent =
        formatAmount(totalExpense);

    document.getElementById("lblTransactions").textContent =
        transactionCount;

    document.getElementById("lblAverage").textContent =
        formatAmount(averageDaily);

}

/* ==========================================
   CATEGORY TOTALS
========================================== */

function calculateCategoryTotals() {

    const totals = {};

    filteredTransactions.forEach(row => {

        const category = row[4];
        const amount = Number(row[2]) || 0;

        if (!totals[category]) {

            totals[category] = 0;

        }

        totals[category] += amount;

    });

    return totals;

}

/* ==========================================
   CATEGORY CHART
========================================== */

function renderCategoryChart() {

    const totals =
        calculateCategoryTotals();

    const labels =
        Object.keys(totals);

    const values =
        Object.values(totals);

    const canvas =
        document.getElementById(
            "categoryChart"
        );
    if (!canvas)
        return;
    if (categoryChart) {
        categoryChart.destroy();
    }
    categoryChart =
        new Chart(canvas, {

            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor:
                        CHART_COLORS.slice(0, labels.length),
                    borderColor: "#ffffff",
                    borderWidth: 2,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right"
                    },
                    datalabels: {
                        color: "#fff",
                        font: {
                            weight: "bold",
                            size: 13
                        },
                        formatter: (value, context) => {
                            const data =
                                context.chart.data.datasets[0].data;
                            const total =
                                data.reduce((a, b) => a + b, 0);
                            const percentage =
                                (value / total) * 100;
                            return percentage >= 10
                                ? percentage.toFixed(1) + "%"
                                : "";
                        }
                    }
                }
            }
        });

}

/* ==========================================
   PAYMENT SPLIT
========================================== */

function calculatePaymentSplit() {

    const split = {

        cash: 0,
        online: 0,
        card: 0

    };

    filteredTransactions.forEach(row => {

        const amount =
            Number(row[2]) || 0;

        const mode =
            row[5];

        if (
            PAYMENT_MODE_GROUPS.CASH.includes(mode)
        ) {

            split.cash += amount;

        }

        if (
            PAYMENT_MODE_GROUPS.ONLINE.includes(mode)
        ) {

            split.online += amount;

        }

        if (
            PAYMENT_MODE_GROUPS.CARD.includes(mode)
        ) {

            split.card += amount;

        }

    });

    return split;

}


const doughnutCenterText = {

    id: "doughnutCenterText",

    afterDraw(chart) {

        if (chart.config.type !== "doughnut")
            return;

        const {

            ctx,

            chartArea: {
                left,
                right,
                top,
                bottom
            }

        } = chart;

        const dataset =
            chart.data.datasets[0].data;

        const total =
            dataset.reduce((a, b) => a + b, 0);

        const centerX =
            (left + right) / 2;

        const centerY =
            (top + bottom) / 2;

        ctx.save();

        ctx.textAlign = "center";

        ctx.fillStyle = "#666";

        ctx.font =
            "600 12px Segoe UI";

        ctx.fillText(

            "Total",

            centerX,

            centerY - 8

        );

        ctx.fillStyle = "#111";

        ctx.font =
            "bold 18px Segoe UI";

        ctx.fillText(

            formatAmount(total),

            centerX,

            centerY + 16

        );

        ctx.restore();

    }

};

/* ==========================================
   PAYMENT CHART
========================================== */

function renderPaymentChart() {

    const split =
        calculatePaymentSplit();

    const canvas =
        document.getElementById(
            "paymentChart"
        );

    if (!canvas)
        return;

    if (paymentChart) {

        paymentChart.destroy();

    }

    paymentChart =
        new Chart(canvas, {

            type: "pie",

            data: {

                labels: [

                    "Cash",

                    "Online",

                    "Card"

                ],

                datasets: [{

                    data: [

                        split.cash,

                        split.online,

                        split.card

                    ],

                    backgroundColor: [

                        "#22C55E",

                        "#3B82F6",

                        "#F59E0B"

                    ],

                    borderColor: "#fff",

                    borderWidth: 2

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "28%",
                radius: "100%",
                plugins: {

                    legend: {
                        position: "right"
                    },

                    datalabels: {

                        color: "#222",

                        font: {

                            weight: "bold",

                            size: 12

                        },

                        formatter: (value, context) => {

                            const data =
                                context.chart.data.datasets[0].data;

                            const total =
                                data.reduce((a, b) => a + b, 0);

                            const percentage =
                                (value / total) * 100;

                            if (percentage < 5)
                                return "";

                            return context.chart.data.labels[
                                context.dataIndex
                            ] + "\n" + percentage.toFixed(1) + "%";

                        }

                    }

                }

            }

        });

}

/* ==========================================
   MONTHLY TREND
========================================== */

function calculateMonthlyTrend() {

    const monthlyTotals = {};

    allTransactions.forEach(row => {

        const month =
            getExpenseMonth(
                new Date(row[1])
            );

        const amount =
            Number(row[2]) || 0;

        if (!monthlyTotals[month]) {

            monthlyTotals[month] = 0;

        }

        monthlyTotals[month] += amount;

    });

    const labels =
        Object.keys(monthlyTotals);

    labels.sort(sortExpenseMonths);

    const lastMonths =
        labels.slice(-6);

    return {

        labels: lastMonths,

        values: lastMonths.map(
            m => monthlyTotals[m]
        )

    };

}

/* ==========================================
   MONTHLY TREND CHART
========================================== */

function renderMonthlyTrendChart() {

    const trend = calculateMonthlyTrend();

    const canvas =
        document.getElementById("expenseTrendChart");

    if (!canvas)
        return;

    if (monthlyTrendChart) {

        monthlyTrendChart.destroy();

    }

    monthlyTrendChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: trend.labels,

            datasets: [{

                label: "Expense",

                data: trend.values,

                borderColor: "#2563eb",

                backgroundColor: "rgba(37,99,235,.12)",

                fill: true,

                tension: 0.4,

                borderWidth: 3,

                pointRadius: 4,

                pointHoverRadius: 7,

                pointBackgroundColor: trend.values.map((v, i) =>
                    i === trend.values.length - 1
                        ? "#ef4444"
                        : "#2563eb"
                ),

                pointBorderColor: "#ffffff",

                pointBorderWidth: 2

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {

                intersect: false,

                mode: "index"

            },

            plugins: {

                legend: {

                    display: false

                },

                tooltip: {

                    callbacks: {

                        label: ctx =>
                            "₹ " +
                            formatAmount(ctx.raw)

                    }

                },

                datalabels: {

                    color: "#374151",

                    anchor: "end",

                    align: "top",

                    offset: 6,

                    font: {

                        weight: "600",

                        size: 11

                    },

                    formatter: value =>

                        "₹" +

                        Number(value)
                            .toLocaleString("en-IN", {

                                maximumFractionDigits: 0

                            })

                }

            },

            scales: {

                x: {

                    grid: {

                        display: false

                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        callback: value =>

                            "₹" +

                            Number(value / 1000) +

                            "K"

                    }

                }

            }

        }

    });

}


/* ==========================================
   MONTHLY COMPARISON
========================================== */

function calculateMonthlyComparison() {

    const months = {};

    allTransactions.forEach(row => {

        const month =
            getExpenseMonth(
                new Date(row[1])
            );

        if (!months[month]) {

            months[month] = {

                income: 0,
                expense: 0

            };

        }

        months[month].expense +=
            Number(row[2] || 0);

    });

    allAdjustments.forEach(row => {

        const month =
            getExpenseMonth(
                new Date(row[1])
            );

        if (!months[month]) {

            months[month] = {

                income: 0,
                expense: 0

            };

        }

        if (
            String(row[5])
                .startsWith("External")
        ) {

            months[month].income +=
                Number(row[2] || 0);

        }

    });

    const labels =
        Object.keys(months);

    labels.sort(sortExpenseMonths);

    const selectedMonth =
        document
            .getElementById("cmbMonth")
            .value;

    let index =
        labels.indexOf(selectedMonth);

    if (index < 0)
        index = labels.length - 1;

    const lastMonths =
        labels.slice(
            Math.max(0, index - 5),
            index + 1
        );

    return {

        labels: lastMonths,

        income:
            lastMonths.map(
                m => months[m].income
            ),

        expense:
            lastMonths.map(
                m => months[m].expense
            )

    };

}

/* ==========================================
   MONTHLY COMPARISON CHART
========================================== */


function renderMonthlyComparisonChart() {

    const data =
        calculateMonthlyComparison();

    const canvas =
        document.getElementById(
            "monthlyComparisonChart"
        );

    if (!canvas)
        return;

    if (monthlyComparisonChart) {

        monthlyComparisonChart.destroy();

    }

    monthlyComparisonChart =
        new Chart(canvas, {
            type: "bar",
            data: {
                labels:
                    data.labels,
                datasets: [
                    {
                        label: "Income",
                        data:
                            data.income,
                        backgroundColor:
                            "#22c55e",
                        borderRadius: 8
                    },
                    {
                        label: "Expense",
                        data:
                            data.expense,
                        backgroundColor:
                            "#ef4444",
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {

                    legend: {

                        position: "top"

                    },

                    // 👇 ADD/REPLACE THIS
                    datalabels: {

                        color: "#ffffff",

                        anchor: "center",

                        align: "center",

                        font: {

                            weight: "bold",

                            size: 12

                        },

                        formatter: value =>

                            "₹" +

                            Number(value).toLocaleString(
                                "en-IN",
                                {
                                    maximumFractionDigits: 0
                                }
                            )

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: value =>

                                "₹" +

                                (value / 1000) +

                                "K"

                        }

                    }

                }

            }

        });
}

/* ==========================================
   OnlineBreakup
========================================== */
function calculateOnlineBreakup() {
    const breakup = {
        "Cash": 0,
        "UPI": 0,
        "Bank / DC": 0,
        "KiWi": 0
    };
    filteredTransactions.forEach(row => {
        const medium =
            row[6];
        const amount =
            Number(row[2]) || 0;
        if (breakup.hasOwnProperty(medium)) {
            breakup[medium] += amount;
        }
    });
    return breakup;
}

function renderOnlineBreakupChart() {
    const breakup =
        calculateOnlineBreakup();
    const labels =
        Object.keys(breakup);
    const values =
        Object.values(breakup);
    const canvas =
        document.getElementById(
            "onlineBreakupChart"
        );
    if (!canvas)
        return;
    if (onlineBreakupChart) {
        onlineBreakupChart.destroy();
    }

    onlineBreakupChart =
        new Chart(canvas, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    data: values,
                    borderRadius: 8,
                    backgroundColor: "#2563eb"
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        color: "#ffffff",
                        anchor: "end",
                        align: "left",
                        formatter: value =>
                            formatAmount(value)
                    }
                },

                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: value =>
                                "₹" +
                                (value / 1000) +
                                "K"
                        }
                    }
                }
            }
        });

}

/* ==========================================
   BALANCE DISTRIBUTION
========================================== */

/* ==========================================
   BALANCE DISTRIBUTION
========================================== */

function calculateBalanceDistribution() {
    const balances =
        calculateBalances(
            document
                .getElementById("cmbMonth")
                .value
        );
    const labels = [];
    const values = [];
    Object.entries(balances).forEach(([account, amount]) => {
        if (amount <= 0)
            return;
        labels.push(account);
        values.push(amount);
    });
    return {
        labels,
        values
   };

}

function renderBalanceDistributionChart() {

    const data =
        calculateBalanceDistribution();

    const canvas =
        document.getElementById(
            "balanceDistributionChart"
        );

    if (!canvas)
        return;

    if (balanceDistributionChart) {

        balanceDistributionChart.destroy();

    }

    // Sort Highest → Lowest

    const rows =
        data.labels.map((label, i) => ({

            label,

            value: data.values[i]

        }))
            .sort((a, b) => b.value - a.value);

    balanceDistributionChart =
        new Chart(canvas, {

            type: "polarArea",

            data: {
                labels: rows.map(r => r.label),
                datasets: [{
                    data: rows.map(r => r.value),
                    backgroundColor: [
                        "#2563eb",
                        "#10b981",
                        "#f59e0b",
                        "#8b5cf6",
                        "#ef4444",
                        "#06b6d4",
                        "#84cc16"
                    ],
                    borderColor: "#ffffff",
                    borderWidth: 2
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx =>
                                ctx.label +
                                ": " +
                                formatAmount(ctx.raw)
                        }
                    },
                    datalabels: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        ticks: {
                            display: false
                        },
                        grid: {
                            color: "#eceff5"
                        },
                        angleLines: {
                            color: "#eceff5"
                        }
                    }
                }
            }
        });
}

/* ==========================================
   BALANCE HISTORY
========================================== */

function calculateBalanceHistory() {

    const months = [
        ...new Set([
            ...allTransactions.map(r =>
                getExpenseMonth(
                    new Date(r[1])
                )
            ),
            ...allAdjustments.map(r =>
                getExpenseMonth(
                    new Date(r[1])
                )
            )
        ])
    ];
    months.sort(sortExpenseMonths);
    const selected =
        document
            .getElementById("cmbMonth")
            .value;
    let index =
        months.indexOf(selected);
    if (index < 0)
        index = months.length - 1;
    const historyMonths =
        months.slice(
            Math.max(0, index - 5),
            index + 1
        );
    return historyMonths.map(month => ({
        month,
        balances:
            calculateBalances(month)
    }));
}

function renderBalanceHistoryChart() {
    const history =
        calculateBalanceHistory();
    const canvas =
        document.getElementById(
            "balanceHistoryChart"
        );
    if (!canvas)
        return;
    if (balanceHistoryChart) {
        balanceHistoryChart.destroy();
    }
    balanceHistoryChart =
        new Chart(canvas, {
            type: "line",
            data: {
                labels:
                    history.map(h => h.month),
                datasets: [
                    {
                        label: "CR HDFC",
                        data:
                            history.map(
                                h => h.balances.CRHD || 0
                            ),
                        borderColor: "#2563eb",
                        backgroundColor: "#2563eb",
                        tension: .35,
                        borderWidth: 3,
                        pointRadius: history.map((_, index) =>
                            index === history.length - 1 ? 6 : 3
                        ),

                        pointHoverRadius: 8,
                    },
                    {
                        label: "TR HDFC",
                        data:
                            history.map(
                                h => h.balances.TRHD || 0
                            ),
                        borderColor: "#10b981",
                        backgroundColor: "#10b981",
                        tension: .35,
                        borderWidth: 3,
                        pointRadius: history.map((_, index) =>
                            index === history.length - 1 ? 6 : 3
                        ),

                        pointHoverRadius: 8,
                    },
                    {
                        label: "KR HDFC",
                        data:
                            history.map(
                                h => h.balances.KRHD || 0
                            ),
                        borderColor: "#f59e0b",
                        backgroundColor: "#f59e0b",
                        tension: .35,
                        borderWidth: 3,
                        pointRadius: history.map((_, index) =>
                            index === history.length - 1 ? 6 : 3
                        ),

                        pointHoverRadius: 8,
                    },
                    {
                        label: "Cash",
                        data:
                            history.map(
                                h => h.balances.CASH || 0
                            ),
                        borderColor: "#8b5cf6",
                        backgroundColor: "#8b5cf6",
                        tension: .35,
                        borderWidth: 3,
                        pointRadius: history.map((_, index) =>
                            index === history.length - 1 ? 6 : 3
                        ),

                        pointHoverRadius: 8,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle"
                        }
                    },
                    datalabels: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx =>
                                ctx.dataset.label +
                                ": " +
                                formatAmount(ctx.raw)
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value =>
                                "₹" +
                                (value / 1000) +
                                "K"
                        }
                    }
                }
            }
        });
}

/* ==========================================
   TOP CATEGORIES
========================================== */

function calculateTopCategories() {

    const totals = {};

    filteredTransactions.forEach(row => {

        const category = row[4];
        const amount = Number(row[2]) || 0;

        totals[category] =
            (totals[category] || 0) + amount;

    });

    return Object.entries(totals)

        .map(([category, amount]) => ({

            category,
            amount

        }))

        .sort((a, b) =>

            b.amount - a.amount

        )

        .slice(0, 5);

}

function renderTopCategories() {

    const list =
        document.getElementById(
            "topCategoriesList"
        );

    if (!list)
        return;

    const data =
        calculateTopCategories();

    const total =
        data.reduce(
            (sum, c) => sum + c.amount,
            0
        );

    list.innerHTML = "";

    data.forEach((item, index) => {

        const percent =
            total
                ? (item.amount * 100 / total)
                : 0;

        list.innerHTML += `

<div class="top-item">

    <div class="top-header">

        <span>

            <strong>${index + 1}.</strong>

            <i class="fa-solid ${getCategoryIcon(item.category)}"></i>

            ${item.category}

        </span>

        <span>

            ${formatAmount(item.amount)}

        </span>

    </div>

    <div class="top-progress">

        <div class="top-fill"

             style="width:${percent}%">

        </div>

    </div>

    <div class="top-percent">

        ${percent.toFixed(1)}%

    </div>

</div>

`;

    });

}

/* ==========================================
   TOP EXPENSES
========================================== */

function calculateTopExpenses() {

    return [...filteredTransactions]

        .sort((a, b) =>

            Number(b[2]) - Number(a[2])

        )

        .slice(0, 5);

}

function renderTopExpenses() {

    const list =
        document.getElementById(
            "topExpensesList"
        );

    if (!list)
        return;

    const data =
        calculateTopExpenses();

    list.innerHTML = "";

    data.forEach((row, index) => {

        const amount =
            Number(row[2]) || 0;

        const description =
            row[3];

        const category =
            row[4];

        const medium =
            row[6];

        list.innerHTML += `

<div class="top-item">

    <div class="top-header">

        <span>

            <strong>${index + 1}.</strong>

            <i class="fa-solid ${getCategoryIcon(category)}"></i>

            ${description}

        </span>

        <span>

            ${formatAmount(amount)}

        </span>

    </div>

    <div class="top-subtitle">

        ${category}

        &nbsp;•&nbsp;

        ${medium}

    </div>

</div>

`;

    });

}

/* ==========================================
   CATEGORY TREND
========================================== */

function calculateCategoryTrend() {

    const topCategories =
        calculateTopCategories()
            .slice(0, 3)
            .map(c => c.category);

    const months = [

        ...new Set([

            ...allTransactions.map(r =>
                getExpenseMonth(
                    new Date(r[1])
                )
            )

        ])

    ];

    months.sort(sortExpenseMonths);

    const selectedMonth =
        document
            .getElementById("cmbMonth")
            .value;

    let index =
        months.indexOf(selectedMonth);

    if (index < 0)
        index = months.length - 1;

    const lastMonths =
        months.slice(
            Math.max(0, index - 5),
            index + 1
        );

    const series = {};

    topCategories.forEach(cat => {

        series[cat] = [];

        lastMonths.forEach(month => {

            const total = allTransactions

                .filter(t =>

                    getExpenseMonth(
                        new Date(t[1])
                    ) === month &&

                    t[4] === cat

                )

                .reduce(
                    (sum, t) =>
                        sum + Number(t[2]),
                    0
                );

            series[cat].push(total);

        });

    });

    return {

        months: lastMonths,

        series

    };

}

function renderCategoryTrendChart() {

    const trend =
        calculateCategoryTrend();

    const canvas =
        document.getElementById(
            "categoryTrendChart"
        );

    if (!canvas)
        return;

    if (categoryTrendChart) {

        categoryTrendChart.destroy();

    }

    const colors = [

        "#2563eb",

        "#10b981",

        "#f59e0b"

    ];

    const datasets =

        Object.keys(trend.series)

            .map((cat, index) => ({

                label: cat,

                data:
                    trend.series[cat],

                borderColor:
                    colors[index],

                backgroundColor:
                    colors[index],

                borderWidth: 3,

                tension: .35,

                pointRadius: 4,

                fill: false

            }));

    categoryTrendChart =
        new Chart(canvas, {

            type: "line",

            data: {

                labels:
                    trend.months,

                datasets

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    },

                    datalabels: {

                        display: false

                    }

                },

                scales: {

                    x: {

                        grid: {

                            display: false

                        }

                    },

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: value =>

                                "₹" +

                                (value / 1000) +

                                "K"

                        }

                    }

                }

            }

        });

}