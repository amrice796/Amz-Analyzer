// AMZ ANALYZER
// Version 1: calculator + saved products
// Live Amazon data will be connected through the secure API backend later.

let currentMode = "Retail Arbitrage";

let currentProduct = {
    title: "No product loaded",
    asin: "—",
    buyBox: 0,
    bsr: null,
    fbaOffers: null,
    fbmOffers: null
};

const STORAGE_KEY = "amz_analyzer_saved";

// -----------------------------
// BASIC HELPERS
// -----------------------------

function money(value) {
    const number = Number(value) || 0;
    return "$" + number.toFixed(2);
}

function percent(value) {
    const number = Number(value) || 0;
    return number.toFixed(1) + "%";
}

function getNumber(id) {
    const element = document.getElementById(id);
    return element ? Number(element.value) || 0 : 0;
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value ?? "";
    }
}

// -----------------------------
// MODE SELECTION
// -----------------------------

function setMode(mode, button) {
    currentMode = mode;

    document.querySelectorAll(".mode").forEach(function (item) {
        item.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    const status = document.getElementById("dataStatus");

    if (status) {
        status.textContent =
            mode + " selected. Amazon live data is not connected yet.";
    }
}

// -----------------------------
// DEMO PRODUCT
// -----------------------------

function loadDemoProduct() {
    currentProduct = {
        title: "Demo Product - 24 Pack Household Item",
        asin: "B0DEMO1234",
        buyBox: 39.99,
        bsr: 18421,
        fbaOffers: 12,
        fbmOffers: 8
    };

    setValue("buyCost", 20.00);
    setValue("sellingPrice", 39.99);
    setValue("shipping", 0);
    setValue("prep", 1.00);

    setValue("referralFee", 15);
    setValue("fbaFee", 5.40);
    setValue("otherFees", 0);

    renderProduct();
    calculate();

    const status = document.getElementById("dataStatus");

    if (status) {
        status.textContent =
            "Demo data loaded. This is NOT live Amazon data.";
    }
}

// -----------------------------
// ASIN EXTRACTION
// -----------------------------

function extractASIN(input) {
    if (!input) {
        return null;
    }

    const value = input.trim();

    // Direct ASIN
    if (/^[A-Z0-9]{10}$/i.test(value)) {
        return value.toUpperCase();
    }

    // Amazon /dp/ASIN URL
    let match = value.match(/\/dp\/([A-Z0-9]{10})/i);

    if (match) {
        return match[1].toUpperCase();
    }

    // Amazon /gp/product/ASIN URL
    match = value.match(/\/gp\/product\/([A-Z0-9]{10})/i);

    if (match) {
        return match[1].toUpperCase();
    }

    return null;
}

// -----------------------------
// PRODUCT ANALYSIS
// -----------------------------

function analyzeProduct() {
    const searchElement = document.getElementById("productSearch");

    if (!searchElement) {
        return;
    }

    const input = searchElement.value.trim();

    if (!input) {
        alert("Enter an ASIN or Amazon product URL.");
        return;
    }

    const asin = extractASIN(input);

    if (!asin) {
        alert(
            "I could not recognize that as an Amazon ASIN or supported Amazon product URL."
        );
        return;
    }

    /*
        IMPORTANT:

        We are NOT pretending this is live Amazon data.

        The next major development step will connect this function
        to Amazon's API through a secure backend.
    */

    currentProduct = {
        title: "Amazon product lookup ready",
        asin: asin,
        buyBox: getNumber("sellingPrice"),
        bsr: null,
        fbaOffers: null,
        fbmOffers: null
    };

    renderProduct();
    calculate();

    const status = document.getElementById("dataStatus");

    if (status) {
        status.textContent =
            "ASIN recognized: " +
            asin +
            ". Live Amazon data connection is not connected yet.";
    }
}

// -----------------------------
// DISPLAY PRODUCT
// -----------------------------

function renderProduct() {
    const productName = document.getElementById("productName");
    const productASIN = document.getElementById("productASIN");
    const buyBox = document.getElementById("buyBox");
    const bsr = document.getElementById("bsr");
    const fbaOffers = document.getElementById("fbaOffers");
    const fbmOffers = document.getElementById("fbmOffers");

    if (productName) {
        productName.textContent = currentProduct.title;
    }

    if (productASIN) {
        productASIN.textContent = currentProduct.asin;
    }

    if (buyBox) {
        buyBox.textContent =
            currentProduct.buyBox > 0
                ? money(currentProduct.buyBox)
                : "—";
    }

    if (bsr) {
        bsr.textContent =
            currentProduct.bsr !== null
                ? Number(currentProduct.bsr).toLocaleString()
                : "—";
    }

    if (fbaOffers) {
        fbaOffers.textContent =
            currentProduct.fbaOffers !== null
                ? currentProduct.fbaOffers
                : "—";
    }

    if (fbmOffers) {
        fbmOffers.textContent =
            currentProduct.fbmOffers !== null
                ? currentProduct.fbmOffers
                : "—";
    }
}

// -----------------------------
// PROFIT CALCULATOR
// -----------------------------

function calculate() {
    const buyCost = getNumber("buyCost");
    const sellingPrice = getNumber("sellingPrice");
    const shipping = getNumber("shipping");
    const prep = getNumber("prep");

    const referralFeePercent = getNumber("referralFee");
    const fbaFee = getNumber("fbaFee");
    const otherFees = getNumber("otherFees");

    const referralFee =
        sellingPrice * (referralFeePercent / 100);

    const totalFees =
        referralFee +
        fbaFee +
        otherFees;

    const profit =
        sellingPrice -
        buyCost -
        shipping -
        prep -
        totalFees;

    const roi =
        buyCost > 0
            ? (profit / buyCost) * 100
            : 0;

    const margin =
        sellingPrice > 0
            ? (profit / sellingPrice) * 100
            : 0;

    const minimumProfit = getNumber("minimumProfit");
    const minimumROI = getNumber("minimumROI");
    const maximumBSR = getNumber("maximumBSR");

    let bsrOK = true;

    if (currentProduct.bsr !== null && maximumBSR > 0) {
        bsrOK = currentProduct.bsr <= maximumBSR;
    }

    /*
        Maximum buy cost:

        Selling price
        - shipping
        - prep
        - Amazon fees
        - desired minimum profit
    */

    const maxBuy =
        sellingPrice -
        shipping -
        prep -
        totalFees -
        minimumProfit;

    // -----------------------------
    // DECISION
    // -----------------------------

    let decision = "SKIP";
    let decisionClass = "skip";

    const meetsMinimums =
        profit >= minimumProfit &&
        roi >= minimumROI &&
        bsrOK;

    const strongDeal =
        profit >= minimumProfit * 1.5 &&
        roi >= minimumROI * 1.5 &&
        bsrOK;

    if (strongDeal) {
        decision = "BUY";
        decisionClass = "buy";
    } else if (meetsMinimums) {
        decision = "MAYBE";
        decisionClass = "maybe";
    }

    // -----------------------------
    // DEAL SCORE
    // -----------------------------

    let profitScore = 0;
    let roiScore = 0;
    let bsrScore = 0;

    if (minimumProfit > 0) {
        profitScore = Math.min(
            50,
            Math.max(
                0,
                (profit / minimumProfit) * 25
            )
        );
    }

    if (minimumROI > 0) {
        roiScore = Math.min(
            30,
            Math.max(
                0,
                (roi / minimumROI) * 15
            )
        );
    }

    if (currentProduct.bsr === null) {
        bsrScore = 10;
    } else if (bsrOK) {
        bsrScore = 20;
    }

    let dealScore = Math.round(
        profitScore +
        roiScore +
        bsrScore
    );

    dealScore = Math.max(
        0,
        Math.min(100, dealScore)
    );

    // -----------------------------
    // REASONS
    // -----------------------------

    let reasons = [];

    if (profit >= minimumProfit) {
        reasons.push(
            "Profit meets your minimum target."
        );
    } else {
        reasons.push(
            "Profit is below your minimum target."
        );
    }

    if (roi >= minimumROI) {
        reasons.push(
            "ROI meets your minimum target."
        );
    } else {
        reasons.push(
            "ROI is below your minimum target."
        );
    }

    if (currentProduct.bsr === null) {
        reasons.push(
            "BSR has not been provided yet."
        );
    } else if (bsrOK) {
        reasons.push(
            "BSR is within your maximum."
        );
    } else {
        reasons.push(
            "BSR is above your maximum."
        );
    }

    updateResult("decision", decision);
    updateResult("dealScore", dealScore + "/100");
    updateResult("profit", money(profit));
    updateResult("roi", percent(roi));
    updateResult("margin", percent(margin));
    updateResult("maxBuy", money(Math.max(0, maxBuy)));

    const reasonsElement =
        document.getElementById("reasons");

    if (reasonsElement) {
        reasonsElement.innerHTML =
            reasons.map(function (reason) {
                return "<div>• " + reason + "</div>";
            }).join("");
    }

    const decisionElement =
        document.getElementById("decision");

    if (decisionElement) {
        decisionElement.className =
            "decision " + decisionClass;
    }

    return {
        buyCost,
        sellingPrice,
        shipping,
        prep,
        referralFeePercent,
        referralFee,
        fbaFee,
        otherFees,
        totalFees,
        profit,
        roi,
        margin,
        maxBuy,
        decision,
        dealScore,
        reasons
    };
}

function updateResult(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

// -----------------------------
// SAVE PRODUCTS
// -----------------------------

function saveProduct() {
    if (
        !currentProduct ||
        !currentProduct.asin ||
        currentProduct.asin === "—"
    ) {
        alert("Load a product before saving it.");
        return;
    }

    const calculation = calculate();

    const savedProduct = {
        title: currentProduct.title,
        asin: currentProduct.asin,
        mode: currentMode,
        product: currentProduct,
        calculation: calculation,
        savedAt: new Date().toISOString()
    };

    let saved = [];

    try {
        saved =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || [];
    } catch (error) {
        saved = [];
    }

    // Remove duplicate ASIN
    saved = saved.filter(function (item) {
        return item.asin !== savedProduct.asin;
    });

    // Put newest item first
    saved.unshift(savedProduct);

    // Keep maximum of 50 saved products
    saved = saved.slice(0, 50);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(saved)
    );

    renderSavedProducts();

    alert("Product saved.");
}

// -----------------------------
// DISPLAY SAVED PRODUCTS
// -----------------------------

function renderSavedProducts() {
    const container =
        document.getElementById("savedProducts");

    if (!container) {
        return;
    }

    let saved = [];

    try {
        saved =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || [];
    } catch (error) {
        saved = [];
    }

    if (saved.length === 0) {
        container.innerHTML =
            "<p>No saved products yet.</p>";
        return;
    }

    container.innerHTML = saved.map(function (item, index) {
        const calc = item.calculation || {};

        return `
            <div class="saved-product">
                <strong>${escapeHTML(item.title)}</strong>

                <div>
                    ASIN: ${escapeHTML(item.asin)}
                </div>

                <div>
                    Mode: ${escapeHTML(item.mode)}
                </div>

                <div>
                    Profit:
                    ${money(calc.profit)}
                </div>

                <div>
                    ROI:
                    ${percent(calc.roi)}
                </div>

                <div>
                    Decision:
                    ${escapeHTML(calc.decision || "—")}
                </div>

                <button onclick="loadSavedProduct(${index})">
                    Open
                </button>
            </div>
        `;
    }).join("");
}

// -----------------------------
// LOAD SAVED PRODUCT
// -----------------------------

function loadSavedProduct(index) {
    let saved = [];

    try {
        saved =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || [];
    } catch (error) {
        saved = [];
    }

    const item = saved[index];

    if (!item) {
        return;
    }

    currentMode = item.mode || "Retail Arbitrage";

    currentProduct = item.product;

    const calc = item.calculation || {};

    setValue("buyCost", calc.buyCost);
    setValue("sellingPrice", calc.sellingPrice);
    setValue("shipping", calc.shipping);
    setValue("prep", calc.prep);

    setValue(
        "referralFee",
        calc.referralFeePercent
    );

    setValue("fbaFee", calc.fbaFee);
    setValue("otherFees", calc.otherFees);

    renderProduct();
    calculate();

    const searchElement =
        document.getElementById("productSearch");

    if (searchElement) {
        searchElement.value = item.asin;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// -----------------------------
// CLEAR SAVED PRODUCTS
// -----------------------------

function clearSaved() {
    const confirmation =
        confirm(
            "Delete all saved products?"
        );

    if (!confirmation) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);

    renderSavedProducts();
}

// -----------------------------
// NAVIGATION
// -----------------------------

function scrollToSaved() {
    const element =
        document.getElementById("savedProducts");

    if (element) {
        element.scrollIntoView({
            behavior: "smooth"
        });
    }
}

function openSettings() {
    alert(
        "Settings will be expanded in a later version."
    );
}

// -----------------------------
// SECURITY / HTML HELPER
// -----------------------------

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// -----------------------------
// AUTOMATIC CALCULATIONS
// -----------------------------

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const calculationInputs = [
            "buyCost",
            "sellingPrice",
            "shipping",
            "prep",
            "referralFee",
            "fbaFee",
            "otherFees",
            "minimumProfit",
            "minimumROI",
            "maximumBSR"
        ];

        calculationInputs.forEach(function (id) {
            const element =
                document.getElementById(id);

            if (element) {
                element.addEventListener(
                    "input",
                    calculate
                );
            }
        });

        renderProduct();
        calculate();
        renderSavedProducts();
    }
);
