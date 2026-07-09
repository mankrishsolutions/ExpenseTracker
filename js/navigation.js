document.addEventListener("headerLoaded", () => {

    // Prevent duplicate nav
    if (document.querySelector(".bottom-nav")) return;

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const isHomePage =
        currentPage === "" ||
        currentPage === "index.html";

    // Relative path prefix
    const basePath = isHomePage ? "" : "../";

    const nav = document.createElement("nav");
    nav.className = "bottom-nav";

    nav.innerHTML = `
        <a href="${basePath}index.html"
           data-page="index.html">
            <i class="fa-solid fa-house"></i>
        </a>

        <a href="${basePath}pages/add.html"
           data-page="add.html"
           class="add-menu">
            <i class="fa-solid fa-plus"></i>
        </a>

        <a href="${basePath}pages/analytics.html"
           data-page="analytics.html">
            <i class="fa-solid fa-chart-column"></i>
        </a>

        <a href="${basePath}pages/more.html"
           data-page="more.html">
            <i class="fa-solid fa-gear"></i>
        </a>
    `;

    document.body.appendChild(nav);

    nav.querySelectorAll("a").forEach(link => {
        if (link.dataset.page === currentPage) {
            link.classList.add("active");
        }
    });

});