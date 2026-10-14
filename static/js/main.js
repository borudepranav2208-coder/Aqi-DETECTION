/* =========================================================
   AQI INSIGHT HUB
   MAIN JAVASCRIPT
========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "AQI Insight Hub JavaScript Loaded"
        );

        loadDashboard();

        loadExplorerInfo();

        loadDataset();

        loadHealth();

        loadModel();

        setupSearch();

        setupNavigation();

        setupAnimations();

        createParticles();

        setupPrediction();

    }
);


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


function setText(id, value) {

    const element = getElement(id);

    if (!element) {
        return;
    }

    element.textContent = value;

}


function safeNumber(
    value,
    decimals = 2
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return 0;
    }

    return Number(
        number.toFixed(decimals)
    );

}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/dashboard"
            );

        if (!response.ok) {

            throw new Error(
                "Dashboard API error"
            );

        }

        const data =
            await response.json();

        console.log(
            "Dashboard Data:",
            data
        );


        if (data.success === false) {

            console.error(
                data.error
            );

            return;

        }


        /* -----------------------------------------
           STATISTICS
        ----------------------------------------- */

        setText(
            "totalRecords",
            Number(
                data.total_records || 0
            ).toLocaleString()
        );


        setText(
            "totalStates",
            Number(
                data.total_states || 0
            ).toLocaleString()
        );


        setText(
            "totalAreas",
            Number(
                data.total_areas || 0
            ).toLocaleString()
        );


        setText(
            "averageAQI",
            safeNumber(
                data.average_aqi,
                2
            )
        );


        /* -----------------------------------------
           CHARTS
        ----------------------------------------- */

        createStatusChart(
            data
        );

        createPollutantChart(
            data
        );

        createStateChart(
            data
        );

        createYearlyChart(
            data
        );


        /* -----------------------------------------
           POLLUTANT CARDS
        ----------------------------------------- */

        createPollutantCards(
            data
        );

    }

    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


/* =========================================================
   STATUS CHART
========================================================= */

function createStatusChart(data) {

    const canvas =
        getElement(
            "statusChart"
        );

    if (!canvas) {
        return;
    }


    const statusData =
        data.category_counts ||
        data.status_counts ||
        {};


    const labels =
        Object.keys(
            statusData
        );


    const values =
        Object.values(
            statusData
        ).map(Number);


    createChart(
        canvas,
        "doughnut",
        labels,
        values,
        "AQI Categories"
    );

}


/* =========================================================
   POLLUTANT CHART
========================================================= */

function createPollutantChart(data) {

    const canvas =
        getElement(
            "pollutantChart"
        );

    if (!canvas) {
        return;
    }


    const pollutantData =
        data.pollutant_counts ||
        {};


    const labels =
        Object.keys(
            pollutantData
        );


    const values =
        Object.values(
            pollutantData
        ).map(Number);


    createChart(
        canvas,
        "bar",
        labels,
        values,
        "Prominent Pollutants"
    );

}


/* =========================================================
   STATE CHART
========================================================= */

function createStateChart(data) {

    const canvas =
        getElement(
            "stateChart"
        );

    if (!canvas) {
        return;
    }


    const stateData =
        data.state_counts ||
        {};


    let combined =
        Object.keys(
            stateData
        ).map(
            key => ({
                label: key,
                value:
                    Number(
                        stateData[key]
                    )
            })
        );


    combined.sort(
        (a, b) =>
            b.value - a.value
    );


    combined =
        combined.slice(
            0,
            12
        );


    const labels =
        combined.map(
            item => item.label
        );


    const values =
        combined.map(
            item => item.value
        );


    createChart(
        canvas,
        "bar",
        labels,
        values,
        "State Records"
    );

}


/* =========================================================
   YEARLY CHART
========================================================= */

function createYearlyChart(data) {

    const canvas =
        getElement(
            "yearlyChart"
        );

    if (!canvas) {
        return;
    }


    const yearly =
        data.yearly ||
        {};


    const labels =
        Object.keys(
            yearly
        );


    const values =
        Object.values(
            yearly
        ).map(Number);


    createChart(
        canvas,
        "line",
        labels,
        values,
        "Average AQI"
    );

}


/* =========================================================
   GENERIC CHART
========================================================= */

function createChart(
    canvas,
    type,
    labels,
    values,
    label
) {

    if (!canvas) {
        return;
    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js not loaded."
        );

        return;

    }


    if (
        canvas._chartInstance
    ) {

        canvas._chartInstance.destroy();

    }


    canvas._chartInstance =
        new Chart(
            canvas.getContext(
                "2d"
            ),
            {

                type: type,

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label: label,

                            data: values,

                            borderWidth: 2,

                            borderRadius: 6,

                            tension: 0.35,

                            fill:
                                type ===
                                "line",

                            backgroundColor: [
                                "rgba(14,165,164,0.75)",
                                "rgba(59,130,246,0.75)",
                                "rgba(16,185,129,0.75)",
                                "rgba(245,158,11,0.75)",
                                "rgba(239,68,68,0.75)",
                                "rgba(139,92,246,0.75)"
                            ],

                            borderColor:
                                "rgba(14,116,144,1)"

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    animation: {

                        duration: 1200

                    },

                    plugins: {

                        legend: {

                            display: true

                        }

                    },

                    scales:
                        type ===
                        "doughnut"
                            ? {}
                            : {

                                y: {

                                    beginAtZero:
                                        true

                                }

                            }

                }

            }
        );

}


/* =========================================================
   POLLUTANT CARDS
========================================================= */

function createPollutantCards(data) {

    const container =
        document.querySelector(
            ".pollutant-grid"
        );

    if (!container) {
        return;
    }


    const pollutants =
        data.pollutant_details ||
        [];


    if (
        pollutants.length === 0
    ) {

        return;

    }


    container.innerHTML =
        pollutants.map(
            pollutant => `

                <div class="pollutant-card reveal">

                    <div class="pollutant-icon">
                        🌫️
                    </div>

                    <h3>
                        ${escapeHTML(
                            pollutant.name
                        )}
                    </h3>

                    <p>
                        Records:
                        <strong>
                            ${Number(
                                pollutant.count
                            ).toLocaleString()}
                        </strong>
                    </p>

                    <p>
                        Average AQI:
                        <strong>
                            ${safeNumber(
                                pollutant.average_aqi
                            )}
                        </strong>
                    </p>

                    <p>
                        Maximum AQI:
                        <strong>
                            ${safeNumber(
                                pollutant.maximum_aqi
                            )}
                        </strong>
                    </p>

                </div>

            `
        ).join("");

}


/* =========================================================
   DATASET EXPLORER
========================================================= */

async function loadExplorerInfo() {

    try {

        const response =
            await fetch(
                "/api/explorer-info"
            );

        if (!response.ok) {
            throw new Error(
                "Explorer API error"
            );
        }

        const data =
            await response.json();


        setText(
            "explorerTotalRows",
            Number(
                data.rows || 0
            ).toLocaleString()
        );


        setText(
            "explorerTotalColumns",
            data.columns || 0
        );


        setText(
            "explorerNumericColumns",
            data.numeric_columns || 0
        );


        setText(
            "explorerTextColumns",
            data.text_columns || 0
        );


        displayColumnInformation(
            data.columns_info || []
        );

    }

    catch (error) {

        console.error(
            "Explorer Error:",
            error
        );

    }

}


/* =========================================================
   COLUMN INFORMATION
========================================================= */

function displayColumnInformation(
    columns
) {

    const container =
        getElement(
            "columnInformation"
        );

    if (!container) {
        return;
    }


    if (
        !columns ||
        columns.length === 0
    ) {

        container.innerHTML =
            "<p>No column information available.</p>";

        return;

    }


    container.innerHTML =
        columns.map(
            column => `

                <div class="column-card">

                    <h4>
                        ${escapeHTML(
                            column.name
                        )}
                    </h4>

                    <p>
                        Type:
                        <strong>
                            ${escapeHTML(
                                column.type
                            )}
                        </strong>
                    </p>

                    <p>
                        Missing:
                        <strong>
                            ${column.missing}
                        </strong>
                    </p>

                    <p>
                        Unique:
                        <strong>
                            ${column.unique}
                        </strong>
                    </p>

                </div>

            `
        ).join("");

}


/* =========================================================
   DATASET TABLE
========================================================= */

async function loadDataset(
    search = ""
) {

    try {

        const response =
            await fetch(
                "/api/data?search=" +
                encodeURIComponent(
                    search
                )
            );

        if (!response.ok) {
            throw new Error(
                "Dataset API error"
            );
        }

        const data =
            await response.json();


        renderDatasetTable(
            data.rows || [],
            data.columns || []
        );

    }

    catch (error) {

        console.error(
            "Dataset Error:",
            error
        );

    }

}


/* =========================================================
   RENDER DATASET TABLE
========================================================= */

function renderDatasetTable(
    rows,
    columns
) {

    const table =
        getElement(
            "datasetTable"
        );

    const tbody =
        getElement(
            "datasetTableBody"
        );


    if (
        !table ||
        !tbody
    ) {

        return;

    }


    if (
        !rows ||
        rows.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td>
                    No data found.
                </td>

            </tr>

        `;

        return;

    }


    const thead =
        table.querySelector(
            "thead"
        );


    if (thead) {

        thead.innerHTML = `

            <tr>

                ${columns.map(
                    column =>
                        `<th>
                            ${escapeHTML(
                                column
                            )}
                        </th>`
                ).join("")}

            </tr>

        `;

    }


    tbody.innerHTML =
        rows.map(
            row => {

                return `

                    <tr>

                        ${columns.map(
                            column => {

                                let value =
                                    row[
                                        column
                                    ];

                                if (
                                    value ===
                                    null ||
                                    value ===
                                    undefined
                                ) {

                                    value =
                                        "-";

                                }

                                return `

                                    <td>
                                        ${escapeHTML(
                                            value
                                        )}
                                    </td>

                                `;

                            }
                        ).join("")}

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    const searchInput =
        getElement(
            "datasetSearch"
        );

    if (!searchInput) {
        return;
    }


    let timeout;


    searchInput.addEventListener(
        "input",
        function () {

            clearTimeout(
                timeout
            );


            timeout =
                setTimeout(
                    () => {

                        loadDataset(
                            searchInput
                                .value
                                .trim()
                        );

                    },
                    350
                );

        }
    );

}


/* =========================================================
   DATASET HEALTH
========================================================= */

async function loadHealth() {

    try {

        const response =
            await fetch(
                "/api/quality"
            );

        if (!response.ok) {
            throw new Error(
                "Quality API error"
            );
        }

        const data =
            await response.json();


        const score =
            safeNumber(
                data.score,
                0
            );


        setText(
            "healthScore",
            score
        );


        setText(
            "healthStatus",
            data.status ||
            getHealthStatus(
                score
            )
        );


        setText(
            "missingValues",
            Number(
                data.missing_values ||
                0
            ).toLocaleString()
        );


        setText(
            "duplicateRows",
            Number(
                data.duplicate_rows ||
                0
            ).toLocaleString()
        );


        setText(
            "aqiOutliers",
            Number(
                data.aqi_outliers ||
                0
            ).toLocaleString()
        );


        setText(
            "healthRows",
            Number(
                data.rows ||
                0
            ).toLocaleString()
        );


        setText(
            "healthColumns",
            data.columns || 0
        );


        updateHealthCircle(
            score
        );

    }

    catch (error) {

        console.error(
            "Health Error:",
            error
        );

    }

}


/* =========================================================
   HEALTH STATUS
========================================================= */

function getHealthStatus(
    score
) {

    if (score >= 80) {

        return "Excellent Dataset Quality";

    }

    if (score >= 60) {

        return "Good Dataset Quality";

    }

    if (score >= 40) {

        return "Needs Some Cleaning";

    }

    return "Needs Data Cleaning";

}


/* =========================================================
   HEALTH CIRCLE
========================================================= */

function updateHealthCircle(
    score
) {

    const circle =
        getElement(
            "healthCircle"
        );

    if (!circle) {
        return;
    }


    const safeScore =
        Math.max(
            0,
            Math.min(
                100,
                Number(score) || 0
            )
        );


    circle.style.setProperty(
        "--health-score",
        safeScore + "%"
    );

}


/* =========================================================
   RANDOM FOREST MODEL
========================================================= */

async function loadModel() {

    try {

        const response =
            await fetch(
                "/api/model"
            );

        if (!response.ok) {
            throw new Error(
                "Model API error"
            );
        }

        const data =
            await response.json();


        console.log(
            "Model:",
            data
        );


        if (
            data.success === false
        ) {

            console.error(
                data.error ||
                data.message
            );

            return;

        }


        setText(
            "maeValue",
            formatMetric(
                data.mae
            )
        );


        setText(
            "rmseValue",
            formatMetric(
                data.rmse
            )
        );


        setText(
            "r2Value",
            formatMetric(
                data.r2
            )
        );

    }

    catch (error) {

        console.error(
            "Model Error:",
            error
        );

    }

}


/* =========================================================
   FORMAT MODEL METRIC
========================================================= */

function formatMetric(
    value
) {

    const number =
        Number(value);

    if (
        Number.isNaN(
            number
        )
    ) {

        return "0.000";

    }

    return number.toFixed(
        3
    );

}


/* =========================================================
   PREDICTION SETUP
========================================================= */

async function setupPrediction() {

    const section =
        getElement(
            "prediction"
        );

    if (!section) {
        return;
    }


    /*
       Create prediction form
       dynamically so existing
       index.html does not need
       to be changed.
    */

    const oldForm =
        getElement(
            "aqiPredictionBox"
        );

    if (oldForm) {
        oldForm.remove();
    }


    const box =
        document.createElement(
            "div"
        );


    box.id =
        "aqiPredictionBox";


    box.className =
        "prediction-box reveal";


    box.innerHTML = `

        <div class="prediction-header">

            <div>

                <p class="section-label">
                    TRY THE MODEL
                </p>

                <h3>
                    Predict AQI
                </h3>

                <p>
                    Enter environmental information
                    and get an estimated AQI with
                    health advice.
                </p>

            </div>

        </div>


        <div class="prediction-form">

            <div class="prediction-field">

                <label>
                    State
                </label>

                <select id="predictionState">

                    <option value="">
                        Select State
                    </option>

                </select>

            </div>


            <div class="prediction-field">

                <label>
                    Area
                </label>

                <select id="predictionArea">

                    <option value="">
                        Select Area
                    </option>

                </select>

            </div>


            <div class="prediction-field">

                <label>
                    Monitoring Stations
                </label>

                <input
                    type="number"
                    id="predictionMonitoring"
                    value="1"
                    min="1"
                    step="1"
                    placeholder="Enter number"
                >

            </div>


            <div class="prediction-field">

                <label>
                    Prominent Pollutant
                </label>

                <select id="predictionPollutant">

                    <option value="">
                        Select Pollutant
                    </option>

                </select>

            </div>

        </div>


        <button
            type="button"
            id="predictAQIBtn"
            class="btn-primary prediction-button"
        >
            Predict AQI
        </button>


        <div
            id="predictionResult"
            class="prediction-result"
            style="display:none;"
        >

            <div class="prediction-aqi">

                <span>
                    Predicted AQI
                </span>

                <strong id="predictedAQI">
                    0
                </strong>

            </div>


            <div class="prediction-category">

                <span>
                    Air Quality Status
                </span>

                <strong id="predictedCategory">
                    -
                </strong>

            </div>


            <div class="prediction-advice">

                <h4>
                    Health Situation / Advice
                </h4>

                <p id="predictedAdvice">
                    -
                </p>

            </div>

        </div>


        <p
            id="predictionError"
            style="display:none;"
        ></p>

    `;


    section.appendChild(
        box
    );


    loadPredictionOptions();


    const button =
        getElement(
            "predictAQIBtn"
        );


    if (button) {

        button.addEventListener(
            "click",
            predictAQI
        );

    }

}


/* =========================================================
   LOAD PREDICTION OPTIONS
========================================================= */

async function loadPredictionOptions() {

    try {

        const response =
            await fetch(
                "/api/model-options"
            );

        const data =
            await response.json();


        populateSelect(
            "predictionState",
            data.states || []
        );


        populateSelect(
            "predictionArea",
            data.areas || []
        );


        populateSelect(
            "predictionPollutant",
            data.pollutants || []
        );


        const monitoring =
            getElement(
                "predictionMonitoring"
            );


        if (monitoring) {

            monitoring.min =
                data.monitoring_min ||
                1;

            monitoring.max =
                data.monitoring_max ||
                10;

        }

    }

    catch (error) {

        console.error(
            "Prediction options error:",
            error
        );

    }

}


/* =========================================================
   POPULATE SELECT
========================================================= */

function populateSelect(
    id,
    values
) {

    const select =
        getElement(id);

    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Select
        </option>

    `;


    values.forEach(
        value => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                value;

            option.textContent =
                value;

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   PREDICT AQI
========================================================= */

async function predictAQI() {

    const state =
        getElement(
            "predictionState"
        )?.value;


    const area =
        getElement(
            "predictionArea"
        )?.value;


    const monitoring =
        getElement(
            "predictionMonitoring"
        )?.value;


    const pollutant =
        getElement(
            "predictionPollutant"
        )?.value;


    const errorBox =
        getElement(
            "predictionError"
        );


    const resultBox =
        getElement(
            "predictionResult"
        );


    if (
        !state ||
        !area ||
        !monitoring ||
        !pollutant
    ) {

        if (errorBox) {

            errorBox.style.display =
                "block";

            errorBox.textContent =
                "Please fill all prediction inputs.";

        }

        if (resultBox) {

            resultBox.style.display =
                "none";

        }

        return;

    }


    if (errorBox) {

        errorBox.style.display =
            "none";

    }


    const button =
        getElement(
            "predictAQIBtn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Predicting...";

    }


    try {

        const response =
            await fetch(
                "/api/predict",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            state:
                                state,

                            area:
                                area,

                            number_of_monitoring_stations:
                                monitoring,

                            prominent_pollutants:
                                pollutant

                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Prediction failed."
            );

        }


        setText(
            "predictedAQI",
            safeNumber(
                data.predicted_aqi,
                2
            )
        );


        setText(
            "predictedCategory",
            data.category ||
            "-"
        );


        setText(
            "predictedAdvice",
            data.advice ||
            "-"
        );


        if (resultBox) {

            resultBox.style.display =
                "block";

        }


        if (errorBox) {

            errorBox.style.display =
                "none";

        }

    }

    catch (error) {

        console.error(
            "Prediction Error:",
            error
        );


        if (errorBox) {

            errorBox.style.display =
                "block";

            errorBox.textContent =
                error.message;

        }

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Predict AQI";

        }

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                function(event) {

                    const target =
                        this.getAttribute(
                            "href"
                        );


                    if (
                        !target ||
                        target === "#"
                    ) {

                        return;

                    }


                    const element =
                        document.querySelector(
                            target
                        );


                    if (element) {

                        event.preventDefault();


                        element.scrollIntoView({

                            behavior:
                                "smooth",

                            block:
                                "start"

                        });

                    }

                }
            );

        }
    );

}


/* =========================================================
   SCROLL ANIMATIONS
========================================================= */

function setupAnimations() {

    const elements =
        document.querySelectorAll(
            ".reveal"
        );


    if (
        !(
            "IntersectionObserver"
            in window
        )
    ) {

        elements.forEach(
            element =>
                element.classList.add(
                    "show"
                )
        );

        return;

    }


    const observer =
        new IntersectionObserver(
            function(entries) {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target
                                .classList
                                .add(
                                    "show"
                                );


                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    elements.forEach(
        element => {

            observer.observe(
                element
            );

        }
    );

}


/* =========================================================
   HERO PARTICLES
========================================================= */

function createParticles() {

    const container =
        document.querySelector(
            ".hero-particles"
        );


    if (!container) {
        return;
    }


    if (
        container.children.length > 0
    ) {

        return;

    }


    const numberOfParticles =
        22;


    for (
        let i = 0;
        i < numberOfParticles;
        i++
    ) {

        const particle =
            document.createElement(
                "span"
            );


        particle.className =
            "particle";


        const size =
            Math.random() * 6 + 2;


        particle.style.width =
            size + "px";


        particle.style.height =
            size + "px";


        particle.style.left =
            Math.random() * 100 +
            "%";


        particle.style.top =
            Math.random() * 100 +
            "%";


        particle.style.animationDelay =
            Math.random() * 6 +
            "s";


        particle.style.animationDuration =
            Math.random() * 6 +
            6 +
            "s";


        container.appendChild(
            particle
        );

    }

}


/* =========================================================
   ERROR LOGGER
========================================================= */

window.addEventListener(
    "error",
    function(event) {

        console.error(
            "Browser Error:",
            event.message
        );

    }
);


console.log(
    "AQI Insight Hub main.js ready."
);/* =========================================================
   AQI INSIGHT HUB
   MAIN JAVASCRIPT
========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "AQI Insight Hub JavaScript Loaded"
        );

        loadDashboard();

        loadExplorerInfo();

        loadDataset();

        loadHealth();

        loadModel();

        setupSearch();

        setupNavigation();

        setupAnimations();

        createParticles();

        setupPrediction();

    }
);


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


function setText(id, value) {

    const element = getElement(id);

    if (!element) {
        return;
    }

    element.textContent = value;

}


function safeNumber(
    value,
    decimals = 2
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return 0;
    }

    return Number(
        number.toFixed(decimals)
    );

}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/dashboard"
            );

        if (!response.ok) {

            throw new Error(
                "Dashboard API error"
            );

        }

        const data =
            await response.json();

        console.log(
            "Dashboard Data:",
            data
        );


        if (data.success === false) {

            console.error(
                data.error
            );

            return;

        }


        /* -----------------------------------------
           STATISTICS
        ----------------------------------------- */

        setText(
            "totalRecords",
            Number(
                data.total_records || 0
            ).toLocaleString()
        );


        setText(
            "totalStates",
            Number(
                data.total_states || 0
            ).toLocaleString()
        );


        setText(
            "totalAreas",
            Number(
                data.total_areas || 0
            ).toLocaleString()
        );


        setText(
            "averageAQI",
            safeNumber(
                data.average_aqi,
                2
            )
        );


        /* -----------------------------------------
           CHARTS
        ----------------------------------------- */

        createStatusChart(
            data
        );

        createPollutantChart(
            data
        );

        createStateChart(
            data
        );

        createYearlyChart(
            data
        );


        /* -----------------------------------------
           POLLUTANT CARDS
        ----------------------------------------- */

        createPollutantCards(
            data
        );

    }

    catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


/* =========================================================
   STATUS CHART
========================================================= */

function createStatusChart(data) {

    const canvas =
        getElement(
            "statusChart"
        );

    if (!canvas) {
        return;
    }


    const statusData =
        data.category_counts ||
        data.status_counts ||
        {};


    const labels =
        Object.keys(
            statusData
        );


    const values =
        Object.values(
            statusData
        ).map(Number);


    createChart(
        canvas,
        "doughnut",
        labels,
        values,
        "AQI Categories"
    );

}


/* =========================================================
   POLLUTANT CHART
========================================================= */

function createPollutantChart(data) {

    const canvas =
        getElement(
            "pollutantChart"
        );

    if (!canvas) {
        return;
    }


    const pollutantData =
        data.pollutant_counts ||
        {};


    const labels =
        Object.keys(
            pollutantData
        );


    const values =
        Object.values(
            pollutantData
        ).map(Number);


    createChart(
        canvas,
        "bar",
        labels,
        values,
        "Prominent Pollutants"
    );

}


/* =========================================================
   STATE CHART
========================================================= */

function createStateChart(data) {

    const canvas =
        getElement(
            "stateChart"
        );

    if (!canvas) {
        return;
    }


    const stateData =
        data.state_counts ||
        {};


    let combined =
        Object.keys(
            stateData
        ).map(
            key => ({
                label: key,
                value:
                    Number(
                        stateData[key]
                    )
            })
        );


    combined.sort(
        (a, b) =>
            b.value - a.value
    );


    combined =
        combined.slice(
            0,
            12
        );


    const labels =
        combined.map(
            item => item.label
        );


    const values =
        combined.map(
            item => item.value
        );


    createChart(
        canvas,
        "bar",
        labels,
        values,
        "State Records"
    );

}


/* =========================================================
   YEARLY CHART
========================================================= */

function createYearlyChart(data) {

    const canvas =
        getElement(
            "yearlyChart"
        );

    if (!canvas) {
        return;
    }


    const yearly =
        data.yearly ||
        {};


    const labels =
        Object.keys(
            yearly
        );


    const values =
        Object.values(
            yearly
        ).map(Number);


    createChart(
        canvas,
        "line",
        labels,
        values,
        "Average AQI"
    );

}


/* =========================================================
   GENERIC CHART
========================================================= */

function createChart(
    canvas,
    type,
    labels,
    values,
    label
) {

    if (!canvas) {
        return;
    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js not loaded."
        );

        return;

    }


    if (
        canvas._chartInstance
    ) {

        canvas._chartInstance.destroy();

    }


    canvas._chartInstance =
        new Chart(
            canvas.getContext(
                "2d"
            ),
            {

                type: type,

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label: label,

                            data: values,

                            borderWidth: 2,

                            borderRadius: 6,

                            tension: 0.35,

                            fill:
                                type ===
                                "line",

                            backgroundColor: [
                                "rgba(14,165,164,0.75)",
                                "rgba(59,130,246,0.75)",
                                "rgba(16,185,129,0.75)",
                                "rgba(245,158,11,0.75)",
                                "rgba(239,68,68,0.75)",
                                "rgba(139,92,246,0.75)"
                            ],

                            borderColor:
                                "rgba(14,116,144,1)"

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    animation: {

                        duration: 1200

                    },

                    plugins: {

                        legend: {

                            display: true

                        }

                    },

                    scales:
                        type ===
                        "doughnut"
                            ? {}
                            : {

                                y: {

                                    beginAtZero:
                                        true

                                }

                            }

                }

            }
        );

}


/* =========================================================
   POLLUTANT CARDS
========================================================= */

function createPollutantCards(data) {

    const container =
        document.querySelector(
            ".pollutant-grid"
        );

    if (!container) {
        return;
    }


    const pollutants =
        data.pollutant_details ||
        [];


    if (
        pollutants.length === 0
    ) {

        return;

    }


    container.innerHTML =
        pollutants.map(
            pollutant => `

                <div class="pollutant-card reveal">

                    <div class="pollutant-icon">
                        🌫️
                    </div>

                    <h3>
                        ${escapeHTML(
                            pollutant.name
                        )}
                    </h3>

                    <p>
                        Records:
                        <strong>
                            ${Number(
                                pollutant.count
                            ).toLocaleString()}
                        </strong>
                    </p>

                    <p>
                        Average AQI:
                        <strong>
                            ${safeNumber(
                                pollutant.average_aqi
                            )}
                        </strong>
                    </p>

                    <p>
                        Maximum AQI:
                        <strong>
                            ${safeNumber(
                                pollutant.maximum_aqi
                            )}
                        </strong>
                    </p>

                </div>

            `
        ).join("");

}


/* =========================================================
   DATASET EXPLORER
========================================================= */

async function loadExplorerInfo() {

    try {

        const response =
            await fetch(
                "/api/explorer-info"
            );

        if (!response.ok) {
            throw new Error(
                "Explorer API error"
            );
        }

        const data =
            await response.json();


        setText(
            "explorerTotalRows",
            Number(
                data.rows || 0
            ).toLocaleString()
        );


        setText(
            "explorerTotalColumns",
            data.columns || 0
        );


        setText(
            "explorerNumericColumns",
            data.numeric_columns || 0
        );


        setText(
            "explorerTextColumns",
            data.text_columns || 0
        );


        displayColumnInformation(
            data.columns_info || []
        );

    }

    catch (error) {

        console.error(
            "Explorer Error:",
            error
        );

    }

}


/* =========================================================
   COLUMN INFORMATION
========================================================= */

function displayColumnInformation(
    columns
) {

    const container =
        getElement(
            "columnInformation"
        );

    if (!container) {
        return;
    }


    if (
        !columns ||
        columns.length === 0
    ) {

        container.innerHTML =
            "<p>No column information available.</p>";

        return;

    }


    container.innerHTML =
        columns.map(
            column => `

                <div class="column-card">

                    <h4>
                        ${escapeHTML(
                            column.name
                        )}
                    </h4>

                    <p>
                        Type:
                        <strong>
                            ${escapeHTML(
                                column.type
                            )}
                        </strong>
                    </p>

                    <p>
                        Missing:
                        <strong>
                            ${column.missing}
                        </strong>
                    </p>

                    <p>
                        Unique:
                        <strong>
                            ${column.unique}
                        </strong>
                    </p>

                </div>

            `
        ).join("");

}


/* =========================================================
   DATASET TABLE
========================================================= */

async function loadDataset(
    search = ""
) {

    try {

        const response =
            await fetch(
                "/api/data?search=" +
                encodeURIComponent(
                    search
                )
            );

        if (!response.ok) {
            throw new Error(
                "Dataset API error"
            );
        }

        const data =
            await response.json();


        renderDatasetTable(
            data.rows || [],
            data.columns || []
        );

    }

    catch (error) {

        console.error(
            "Dataset Error:",
            error
        );

    }

}


/* =========================================================
   RENDER DATASET TABLE
========================================================= */

function renderDatasetTable(
    rows,
    columns
) {

    const table =
        getElement(
            "datasetTable"
        );

    const tbody =
        getElement(
            "datasetTableBody"
        );


    if (
        !table ||
        !tbody
    ) {

        return;

    }


    if (
        !rows ||
        rows.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td>
                    No data found.
                </td>

            </tr>

        `;

        return;

    }


    const thead =
        table.querySelector(
            "thead"
        );


    if (thead) {

        thead.innerHTML = `

            <tr>

                ${columns.map(
                    column =>
                        `<th>
                            ${escapeHTML(
                                column
                            )}
                        </th>`
                ).join("")}

            </tr>

        `;

    }


    tbody.innerHTML =
        rows.map(
            row => {

                return `

                    <tr>

                        ${columns.map(
                            column => {

                                let value =
                                    row[
                                        column
                                    ];

                                if (
                                    value ===
                                    null ||
                                    value ===
                                    undefined
                                ) {

                                    value =
                                        "-";

                                }

                                return `

                                    <td>
                                        ${escapeHTML(
                                            value
                                        )}
                                    </td>

                                `;

                            }
                        ).join("")}

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    const searchInput =
        getElement(
            "datasetSearch"
        );

    if (!searchInput) {
        return;
    }


    let timeout;


    searchInput.addEventListener(
        "input",
        function () {

            clearTimeout(
                timeout
            );


            timeout =
                setTimeout(
                    () => {

                        loadDataset(
                            searchInput
                                .value
                                .trim()
                        );

                    },
                    350
                );

        }
    );

}


/* =========================================================
   DATASET HEALTH
========================================================= */

async function loadHealth() {

    try {

        const response =
            await fetch(
                "/api/quality"
            );

        if (!response.ok) {
            throw new Error(
                "Quality API error"
            );
        }

        const data =
            await response.json();


        const score =
            safeNumber(
                data.score,
                0
            );


        setText(
            "healthScore",
            score
        );


        setText(
            "healthStatus",
            data.status ||
            getHealthStatus(
                score
            )
        );


        setText(
            "missingValues",
            Number(
                data.missing_values ||
                0
            ).toLocaleString()
        );


        setText(
            "duplicateRows",
            Number(
                data.duplicate_rows ||
                0
            ).toLocaleString()
        );


        setText(
            "aqiOutliers",
            Number(
                data.aqi_outliers ||
                0
            ).toLocaleString()
        );


        setText(
            "healthRows",
            Number(
                data.rows ||
                0
            ).toLocaleString()
        );


        setText(
            "healthColumns",
            data.columns || 0
        );


        updateHealthCircle(
            score
        );

    }

    catch (error) {

        console.error(
            "Health Error:",
            error
        );

    }

}


/* =========================================================
   HEALTH STATUS
========================================================= */

function getHealthStatus(
    score
) {

    if (score >= 80) {

        return "Excellent Dataset Quality";

    }

    if (score >= 60) {

        return "Good Dataset Quality";

    }

    if (score >= 40) {

        return "Needs Some Cleaning";

    }

    return "Needs Data Cleaning";

}


/* =========================================================
   HEALTH CIRCLE
========================================================= */

function updateHealthCircle(
    score
) {

    const circle =
        getElement(
            "healthCircle"
        );

    if (!circle) {
        return;
    }


    const safeScore =
        Math.max(
            0,
            Math.min(
                100,
                Number(score) || 0
            )
        );


    circle.style.setProperty(
        "--health-score",
        safeScore + "%"
    );

}


/* =========================================================
   RANDOM FOREST MODEL
========================================================= */

async function loadModel() {

    try {

        const response =
            await fetch(
                "/api/model"
            );

        if (!response.ok) {
            throw new Error(
                "Model API error"
            );
        }

        const data =
            await response.json();


        console.log(
            "Model:",
            data
        );


        if (
            data.success === false
        ) {

            console.error(
                data.error ||
                data.message
            );

            return;

        }


        setText(
            "maeValue",
            formatMetric(
                data.mae
            )
        );


        setText(
            "rmseValue",
            formatMetric(
                data.rmse
            )
        );


        setText(
            "r2Value",
            formatMetric(
                data.r2
            )
        );

    }

    catch (error) {

        console.error(
            "Model Error:",
            error
        );

    }

}


/* =========================================================
   FORMAT MODEL METRIC
========================================================= */

function formatMetric(
    value
) {

    const number =
        Number(value);

    if (
        Number.isNaN(
            number
        )
    ) {

        return "0.000";

    }

    return number.toFixed(
        3
    );

}


/* =========================================================
   PREDICTION SETUP
========================================================= */

async function setupPrediction() {

    const section =
        getElement(
            "prediction"
        );

    if (!section) {
        return;
    }


    /*
       Create prediction form
       dynamically so existing
       index.html does not need
       to be changed.
    */

    const oldForm =
        getElement(
            "aqiPredictionBox"
        );

    if (oldForm) {
        oldForm.remove();
    }


    const box =
        document.createElement(
            "div"
        );


    box.id =
        "aqiPredictionBox";


    box.className =
        "prediction-box reveal";


    box.innerHTML = `

        <div class="prediction-header">

            <div>

                <p class="section-label">
                    TRY THE MODEL
                </p>

                <h3>
                    Predict AQI
                </h3>

                <p>
                    Enter environmental information
                    and get an estimated AQI with
                    health advice.
                </p>

            </div>

        </div>


        <div class="prediction-form">

            <div class="prediction-field">

                <label>
                    State
                </label>

                <select id="predictionState">

                    <option value="">
                        Select State
                    </option>

                </select>

            </div>


            <div class="prediction-field">

                <label>
                    Area
                </label>

                <select id="predictionArea">

                    <option value="">
                        Select Area
                    </option>

                </select>

            </div>


            <div class="prediction-field">

                <label>
                    Monitoring Stations
                </label>

                <input
                    type="number"
                    id="predictionMonitoring"
                    value="1"
                    min="1"
                    step="1"
                    placeholder="Enter number"
                >

            </div>


            <div class="prediction-field">

                <label>
                    Prominent Pollutant
                </label>

                <select id="predictionPollutant">

                    <option value="">
                        Select Pollutant
                    </option>

                </select>

            </div>

        </div>


        <button
            type="button"
            id="predictAQIBtn"
            class="btn-primary prediction-button"
        >
            Predict AQI
        </button>


        <div
            id="predictionResult"
            class="prediction-result"
            style="display:none;"
        >

            <div class="prediction-aqi">

                <span>
                    Predicted AQI
                </span>

                <strong id="predictedAQI">
                    0
                </strong>

            </div>


            <div class="prediction-category">

                <span>
                    Air Quality Status
                </span>

                <strong id="predictedCategory">
                    -
                </strong>

            </div>


            <div class="prediction-advice">

                <h4>
                    Health Situation / Advice
                </h4>

                <p id="predictedAdvice">
                    -
                </p>

            </div>

        </div>


        <p
            id="predictionError"
            style="display:none;"
        ></p>

    `;


    section.appendChild(
        box
    );


    loadPredictionOptions();


    const button =
        getElement(
            "predictAQIBtn"
        );


    if (button) {

        button.addEventListener(
            "click",
            predictAQI
        );

    }

}


/* =========================================================
   LOAD PREDICTION OPTIONS
========================================================= */

async function loadPredictionOptions() {

    try {

        const response =
            await fetch(
                "/api/model-options"
            );

        const data =
            await response.json();


        populateSelect(
            "predictionState",
            data.states || []
        );


        populateSelect(
            "predictionArea",
            data.areas || []
        );


        populateSelect(
            "predictionPollutant",
            data.pollutants || []
        );


        const monitoring =
            getElement(
                "predictionMonitoring"
            );


        if (monitoring) {

            monitoring.min =
                data.monitoring_min ||
                1;

            monitoring.max =
                data.monitoring_max ||
                10;

        }

    }

    catch (error) {

        console.error(
            "Prediction options error:",
            error
        );

    }

}


/* =========================================================
   POPULATE SELECT
========================================================= */

function populateSelect(
    id,
    values
) {

    const select =
        getElement(id);

    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Select
        </option>

    `;


    values.forEach(
        value => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                value;

            option.textContent =
                value;

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   PREDICT AQI
========================================================= */

async function predictAQI() {

    const state =
        getElement(
            "predictionState"
        )?.value;


    const area =
        getElement(
            "predictionArea"
        )?.value;


    const monitoring =
        getElement(
            "predictionMonitoring"
        )?.value;


    const pollutant =
        getElement(
            "predictionPollutant"
        )?.value;


    const errorBox =
        getElement(
            "predictionError"
        );


    const resultBox =
        getElement(
            "predictionResult"
        );


    if (
        !state ||
        !area ||
        !monitoring ||
        !pollutant
    ) {

        if (errorBox) {

            errorBox.style.display =
                "block";

            errorBox.textContent =
                "Please fill all prediction inputs.";

        }

        if (resultBox) {

            resultBox.style.display =
                "none";

        }

        return;

    }


    if (errorBox) {

        errorBox.style.display =
            "none";

    }


    const button =
        getElement(
            "predictAQIBtn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Predicting...";

    }


    try {

        const response =
            await fetch(
                "/api/predict",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            state:
                                state,

                            area:
                                area,

                            number_of_monitoring_stations:
                                monitoring,

                            prominent_pollutants:
                                pollutant

                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Prediction failed."
            );

        }


        setText(
            "predictedAQI",
            safeNumber(
                data.predicted_aqi,
                2
            )
        );


        setText(
            "predictedCategory",
            data.category ||
            "-"
        );


        setText(
            "predictedAdvice",
            data.advice ||
            "-"
        );


        if (resultBox) {

            resultBox.style.display =
                "block";

        }


        if (errorBox) {

            errorBox.style.display =
                "none";

        }

    }

    catch (error) {

        console.error(
            "Prediction Error:",
            error
        );


        if (errorBox) {

            errorBox.style.display =
                "block";

            errorBox.textContent =
                error.message;

        }

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Predict AQI";

        }

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                function(event) {

                    const target =
                        this.getAttribute(
                            "href"
                        );


                    if (
                        !target ||
                        target === "#"
                    ) {

                        return;

                    }


                    const element =
                        document.querySelector(
                            target
                        );


                    if (element) {

                        event.preventDefault();


                        element.scrollIntoView({

                            behavior:
                                "smooth",

                            block:
                                "start"

                        });

                    }

                }
            );

        }
    );

}


/* =========================================================
   SCROLL ANIMATIONS
========================================================= */

function setupAnimations() {

    const elements =
        document.querySelectorAll(
            ".reveal"
        );


    if (
        !(
            "IntersectionObserver"
            in window
        )
    ) {

        elements.forEach(
            element =>
                element.classList.add(
                    "show"
                )
        );

        return;

    }


    const observer =
        new IntersectionObserver(
            function(entries) {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target
                                .classList
                                .add(
                                    "show"
                                );


                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    elements.forEach(
        element => {

            observer.observe(
                element
            );

        }
    );

}


/* =========================================================
   HERO PARTICLES
========================================================= */

function createParticles() {

    const container =
        document.querySelector(
            ".hero-particles"
        );


    if (!container) {
        return;
    }


    if (
        container.children.length > 0
    ) {

        return;

    }


    const numberOfParticles =
        22;


    for (
        let i = 0;
        i < numberOfParticles;
        i++
    ) {

        const particle =
            document.createElement(
                "span"
            );


        particle.className =
            "particle";


        const size =
            Math.random() * 6 + 2;


        particle.style.width =
            size + "px";


        particle.style.height =
            size + "px";


        particle.style.left =
            Math.random() * 100 +
            "%";


        particle.style.top =
            Math.random() * 100 +
            "%";


        particle.style.animationDelay =
            Math.random() * 6 +
            "s";


        particle.style.animationDuration =
            Math.random() * 6 +
            6 +
            "s";


        container.appendChild(
            particle
        );

    }

}


/* =========================================================
   ERROR LOGGER
========================================================= */

window.addEventListener(
    "error",
    function(event) {

        console.error(
            "Browser Error:",
            event.message
        );

    }
);


console.log(
    "AQI Insight Hub main.js ready."
);