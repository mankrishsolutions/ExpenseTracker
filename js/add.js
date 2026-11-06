/* ==========================================================
   ADD / EDIT TRANSACTION  (pages/add.html)
   Open with  add.html?id=TXN...  to edit an existing entry.
========================================================== */

const $ = id => document.getElementById(id);

document.addEventListener("headerLoaded", async () => {

    fillSelect("cmbCategory", Categories);
    fillSelect("cmbMode", Modes);
    fillSelect("cmbPayment", PaymentMediums);

    setToday();

    await loadTransactionForEdit();

    $("expenseForm").addEventListener("submit", saveData);
});

function fillSelect(id, items) {

    $(id).innerHTML = "";

    items.forEach(item => $(id).add(new Option(item, item)));
}

/** yyyy-mm-dd of a date, in the local time zone */
function toInputDate(date) {

    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return local.toISOString().split("T")[0];
}

function setToday() {

    $("txtDate").value = toInputDate(new Date());
}

async function saveData(e) {

    e.preventDefault();

    const transactionId = $("txtTransactionId").value;
    const amount = $("txtAmount").value;
    const description = $("txtDescription").value.trim();

    if (!amount || Number(amount) <= 0) {
        showMessage("Amount should be greater than zero", "red");
        return;
    }

    if (!description) {
        showMessage("Please enter a description", "red");
        return;
    }

    const stamp = new Date().toLocaleString("en-IN");

    const data = {
        id: transactionId,
        date: $("txtDate").value,
        amount,
        description,
        category: $("cmbCategory").value,
        mode: $("cmbMode").value,
        paymentMedium: $("cmbPayment").value,
        remarks: $("txtRemarks").value,
        createdOn: stamp,
        updatedOn: stamp
    };

    try {

        showLoading();

        const result = transactionId
            ? await updateTransaction(data)
            : await saveTransaction(data);

        if (!result.success) {
            showMessage(result.message, "red");
            return;
        }

        showMessage("Transaction Saved", "green");

        $("expenseForm").reset();
        fillSelect("cmbCategory", Categories);
        fillSelect("cmbMode", Modes);
        fillSelect("cmbPayment", PaymentMediums);
        setToday();
        $("txtAmount").focus();

        await refreshExpenseCache(false);
    }
    catch (err) {

        showMessage(err, "red");
    }
    finally {

        hideLoading();
    }
}

async function loadTransactionForEdit() {

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || params.get("ID");

    if (!id) return;

    try {

        showLoading();

        const result = await getTransactionById(id);

        if (!result.success) return;

        const row = result.data;    // [id, date, amount, description, category, mode, payment, remarks]

        $("txtTransactionId").value = row[0];
        $("lblTransactionId").textContent = row[0];
        $("transactionInfo").style.display = "block";

        document.body.dataset.title = "Edit Transaction";
        document.body.dataset.subtitle = "Edit Existing Transaction";
        refreshHeader();

        document.querySelector(".save-btn").innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Update Transaction';

        $("txtDate").value = /^\d{4}-\d{2}-\d{2}$/.test(row[1])
            ? row[1]
            : toInputDate(new Date(row[1]));
        $("txtAmount").value = row[2];
        $("txtDescription").value = row[3];
        $("cmbCategory").value = row[4];
        $("cmbMode").value = row[5];
        $("cmbPayment").value = row[6];
        $("txtRemarks").value = row[7];
    }
    catch (err) {

        console.error(err);
    }
    finally {

        hideLoading();
    }
}
