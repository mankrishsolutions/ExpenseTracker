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

    const response =
        await fetch(headerPath);

    container.innerHTML =
        await response.text();

    configureHeader(isRootPage);

    const btnRefresh =
        document.getElementById(
            "btnRefresh"
        );

    if (btnRefresh) {

        btnRefresh.addEventListener(
            "click",
            refreshCurrentPageData
        );

    }

    // Notify pages that header is ready
    document.dispatchEvent(
        new CustomEvent("headerLoaded")
    );

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

        // Hide Month dropdown on Add page
        if (window.location.pathname.toLowerCase().includes("add.html")) {

            const monthDiv = document.querySelector(".header-right");

            if (monthDiv) {
                monthDiv.style.display = "none";
            }
        }
    }
);

function refreshHeader() {

    document.title = document.body.dataset.title || "";

    configureHeader(
        location.pathname.endsWith("index.html") ||
        location.pathname.endsWith("/ExpenseTracker/") ||
        location.pathname.endsWith("/")
    );
}