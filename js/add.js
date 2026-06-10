document.addEventListener("DOMContentLoaded", () => {

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

        const result =
            await saveTransaction(data);
		
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
