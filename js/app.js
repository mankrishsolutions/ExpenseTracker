document.addEventListener("headerLoaded", () => {

    loadMasters();

    setToday();

    document
        .getElementById("expenseForm")
        .addEventListener("submit", saveData);

});

function loadMasters() {

    fillSelect(
        "cmbCategory",
        Categories
    );

    fillSelect(
        "cmbMode",
        Modes
    );

    fillSelect(
        "cmbPayment",
        PaymentMediums
    );
}

function fillSelect(id, arr) {

    const cmb =
        document.getElementById(id);

    arr.forEach(item => {

        const opt =
            document.createElement("option");

        opt.value = item;

        opt.textContent = item;

        cmb.appendChild(opt);

    });
}

function setToday() {

    document
        .getElementById("txtDate")
        .value =
        new Date()
        .toISOString()
        .split("T")[0];
}

async function saveData(e) {

    e.preventDefault();

    const amount =
        document.getElementById("txtAmount").value;

    const description =
        document.getElementById("txtDescription").value;

    if (!amount || !description) {

        showMessage(
            "Amount and Description required",
            "red"
        );

        return;
    }

    const txnDate =
        new Date(
            document.getElementById("txtDate").value
        );

    const month =
        txnDate.toLocaleString(
            "en-US",
            {
                month: "short"
            }
        ) +
        "-" +
        txnDate
        .getFullYear()
        .toString()
        .substring(2);

    const fy =
        txnDate.getMonth() >= 3
        ? "FY" + (txnDate.getFullYear())
        : "FY" + (txnDate.getFullYear() - 1);

    const data = {

        id:
        "TXN" +
        Date.now(),

        date:
        document.getElementById("txtDate").value,

        amount:

        amount,

        description:

        description,

        category:

        document.getElementById("cmbCategory").value,

        transactionType:

        document.getElementById("cmbTransactionType").value,

        mode:

        document.getElementById("cmbMode").value,

        paymentMedium:

        document.getElementById("cmbPayment").value,

        remarks:

        document.getElementById("txtRemarks").value,

        createdOn:
        new Date().toISOString(),

        updatedOn:
        new Date().toISOString(),

        month:
        month,

        financialYear:
        fy
    };

    try {

        const result =
            await saveTransaction(data);

        if (result.success) {

            showMessage(
                "Transaction Saved",
                "green"
            );

            document
                .getElementById("expenseForm")
                .reset();

            setToday();
        }
        else {

            showMessage(
                result.message,
                "red"
            );
        }

    }
    catch(err) {

        showMessage(
            err,
            "red"
        );
    }
}

function showMessage(msg,color){

    const box =
        document.getElementById("msgBox");

    box.style.color =
        color;

    box.innerHTML =
        msg;
}