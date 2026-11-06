/* ==========================================================
   ANALYTICS PAGE - CHART COLOURS THAT FOLLOW THE THEME
   ----------------------------------------------------------
   Display only. analytics.js is not changed: this file runs
   before it and only sets Chart.js colours / fonts so the
   charts read well in both the dark and the light theme.
   No numbers, filters or data are touched here.
========================================================== */

(function () {

    if (typeof Chart === "undefined") return;

    function css(name) {
        return getComputedStyle(document.body)
            .getPropertyValue(name)
            .trim();
    }

    /* ---------- global defaults (text, grid lines, font) ---------- */

    function applyDefaults() {

        Chart.defaults.color = css("--mu") || "#8D95C4";
        Chart.defaults.borderColor = css("--line") || "#232A52";

        // grid lines and axis lines
        const line = css("--line") || "#232A52";

        if (Chart.defaults.scale) {

            Chart.defaults.scale.grid =
                Object.assign({}, Chart.defaults.scale.grid, { color: line });

            Chart.defaults.scale.border =
                Object.assign({}, Chart.defaults.scale.border, { color: line });
        }

        Chart.defaults.font.family =
            '"Inter", "Segoe UI", system-ui, sans-serif';
        Chart.defaults.font.size = 12;
    }

    applyDefaults();


    /* ---------- per-chart tweaks, applied on every update ---------- */

    const themeTweaks = {

        id: "themeTweaks",

        beforeUpdate(chart) {

            const type = chart.config.type;
            const options = chart.options || {};

            // Slice borders match the card instead of staying white
            if (type === "doughnut" || type === "pie" || type === "polarArea") {

                chart.data.datasets.forEach(ds => {
                    ds.borderColor = css("--panel");
                });
            }

            // Radar-style grid of the balance chart
            if (type === "polarArea" &&
                options.scales &&
                options.scales.r) {

                const r = options.scales.r;

                if (r.grid) r.grid.color = css("--line");
                if (r.angleLines) r.angleLines.color = css("--line");
            }

            // Grid and axis lines (set on each chart so a theme switch applies at once)
            if (options.scales) {

                const line = css("--line");

                Object.keys(options.scales).forEach(key => {

                    if (key === "r") return;

                    const scale = options.scales[key];

                    scale.grid =
                        Object.assign({}, scale.grid, { color: line });

                    scale.border =
                        Object.assign({}, scale.border, { color: line });
                });
            }

            // Bar value labels: keep them inside / beside the bars
            if (type === "bar" &&
                options.plugins &&
                options.plugins.datalabels) {

                const dl = options.plugins.datalabels;

                if (options.indexAxis === "y") {

                    // horizontal bars: label just after the end of the bar
                    dl.anchor = "end";
                    dl.align = "end";
                    dl.color = css("--tx");
                }
                else {

                    // vertical bars: read the label upwards inside the bar
                    dl.rotation = -90;
                }
            }

            // Value labels sitting on top of the trend line
            if (type === "line" &&
                options.plugins &&
                options.plugins.datalabels &&
                options.plugins.datalabels.display !== false) {

                options.plugins.datalabels.color = css("--tx");
            }
        }
    };

    Chart.register(themeTweaks);


    /* ---------- "Total" text in the middle of the doughnut ----------
       analytics.js draws it with fixed dark colours. The same drawing
       is repeated here with theme colours; analytics.js registers its
       plugin later and this wrapper swaps the colours in.            */

    const originalRegister = Chart.register.bind(Chart);

    Chart.register = function () {

        const items = Array.prototype.slice.call(arguments)
            .map(item => {

                if (item && item.id === "doughnutCenterText") {

                    return Object.assign({}, item, {

                        afterDraw(chart) {

                            if (chart.config.type !== "doughnut") return;

                            const area = chart.chartArea;

                            const total = chart.data.datasets[0].data
                                .reduce((a, b) => a + b, 0);

                            const x = (area.left + area.right) / 2;
                            const y = (area.top + area.bottom) / 2;

                            const ctx = chart.ctx;
                            const family = Chart.defaults.font.family;

                            ctx.save();
                            ctx.textAlign = "center";

                            ctx.fillStyle = css("--mu");
                            ctx.font = "600 12px " + family;
                            ctx.fillText("Total", x, y - 8);

                            ctx.fillStyle = css("--tx");
                            ctx.font = "bold 18px " + family;
                            ctx.fillText(formatAmount(total), x, y + 16);

                            ctx.restore();
                        }
                    });
                }

                return item;
            });

        return originalRegister.apply(null, items);
    };


    /* ---------- re-colour when the theme switch is used ---------- */

    document.addEventListener("themechange", () => {

        applyDefaults();

        Object.values(Chart.instances).forEach(chart => {
            chart.update();
        });
    });

})();
