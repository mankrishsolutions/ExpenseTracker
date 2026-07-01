async function saveTransaction(data) {

    const qs = new URLSearchParams({

        action: "save",

        id: data.id,
        date: data.date,
        amount: data.amount,
        description: data.description,
        category: data.category,
        mode: data.mode,
        paymentMedium: data.paymentMedium,
        remarks: data.remarks,
        createdOn: data.createdOn,
        updatedOn: data.updatedOn

    });

    const response = await fetch(
        CONFIG.apiUrl + "?" + qs.toString()
    );

    return await response.json();
}

async function getAllTransactions() {

    const response = await fetch(
        CONFIG.apiUrl +
        "?action=getall"
    );

    const result =
        await response.json();

    if(!result.success)
        throw result.message;

    return result.data;
}

async function getTransactions() {

    const response =
        await fetch(
            CONFIG.apiUrl +
            "?action=getall"
        );

    return await response.json();
}

async function deleteTransaction(id) {
    showLoading();
    try {
        const response = await fetch(
            CONFIG.apiUrl +
            "?action=delete&id=" +
            encodeURIComponent(id)
        );

        const result = await response.json();
        hideLoading();
        return result;
    }
    catch (err) {
        hideLoading();

        console.error(err);
        return {
            success: false
        };
    }
}

async function getTransactionById(id) {

    const response =
        await fetch(

            CONFIG.apiUrl +

            "?action=getbyid&id=" +

            encodeURIComponent(id)

        );

    return await response.json();
}

async function getMonthlyClosing() {

    const response =
        await fetch(
            CONFIG.apiUrl +
            "?action=getmonthlyclosing"
        );

    const result =
        await response.json();

    if (!result.success)
        throw result.message;

    return result.data;
}

async function getAdjustments() {

    const response =
        await fetch(
            CONFIG.apiUrl +
            "?action=getadjustments"
        );

    const result =
        await response.json();

    if (!result.success)
        throw result.message;

    return result.data;
}

async function updateTransaction(data) {

    const qs = new URLSearchParams({

        action: "update",

        id: data.id,
        date: data.date,
        amount: data.amount,
        description: data.description,
        category: data.category,
        mode: data.mode,
        paymentMedium: data.paymentMedium,
        remarks: data.remarks,
        updatedOn: data.updatedOn

    });

    const response =
        await fetch(
            CONFIG.apiUrl + "?" + qs.toString()
        );

    return await response.json();
}




