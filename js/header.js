async function loadHeader() {


    const container =
        document.getElementById(
            "headerContainer"
        );

    if (!container) return;

    const isRootPage =
        location.pathname.endsWith("index.html")
        || location.pathname.endsWith("/ExpenseTracker/")
        || location.pathname.endsWith("/");

    const headerPath =
        isRootPage
            ? "components/header.html"
            : "../components/header.html";

    //console.log("Header JS Loaded");
    //console.log("Header Path:", headerPath);


    const response =
        await fetch(headerPath);

    //console.log("Response:", response.status);

    container.innerHTML =
        await response.text();

    configureHeader(isRootPage);

    //populateMonths();
}

function configureHeader(isHomePage) {

    const backBtn =
        document.getElementById(
            "btnBack"
        );

    if (isHomePage && backBtn) {

        backBtn.style.display =
            "none";
    }

    const title =
        document.body.dataset.title;

    const subtitle =
        document.body.dataset.subtitle;

    if (title) {

        document.getElementById(
            "pageTitle"
        ).textContent = title;
    }

    if (subtitle) {

        document.getElementById(
            "pageSubTitle"
        ).textContent = subtitle;
    }
}

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadHeader();

    }
);
