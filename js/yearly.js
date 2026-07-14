/* ==========================================================
   YEARLY DASHBOARD
========================================================== */

let yearlyTransactions = [];
let yearlyAdjustments = [];

let yearlyCategoryChart = null;
let yearlyExpenseChart = null;
Chart.register(ChartDataLabels);

/* ==========================================================
   PAGE LOAD
========================================================== */

document.addEventListener("DOMContentLoaded", init);

async function init() {

    showLoading();

    try {

        await loadYearlyData();

        populateFinancialYears();

        loadYearDashboard();

        document
            .getElementById("cmbFinancialYear")
            .addEventListener(
                "change",
                loadYearDashboard
            );

        document
            .getElementById("btnRefreshYear")
            .addEventListener(
                "click",
                refreshYearlyData
            );

    }
    catch (err) {

        console.error(err);

        alert(
            "Unable to load Year Dashboard."
        );

    }
    finally {

        hideLoading();

    }

}


/* ==========================================================
   LOAD CACHE
========================================================== */

async function loadYearlyData() {

    await loadCachedData();

}


/* ==========================================================
   REFRESH
========================================================== */

async function refreshYearlyData() {

    await refreshExpenseCache(false);

    await loadYearlyData();

    populateFinancialYears();

    loadYearDashboard();

    showMessage(
        "Year Dashboard refreshed successfully.",
        "green"
    );

}


/* ==========================================================
   FINANCIAL YEAR
========================================================== */

function getFinancialYear(date) {

    let year =
        date.getFullYear();

    let month =
        date.getMonth() + 1;

    if (month < 4) {

        year--;

    }

    return (
        year +
        "-" +
        String(year + 1).substring(2)
    );

}


/* ==========================================================
   FINANCIAL YEAR RANGE
========================================================== */

function getFinancialYearRange(fy) {

    const startYear =
        Number(
            fy.substring(0, 4)
        );

    return {

        start:
            new Date(
                startYear,
                3,
                7,
                0,
                0,
                0
            ),

        end:
            new Date(
                startYear + 1,
                3,
                6,
                23,
                59,
                59
            )

    };

}


/* ==========================================================
   YEAR DROPDOWN
========================================================== */

function populateFinancialYears() {

    const cmb =
        document.getElementById(
            "cmbFinancialYear"
        );

    cmb.innerHTML = "";

    const years =
        new Set();

    allTransactions.forEach(row => {

        years.add(

            getFinancialYear(

                new Date(row[1])

            )

        );

    });

    [...years]

        .sort()

        .forEach(fy => {

            cmb.innerHTML +=

                `<option value="${fy}">

                ${fy}

            </option>`;

        });

    cmb.value =

        cmb.options[
            cmb.options.length - 1
        ].value;

}


/* ==========================================================
   LOAD YEAR
========================================================== */

function loadYearDashboard() {

    const fy =

        document
            .getElementById(
                "cmbFinancialYear"
            )
            .value;

    const range =

        getFinancialYearRange(fy);

    yearlyTransactions =

        allTransactions.filter(row => {

            const d =
                new Date(row[1]);

            return (

                d >= range.start &&

                d <= range.end

            );

        });

    yearlyAdjustments =

        allAdjustments.filter(row => {

            const d =
                new Date(row[1]);

            return (

                d >= range.start &&

                d <= range.end

            );

        });

    document.getElementById(

        "lblFinancialYear"

    ).textContent =

        "Financial Year : " + fy;

    document.getElementById(

        "lblDateRange"

    ).textContent =

        formatDate(range.start)

        +

        " to "

        +

        formatDate(range.end);


    renderMonthlySummary();

    renderCategorySummary();

    renderModeSummary();

    renderStatistics();

    renderTopExpenses();

    renderCategoryChart();

    renderYearExpenseChart();

}


/* ==========================================================
   FORMAT DATE
========================================================== */

function formatDate(date) {

    return date.toLocaleDateString(

        "en-GB",

        {

            day: "2-digit",

            month: "short",

            year: "numeric"

        }

    );

}

/* ==========================================================
   MONTHLY SUMMARY
========================================================== */

function calculateMonthlyTotals() {

    const totals = {};

    yearlyTransactions.forEach(row => {

        const month =
            getExpenseMonth(
                new Date(row[1])
            );

        const amount =
            Number(row[2]) || 0;

        totals[month] =
            (totals[month] || 0) + amount;

    });

    const ordered = {};

    sortExpenseMonths(

        Object.keys(totals)

    ).forEach(month => {

        ordered[month] =
            totals[month];

    });

    return ordered;

}

function renderMonthlySummary() {

    const tbody =
        document.querySelector(
            "#tblMonths tbody"
        );

    tbody.innerHTML = "";

    const totals =
        calculateMonthlyTotals();

    let grandTotal = 0;

    Object.entries(totals)

        .forEach(([month, amount]) => {

            grandTotal += amount;

            tbody.innerHTML +=

                `<tr>

                <td>${month}</td>

                <td>${formatAmount(amount)}</td>

            </tr>`;

        });

    document.getElementById(
        "monthGrandTotal"
    ).textContent =
        formatAmount(grandTotal);

}


/* ==========================================================
   CATEGORY SUMMARY
========================================================== */

function calculateCategorySummary() {

    const totals = {};

    yearlyTransactions.forEach(row => {

        const category =
            row[4];

        const amount =
            Number(row[2]) || 0;

        totals[category] =
            (totals[category] || 0) + amount;

    });

    return Object.entries(totals)

        .map(([category, amount]) => ({

            category,

            amount

        }))

        .sort(
            (a, b) =>
                b.amount - a.amount
        );

}

function renderCategorySummary() {

    const tbody =
        document.querySelector(
            "#tblCategories tbody"
        );

    tbody.innerHTML = "";

    const rows =
        calculateCategorySummary();

    let total = 0;

    rows.forEach(row => {

        total += row.amount;

        tbody.innerHTML +=

            `<tr>

            <td>

                <i class="fa-solid ${getCategoryIcon(row.category)}"></i>

                ${row.category}

            </td>

            <td>

                ${formatAmount(row.amount)}

            </td>

        </tr>`;

    });

    document.getElementById(
        "categoryGrandTotal"
    ).textContent =
        formatAmount(total);

}


/* ==========================================================
   MODE SUMMARY
========================================================== */

function calculateModeSummary() {

    const totals = {};

    yearlyTransactions.forEach(row => {

        const mode =
            row[5];

        const amount =
            Number(row[2]) || 0;

        totals[mode] =
            (totals[mode] || 0) + amount;

    });

    return Object.entries(totals)

        .map(([mode, amount]) => ({

            mode,

            amount

        }))

        .sort(
            (a, b) =>
                b.amount - a.amount
        );

}

function renderModeSummary() {

    const tbody =
        document.querySelector(
            "#tblModes tbody"
        );

    tbody.innerHTML = "";

    const rows =
        calculateModeSummary();

    const total =
        rows.reduce(

            (sum, row) =>

                sum + row.amount,

            0

        );

    rows.forEach(row => {

        const percent =

            total === 0

                ? 0

                : (row.amount * 100 / total);

        tbody.innerHTML +=

            `<tr>

            <td>

                ${row.mode}

            </td>

            <td>

                ${formatAmount(row.amount)}

            </td>

            <td>

                ${percent.toFixed(1)}%

            </td>

        </tr>`;

    });

}

/* ==========================================================
   YEARLY STATISTICS
========================================================== */

function calculateStatistics() {

    const categoryTotals =
        calculateCategorySummary();

    const totalExpense =
        yearlyTransactions.reduce(

            (sum, row) =>

                sum + Number(row[2] || 0),

            0

        );

    const highestCategory =

        categoryTotals.length

            ? categoryTotals[0]

            : { category: "-", amount: 0 };

    const lowestCategory =

        categoryTotals.length

            ? categoryTotals[
            categoryTotals.length - 1
            ]

            : { category: "-", amount: 0 };

    const top3Total =
        categoryTotals

            .slice(0, 3)

            .reduce(

                (sum, row) =>

                    sum + row.amount,

                0

            );

    const top3Percent =

        totalExpense === 0

            ? 0

            : (top3Total * 100) / totalExpense;

    return {

        totalExpense,

        highestCategory,

        lowestCategory,

        top3Percent

    };

}

function renderStatistics() {

    const stats =
        calculateStatistics();

    document.getElementById(
        "lblHighestCategory"
    ).textContent =
        stats.highestCategory.category;

    document.getElementById(
        "lblHighestValue"
    ).textContent =
        formatAmount(
            stats.highestCategory.amount
        );

    document.getElementById(
        "lblLowestCategory"
    ).textContent =
        stats.lowestCategory.category;

    document.getElementById(
        "lblLowestValue"
    ).textContent =
        formatAmount(
            stats.lowestCategory.amount
        );

    document.getElementById(
        "lblYearExpense"
    ).textContent =
        formatAmount(
            stats.totalExpense
        );

    document.getElementById(
        "lblTop3Percent"
    ).textContent =
        stats.top3Percent.toFixed(1) + "%";

}


/* ==========================================================
   TOP 5 EXPENSES
========================================================== */

function calculateTopExpenses() {

    return [...yearlyTransactions]

        .sort(

            (a, b) =>

                Number(b[2]) -

                Number(a[2])

        )

        .slice(0, 5);

}

function renderTopExpenses() {

    const container =
        document.getElementById(
            "topExpenseContainer"
        );

    container.innerHTML = "";

    const rows =
        calculateTopExpenses();

    rows.forEach((row, index) => {

        const amount =
            Number(row[2]) || 0;

        const description =
            row[3];

        const category =
            row[4];

        const mode =
            row[5];

        const medium =
            row[6];

        const date =
            new Date(row[1]);

        container.innerHTML += `

<div class="top-expense-item">

    <div class="rank">

        ${index + 1}

    </div>

    <div class="description">

        ${description}

    </div>

    <div class="category">

        <i class="fa-solid ${getCategoryIcon(category)}"></i>

        ${category}

    </div>

    <div class="expense-meta">

        ${mode}

        ${medium ? "&nbsp;•&nbsp;" + medium : ""}

    </div>

    <div class="expense-date">

        ${date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short"
            }
        )}

    </div>

    <div class="amount">

        ${formatAmount(amount)}

    </div>

</div>

`;

    });

}
/* ==========================================================
   TOP CATEGORY CHART DATA
========================================================== */

function calculateTopCategoryData() {

    const rows =
        calculateCategorySummary()
            .slice(0, 7);

    return {

        labels:
            rows.map(r => r.category),

        values:
            rows.map(r => r.amount)

    };

}


/* ==========================================================
   CATEGORY DOUGHNUT CHART
========================================================== */

function renderCategoryChart() {

    const data =
        calculateTopCategoryData();

    const canvas =
        document.getElementById(
            "yearCategoryChart"
        );

    if (!canvas)
        return;

    if (yearlyCategoryChart) {

        yearlyCategoryChart.destroy();

    }

    yearlyCategoryChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels:
                    data.labels,

                datasets: [{

                    data:
                        data.values,

                    backgroundColor:
                        CHART_COLORS.slice(
                            0,
                            data.labels.length
                        ),

                    borderColor: "#ffffff",

                    borderWidth: 2,

                    hoverOffset: 10

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "58%",

                plugins: {

                    legend: {

                        position: "right",

                        labels: {

                            boxWidth: 12,

                            font: {
                                size: 11
                            }

                        }

                    },

                    datalabels: {

                        color: "#fff",

                        font: {

                            weight: "bold",

                            size: 11

                        },

                        formatter: (value, context) => {

                            const dataset =
                                context.chart.data.datasets[0].data;

                            const total =
                                dataset.reduce((a, b) => a + b, 0);

                            const percent =
                                value * 100 / total;

                            return percent >= 5

                                ? percent.toFixed(1) + "%"

                                : "";

                        }

                    }

                }

            }

        });

}


/* ==========================================================
   YEARLY BAR CHART DATA
========================================================== */

function calculateYearlyChartData() {

    const totals =
        calculateMonthlyTotals();

    return {

        labels:
            Object.keys(totals),

        values:
            Object.values(totals)

    };

}


/* ==========================================================
   YEARLY BAR CHART
========================================================== */

function renderYearExpenseChart() {

    const data =
        calculateYearlyChartData();

    const canvas =
        document.getElementById(
            "yearExpenseChart"
        );

    if (!canvas)
        return;

    if (yearlyExpenseChart) {

        yearlyExpenseChart.destroy();

    }

    yearlyExpenseChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels:
                    data.labels,

                datasets: [{

                    label:
                        "Expense",

                    data:
                        data.values,

                    borderRadius: 10,

                    backgroundColor:
                        "#2563eb"

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: false

                    },

                    tooltip: {

                        callbacks: {

                            label: ctx =>

                                formatAmount(
                                    ctx.raw
                                )

                        }

                    },

                    datalabels: {

                        color: "#ffffff",

                        anchor: "end",

                        align: "start",

                        font: {

                            weight: "bold",

                            size: 11

                        },

                        formatter: value =>

                            "₹" +

                            Number(value)

                                .toLocaleString(

                                    "en-IN",

                                    {

                                        maximumFractionDigits: 0

                                    }

                                )

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