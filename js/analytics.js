let filteredTransactions = [];
let filteredAdjustments = [];
let filteredClosing = [];
let categoryChart = null;
let paymentChart = null;
let monthlyTrendChart = null;
let monthlyComparisonChart = null;


Chart.register(ChartDataLabels);


const CHART_COLORS = [
    "#4F46E5",
    "#0EA5E9",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#84CC16",
    "#F97316",
    "#6366F1",
    "#06B6D4"
];

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