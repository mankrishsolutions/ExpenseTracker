# Expense Tracker - cleanup + "All months"

## New: All months
The month dropdown on the home page now starts with **All months**.
- Total expense, Cash / Online / Card split, categories, Recent and "All transactions" cover every month.
- Account tiles show the balance after the last month. OB is the opening balance of the very first month,
  so the change under each tile is the movement over the whole period.
- The < > arrows move through the list (All months is the first stop). The page still opens on the latest month.

## Files: before -> after
JS (14 -> 8):  config.js (settings + lists + accounts), core.js (data, cache, balances), shell.js (header, navigation, theme),
               home.js, add.js, analytics.js, yearly.js, charts.js (chart theme).
CSS (4 files kept): app.css (shared + home), analytics.css, yearly.css, add.css. About 1,100 unused lines removed.
Removed: home.js (empty), more.html, testread.html, components/header.html (built in shell.js),
         3 copies of loading.gif (replaced by a CSS spinner), header.js, navigation.js, home-ui.js,
         dashboard.js, transactions.js, common.js, masterdata.js.
Kept: web.config (IIS), favicon.ico, AppScript.txt (unchanged - paste into Apps Script only if you ever change it).

## Code quality
- Balance rules are exactly the same (verified month by month against the old files).
- Account tiles are generated from the ACCOUNTS list in config.js: a new account = one line.
- One month list, one loading overlay, one showMessage, no duplicate functions, no dead code.
- Text from the sheet is escaped before it is shown.
- Fixed: home page could show one month's name with another month's data when an Adjustment month had no transactions.
- Fixed: refresh / delete no longer jumps back to the latest month.
- Fixed: Add page stuck on the loading spinner after a validation message; "today" now uses your local date;
  edit page date no longer shifts by a day; dropdowns no longer duplicate after saving.
