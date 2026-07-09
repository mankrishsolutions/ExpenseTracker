document.addEventListener("headerLoaded", () => {

	const currentPage =
        window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const isHomePage =
        currentPage === "" ||
        currentPage === "index.html";


    const nav = document.createElement("nav");

    nav.className = "bottom-nav";

    nav.innerHTML = isHomePage ? `
    
		<a href="index.html"
		   data-page="index.html">

			<i class="fa-solid fa-house"></i>

		</a>

		<a href="pages/add.html"
		   data-page="add.html"
		   class="add-menu">

			<i class="fa-solid fa-plus"></i>

		</a>

		<a href="pages/analytics.html"
		   data-page="analytics.html">

			<i class="fa-solid fa-chart-column"></i>

		</a>

		<a href="pages/more.html"
		   data-page="more.html">

			<i class="fa-solid fa-gear"></i>

		</a>

	` : `

	`;

    document.body.appendChild(nav);

    const links =
        nav.querySelectorAll("a");

    links.forEach(link => {

        if (
            link.dataset.page === currentPage
        ) {
            link.classList.add("active");
        }

    });

});