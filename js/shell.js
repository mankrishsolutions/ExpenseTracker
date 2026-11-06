/* ==========================================================
   SHELL  -  the frame around every page
   ----------------------------------------------------------
   - Top row: back arrow, title, month arrows, refresh, theme, Add
   - Navigation: side rail (laptop) / bottom bar (phone)
   - Light / dark theme (remembered in this browser)
   When the frame is ready it fires  "headerLoaded"  and each
   page script starts from that event.
========================================================== */

(function () {

    const THEME_KEY = "expenseTheme";
    const root = document.documentElement;

    // index.html lives in the root, every other page in /pages/
    const BASE = location.pathname.indexOf("/pages/") !== -1 ? "../" : "";
    const PAGE = location.pathname.split("/").pop().toLowerCase() || "index.html";
    const IS_HOME = PAGE === "index.html";
    const IS_ADD = PAGE === "add.html";


    /* ======================================================
       THEME
    ====================================================== */

    function getTheme() {

        return root.getAttribute("data-theme") === "light" ? "light" : "dark";
    }

    function setTheme(theme, remember) {

        root.setAttribute("data-theme", theme);

        if (remember) {
            try { localStorage.setItem(THEME_KEY, theme); }
            catch (e) { /* private mode - ignore */ }
        }

        const meta = document.getElementById("metaThemeColor");

        if (meta) {
            meta.setAttribute("content", theme === "light" ? "#F4F5FB" : "#0B0F23");
        }

        refreshThemeButton();

        // Pages with charts re-colour them when this fires
        document.dispatchEvent(new CustomEvent("themechange"));
    }

    function refreshThemeButton() {

        const btn = document.getElementById("btnTheme");

        if (!btn) return;

        const toLight = getTheme() === "dark";
        const label = toLight ? "Switch to light theme" : "Switch to dark theme";

        // The icon shows what you will switch TO
        btn.innerHTML = '<i class="fa-solid ' + (toLight ? "fa-sun" : "fa-moon") + '"></i>';
        btn.title = label;
        btn.setAttribute("aria-label", label);
    }


    /* ======================================================
       TOP ROW
    ====================================================== */

    function buildHeader(container) {

        const showMonth = document.body.dataset.showMonth !== "false";

        container.innerHTML = `
            <header class="dashboard-header">

                <a href="${BASE}index.html" id="btnBack" class="back-btn"
                   ${IS_HOME ? 'style="display:none"' : ""}>
                    <i class="fa-solid fa-arrow-left"></i>
                </a>

                <div class="header-center">
                    <h1 id="pageTitle"></h1>
                    <span id="pageSubTitle" class="fy-badge"></span>
                    <div id="msgBox"></div>
                </div>

                <div class="header-right">
                    ${showMonth ? '<select id="cmbMonth" aria-label="Month"></select>' : ""}
                    ${showMonth
                        ? `<button id="btnRefresh" class="header-refresh" type="button"
                                   title="Refresh Latest Data">
                               <i class="fa-solid fa-rotate-right"></i>
                           </button>`
                        : ""}
                </div>

            </header>`;

        refreshHeader();

        const refresh = document.getElementById("btnRefresh");

        if (refresh) refresh.addEventListener("click", refreshCurrentPageData);
    }

    /** Sets the page title / subtitle from  data-title  and  data-subtitle */
    window.refreshHeader = function () {

        const title = document.body.dataset.title;
        const subtitle = document.body.dataset.subtitle;

        document.title = title || document.title;

        const t = document.getElementById("pageTitle");
        const s = document.getElementById("pageSubTitle");

        if (t && title) t.textContent = title;
        if (s && subtitle) s.textContent = subtitle;
    };

    /** Month (or financial year) dropdown with  <  >  arrows around it */
    function buildStepper(right) {

        const select =
            document.getElementById("cmbMonth") ||
            document.getElementById("cmbFinancialYear");

        if (!select) return;

        const unit = select.id === "cmbMonth" ? "month" : "year";

        const wrap = document.createElement("div");
        wrap.className = "hp-stepper";

        const makeButton = (icon, label) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "hp-step-btn";
            b.title = label;
            b.setAttribute("aria-label", label);
            b.innerHTML = '<i class="fa-solid ' + icon + '"></i>';
            return b;
        };

        const prev = makeButton("fa-chevron-left", "Previous " + unit);
        const next = makeButton("fa-chevron-right", "Next " + unit);

        right.insertBefore(wrap, select);
        wrap.append(prev, select, next);

        const update = () => {
            prev.disabled = select.selectedIndex <= 0;
            next.disabled =
                select.selectedIndex < 0 ||
                select.selectedIndex >= select.options.length - 1;
        };

        const move = step => {

            const index = select.selectedIndex + step;

            if (index < 0 || index >= select.options.length) return;

            select.selectedIndex = index;

            // page scripts listen for "change"
            select.dispatchEvent(new Event("change", { bubbles: true }));

            update();
        };

        prev.addEventListener("click", () => move(-1));
        next.addEventListener("click", () => move(1));
        select.addEventListener("change", update);

        // The options are filled after the header is built, so watch for that
        new MutationObserver(update).observe(select, { childList: true });

        update();
    }

    function buildRightButtons(right) {

        const theme = document.createElement("button");
        theme.type = "button";
        theme.id = "btnTheme";
        theme.className = "hp-icon-btn";
        theme.addEventListener(
            "click",
            () => setTheme(getTheme() === "dark" ? "light" : "dark", true)
        );
        right.appendChild(theme);

        // "Add expense" button (laptop only, the phone uses the bottom bar)
        if (!IS_ADD) {

            const add = document.createElement("a");
            add.className = "hp-add-btn";
            add.href = BASE + "pages/add.html";
            add.innerHTML = '<i class="fa-solid fa-plus"></i> Add expense';
            right.appendChild(add);
        }
    }


    /* ======================================================
       NAVIGATION
    ====================================================== */

    function buildNav() {

        if (document.querySelector(".bottom-nav")) return;

        const items = [
            { page: "index.html",     icon: "fa-house",        name: "Home" },
            { page: "add.html",       icon: "fa-plus",         name: "Add expense", cls: "add-menu" },
            { page: "analytics.html", icon: "fa-chart-column", name: "Reports" },
            { page: "yearly.html",    icon: "fa-calendar",     name: "Yearly" }
        ];

        const nav = document.createElement("nav");
        nav.className = "bottom-nav";

        nav.innerHTML = items.map(i => {

            const href = BASE + (i.page === "index.html" ? "" : "pages/") + i.page;

            return `<a href="${href}" data-page="${i.page}" title="${i.name}"
                       aria-label="${i.name}"
                       class="${i.cls || ""} ${i.page === PAGE ? "active" : ""}">
                        <i class="fa-solid ${i.icon}"></i>
                    </a>`;
        }).join("");

        document.body.appendChild(nav);
    }


    /* ======================================================
       START
    ====================================================== */

    document.addEventListener("DOMContentLoaded", () => {

        setTheme(getTheme(), false);

        // Most pages get the shared top row; Yearly has its own
        const container = document.getElementById("headerContainer");

        if (container) buildHeader(container);

        const right = document.querySelector(".header-right");

        if (right) {
            buildStepper(right);
            buildRightButtons(right);
        }

        refreshThemeButton();
        buildNav();

        // Tell the page scripts that the frame is ready
        document.dispatchEvent(new CustomEvent("headerLoaded"));
    });

})();
