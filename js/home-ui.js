/* ==========================================================
   HOME PAGE UI HELPERS  (index.html only)
   ----------------------------------------------------------
   - Light / Dark theme switch (remembered in this browser)
   - Month stepper  ‹  Oct-2026  ›   around the month dropdown
   - "Add expense" button in the top row
   - Tooltips for the navigation icons
   This file only changes how the page looks. It does not touch
   any calculation or data.
========================================================== */

(function () {

    const THEME_KEY = "expenseTheme";
    const root = document.documentElement;

    function getTheme() {
        return root.getAttribute("data-theme") === "light"
            ? "light"
            : "dark";
    }

    function setTheme(theme, remember) {

        root.setAttribute("data-theme", theme);

        if (remember) {
            try {
                localStorage.setItem(THEME_KEY, theme);
            }
            catch (e) { /* private mode - ignore */ }
        }

        const meta = document.getElementById("metaThemeColor");

        if (meta) {
            meta.setAttribute(
                "content",
                theme === "light" ? "#F4F5FB" : "#0B0F23"
            );
        }

        refreshThemeButton();
    }

    function refreshThemeButton() {

        const btn = document.getElementById("btnTheme");

        if (!btn) return;

        const isDark = getTheme() === "dark";

        // The icon shows what you will switch TO
        btn.innerHTML =
            '<i class="fa-solid ' +
            (isDark ? "fa-sun" : "fa-moon") +
            '"></i>';

        const label =
            isDark
                ? "Switch to light theme"
                : "Switch to dark theme";

        btn.title = label;
        btn.setAttribute("aria-label", label);
    }

    function buildStepper(right) {

        const select = document.getElementById("cmbMonth");

        if (!select) return;

        const wrap = document.createElement("div");
        wrap.className = "hp-stepper";

        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "hp-step-btn";
        prev.title = "Previous month";
        prev.setAttribute("aria-label", "Previous month");
        prev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

        const next = document.createElement("button");
        next.type = "button";
        next.className = "hp-step-btn";
        next.title = "Next month";
        next.setAttribute("aria-label", "Next month");
        next.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

        right.insertBefore(wrap, select);

        wrap.appendChild(prev);
        wrap.appendChild(select);
        wrap.appendChild(next);

        function update() {
            prev.disabled = select.selectedIndex <= 0;
            next.disabled =
                select.selectedIndex < 0 ||
                select.selectedIndex >= select.options.length - 1;
        }

        function move(step) {

            const index = select.selectedIndex + step;

            if (index < 0 || index >= select.options.length) return;

            select.selectedIndex = index;

            // The dashboard and transactions scripts listen for "change"
            select.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            update();
        }

        prev.addEventListener("click", () => move(-1));
        next.addEventListener("click", () => move(1));

        select.addEventListener("change", update);

        // Months are loaded after the header, so watch the dropdown
        new MutationObserver(update)
            .observe(select, { childList: true });

        update();
    }

    document.addEventListener("headerLoaded", () => {

        const right = document.querySelector(".header-right");

        if (right) {

            buildStepper(right);

            // Theme switch
            const theme = document.createElement("button");
            theme.type = "button";
            theme.id = "btnTheme";
            theme.className = "hp-icon-btn";
            theme.addEventListener(
                "click",
                () => setTheme(getTheme() === "dark" ? "light" : "dark", true)
            );
            right.appendChild(theme);

            // Add expense (laptop only - phone uses the bottom bar)
            const add = document.createElement("a");
            add.className = "hp-add-btn";
            add.href = "pages/add.html";
            add.innerHTML =
                '<i class="fa-solid fa-plus"></i> Add expense';
            right.appendChild(add);
        }

        refreshThemeButton();

        // Tooltips for the icon-only navigation
        const names = {
            "index.html": "Home",
            "add.html": "Add expense",
            "analytics.html": "Reports",
            "yearly.html": "Yearly"
        };

        document
            .querySelectorAll(".bottom-nav a")
            .forEach(link => {

                const name = names[link.dataset.page];

                if (name) {
                    link.title = name;
                    link.setAttribute("aria-label", name);
                }
            });
    });

    // Keep the browser colour in sync on first load
    document.addEventListener("DOMContentLoaded", () => {
        setTheme(getTheme(), false);
    });

})();
