document.addEventListener("headerLoaded", async () => {

    loadMasters();

    setToday();

    await loadTransactionForEdit();

    document
        .getElementById("expenseForm")
        .addEventListener("submit", saveData);

});

function loadMasters() {
    showLoading()
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
    hideLoading()
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
    showLoading();
    e.preventDefault();

    const transactionId =
        document.getElementById("txtTransactionId").value;

    const amount =
        document.getElementById("txtAmount").value;

    const description =
        document.getElementById("txtDescription").value;

	const category =
		document.getElementById("cmbCategory").value;

	const mode =
		document.getElementById("cmbMode").value;
	
    if (!amount || !description) {

        showMessage(
            "Amount and Description required",
            "red"
        );

        return;
    }

    const selectedDate =
    document.getElementById("txtDate").value;

		// selectedDate = 2026-06-03

		const parts = selectedDate.split("-");

		const year = parseInt(parts[0]);
		const monthNo = parseInt(parts[1]);

		const monthNames = [
			"Jan","Feb","Mar","Apr","May","Jun",
			"Jul","Aug","Sep","Oct","Nov","Dec"
		];

		const month =
			monthNames[monthNo - 1] +
			"-" +
			year.toString().substring(2);

		const fy =
			monthNo >= 4
			? "FY" + year
			: "FY" + (year - 1);

	
    const data = {

        id: transactionId,

        date: selectedDate,

        amount:

        amount,

        description:

        description,

        category:

        document.getElementById("cmbCategory").value,

        mode:

        document.getElementById("cmbMode").value,

        paymentMedium:

        document.getElementById("cmbPayment").value,

        remarks:

        document.getElementById("txtRemarks").value,

        createdOn:
		new Date().toLocaleString("en-IN"),

		updatedOn:
		new Date().toLocaleString("en-IN")
    };

	if(amount <= 0){
		alert("Amount should be greater than zero.");
		return;
	}

	if(description.trim() === ""){
		alert("Please enter description.");
		return;
	}

	if(category === ""){
		alert("Please select category.");
		return;
	}

	if(mode === ""){
		alert("Please select mode.");
		return;
	}

    try {


        let result;

        const transactionId =
            document.getElementById("txtTransactionId").value;

        if (transactionId) {

            data.id = transactionId;

            result =
                await updateTransaction(data);

        }
        else {

            result =
                await saveTransaction(data);

        }
		
			console.log(data);
        if (result.success) {

            showMessage(
                "Transaction Saved",
                "green"
            );

            document
                .getElementById("expenseForm")
                .reset();

            setToday();
			loadMasters(); // reload dropdowns if reset clears them

			document
				.getElementById("txtAmount")
				.focus();

            await refreshExpenseCache(false);
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
    hideLoading();
}

async function loadTransactionForEdit() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id") ||
        params.get("ID");

    console.log("ID=", id);

    if (!id)
        return;

    try {

        showLoading();

        const result =
            await getTransactionById(id);

        console.log(result);
            
        if (!result.success)
            return;

        const row = result.data;

        document.getElementById("txtTransactionId").value = row[0];

        document.getElementById("lblTransactionId").textContent = row[0];

        document.getElementById("transactionInfo").style.display = "block";

        document.title = "Edit Transaction";
        
        document.body.setAttribute("data-title", "Edit Transaction");
        document.body.setAttribute("data-subtitle", "Edit Existing Transaction");

        refreshHeader();

        document.body.dataset.title = "Edit Transaction";

        document.querySelector(".save-btn").innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Update Transaction';

        const dt = new Date(row[1]);

        document.getElementById("txtDate").value =
            dt.toISOString().split("T")[0];

        document.getElementById(
            "txtAmount"
        ).value = row[2];

        document.getElementById(
            "txtDescription"
        ).value = row[3];

        document.getElementById(
            "cmbCategory"
        ).value = row[4];

        document.getElementById(
            "cmbMode"
        ).value = row[5];

        document.getElementById(
            "cmbPayment"
        ).value = row[6];

        document.getElementById(
            "txtRemarks"
        ).value = row[7];

    }

    catch (err) {

        console.error(err);

    }

    finally {

        hideLoading();

    }
}

