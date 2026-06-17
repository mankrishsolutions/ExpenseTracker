
function showMessage(msg, color) {

    const box =
        document.getElementById("msgBox");

    box.style.color =
        color;

    box.innerHTML =
        msg;
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function getExpenseMonth(dateObj) {

    let month =
        dateObj.getMonth();

    let year =
        dateObj.getFullYear();

    if (dateObj.getDate() <= 6) {

        month--;

        if (month < 0) {

            month = 11;
            year--;
        }
    }

    const monthNames = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    return (
        monthNames[month] +
        "-" +
        year
    );
}

function sortExpenseMonths(months) {

    const monthMap = {

        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11
    };

    return [...months].sort(
        (a, b) => {

            const [m1, y1] =
                a.split("-");

            const [m2, y2] =
                b.split("-");

            const d1 =
                new Date(
                    Number(y1),
                    monthMap[m1],
                    1
                );

            const d2 =
                new Date(
                    Number(y2),
                    monthMap[m2],
                    1
                );

            return d1 - d2;
        }
    );
}

function populateMonths(
    transactions,
    adjustments,
    selectedValue = null
) {

    const cmb =
        document.getElementById(
            "cmbMonth"
        );

    if (!cmb)
        return;

    const months =
        new Set();

    transactions.forEach(row => {

        months.add(
            getExpenseMonth(
                new Date(row[1])
            )
        );

    });

    adjustments.forEach(row => {

        months.add(
            getExpenseMonth(
                new Date(row[1])
            )
        );

    });

    const sortedMonths =
        sortExpenseMonths(
            Array.from(months)
        );

    cmb.innerHTML = "";

    sortedMonths.forEach(month => {

        cmb.innerHTML +=
            `<option value="${month}">
                ${month}
            </option>`;
    });

    if (selectedValue) {

        cmb.value =
            selectedValue;

    } else {

        cmb.value =
            sortedMonths[
            sortedMonths.length - 1
            ];
    }
}