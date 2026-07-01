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

		<a href="pages/entries.html"
		   data-page="entries.html">

			<i class="fa-solid fa-list"></i>

		</a>

		<a href="pages/yearly.html"
		   data-page="yearly.html">

			<i class="fa-solid fa-chart-column"></i>

		</a>

		<a href="pages/more.html"
		   data-page="more.html">

			<i class="fa-solid fa-gear"></i>

		</a>

	` : `

		<a href="../index.html"
		   data-page="index.html">

			<i class="fa-solid fa-house"></i>

		</a>

		<a href="add.html"
		   data-page="add.html"
		   class="add-menu">

			<i class="fa-solid fa-plus"></i>

		</a>

		<a href="entries.html"
		   data-page="entries.html">

			<i class="fa-solid fa-list"></i>

		</a>

		<a href="monthly.html"
		   data-page="monthly.html">

			<i class="fa-solid fa-calendar"></i>

		</a>

		<a href="yearly.html"
		   data-page="yearly.html">

			<i class="fa-solid fa-chart-column"></i>

		</a>

		<a href="more.html"
		   data-page="more.html">

			<i class="fa-solid fa-gear"></i>

		</a>

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