/* ==========================================================
   CONFIG  -  the only file you edit for settings and lists
   (API address, dropdown lists, accounts, payment groups)
========================================================== */

const CONFIG = {
    apiUrl:
        "https://script.google.com/macros/s/AKfycbwIIxGSabz1VFJytd4DO-KVMeEOY4up5ldkUiN20gxJzDuCp4KnE76Km47wjikOurt0/exec"
};


/* ---------- Add / Edit page dropdowns ---------- */

const Categories = [
    "Household", "Investment", "Utility", "Grocery", "Vehicle", "CC",
    "Entertainment", "Mobile", "Cricket", "Personal", "Medicies",
    "Policy", "Mandir", "Loan", "School", "Bank"
];

const Modes = [
    "CashOut", "CashIn", "CRHD", "CRAX", "TRHD",
    "TRPN", "TRCASH", "KRHD", "CC", "CC-KiWi"
];

const PaymentMediums = ["Cash", "UPI", "Bank / DC", "KiWi"];


/* ---------- Accounts ----------
   The order here is the order of the tiles on the home page.
   Add a new account here and its tile appears automatically
   (also give it a colour --a-<ID> in css/app.css).            */

const ACCOUNTS = [
    { id: "CRHD",   name: "HDFC" },
    { id: "TRHD",   name: "Trupti HDFC" },
    { id: "TRCASH", name: "Trupti Cash" },
    { id: "KRHD",   name: "Krishna HDFC" },
    { id: "TRPN",   name: "PNB" },
    { id: "CASH",   name: "Cash in hand" },
    { id: "CRAX",   name: "Axis" }
];

const BALANCE_ACCOUNTS = ACCOUNTS.map(a => a.id);

// Names an Adjustment may use as a real account (CC is kept for
// historical adjustments, it has no tile)
const LEDGER_ACCOUNTS = [...BALANCE_ACCOUNTS, "CC"];


/* ---------- Payment type groups (home page "Cash / Online / Card") ---------- */

const PAYMENT_MODE_GROUPS = {
    CASH:   ["CashOut", "TRCASH"],
    ONLINE: ["CRHD", "CRAX", "TRHD", "TRPN", "CC", "CC-KiWi"],
    CARD:   ["CC", "CC-KiWi"]          // Card is part of Online
};
