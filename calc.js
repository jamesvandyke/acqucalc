// Global configuration and utility variables
let savedScenarios = [];
const MAX_SAVED_SCENARIOS = 10;

// Comprehensive configuration for all slider inputs
const slidersConfig = [
    { id: 'purchasePrice', label: 'Purchase Price ($)', start: 1000000, rangeMin: 0, rangeMax: 5000000, step: 25000, format: '$' },
    { id: 'downPayment', label: 'Down Payment (%)', start: 10, rangeMin: 0, rangeMax: 100, step: 1, format: '%' },
    { id: 'sellerNote', label: 'Seller Note (%)', start: 10, rangeMin: 0, rangeMax: 100, step: 1, format: '%' },
    { id: 'ebitda', label: 'EBITDA ($)', start: 250000, rangeMin: 0, rangeMax: 2000000, step: 25000, format: '$' },
    { id: 'sbaInterestRate', label: 'SBA Interest Rate (%)', start: 10, rangeMin: 0, rangeMax: 20, step: 1, format: '%' },
    { id: 'sbaLoanTerm', label: 'SBA Loan Term (Years)', start: 10, rangeMin: 0, rangeMax: 30, step: 1, format: ' years' },
    { id: 'sellerNoteInterestRate', label: 'Seller Note Interest Rate (%)', start: 5, rangeMin: 0, rangeMax: 20, step: 1, format: '%' },
    { id: 'sellerNoteTerm', label: 'Seller Note Term (Years)', start: 10, rangeMin: 0, rangeMax: 30, step: 1, format: ' years' }
];

// Configuration for calculated value outputs
const calculatedValuesConfig = [
    { id: 'downPaymentValue', label: 'Down Payment ($)' },
    { id: 'sellerNoteValue', label: 'Seller Note ($)' },
    { id: 'needToFinanceValue', label: 'Need to Finance ($)' },
    { id: 'cashToSellerValue', label: 'Cash to Seller ($)' },
    { id: 'sbaLoanValue', label: 'SBA Loan ($)' },
    { id: 'sbaMonthlyPayment', label: 'SBA Monthly Payment ($)' },
    { id: 'sbaAnnualPayment', label: 'SBA Annual Payment ($)' },
    { id: 'sbaTotalLoanCost', label: 'SBA Total Loan Cost ($)' },
    { id: 'sellerNoteMonthlyPayment', label: 'Seller Note Monthly Payment ($)' },
    { id: 'sellerNoteAnnualPayment', label: 'Seller Note Annual Payment ($)' },
    { id: 'sellerTotalLoanCost', label: 'Seller Total Loan Cost ($)' },
    { id: 'totalAnnualLoanPayments', label: 'Total Annual Loan Payments ($)' },
    { id: 'totalLoanCost', label: 'Total Loan Cost ($)' },
    { id: 'remainingEbitdaAfterLoanPayments', label: 'Remaining EBITDA After Loan Payments ($)' },
    { id: 'ebitdaMultiple', label: 'EBITDA Multiple (Ratio)' }
];

// Color palette for scenarios
const SCENARIO_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6C5CE7', 
    '#FF8A5B', '#2ECC71', '#AF7AC5', '#F39C12', '#5DADE2'
];

// Function to update the slider output, preserving saved values
function updateSliderOutput(id, currentValue) {
    const outputElement = document.getElementById(`${id}Output`);
    if (outputElement) {
        let outputHtml = `${currentValue}`;

        // Add saved scenario markers
        savedScenarios.forEach(scenario => {
            const savedValue = scenario.values[`${id}Value`];
            if (savedValue) {
                outputHtml += ` <span class="saved-scenario" style="color: ${scenario.color};">${savedValue.currentValue}</span>`;
            }
        });

        outputElement.innerHTML = outputHtml;
    }
}

// Modify the calculateValues function to handle scenario display more efficiently
function calculateValues() {
    const getValue = id => {
        const sliderElement = document.getElementById(`${id}Slider`);
        if (sliderElement && sliderElement.noUiSlider) {
            return parseFloat(sliderElement.noUiSlider.get().replace(/[^0-9.-]+/g, ""));
        }
        return 0;
    };

    const purchasePrice = getValue('purchasePrice');
    const downPaymentPercent = getValue('downPayment');
    const sellerNotePercent = getValue('sellerNote');
    const sbaInterestRate = getValue('sbaInterestRate');
    const sbaLoanTerm = getValue('sbaLoanTerm');
    const sellerNoteInterestRate = getValue('sellerNoteInterestRate');
    const sellerNoteTerm = getValue('sellerNoteTerm');
    const ebitda = getValue('ebitda');

    // Calculate financial values
    const downPayment = (purchasePrice * downPaymentPercent) / 100;
    const sellerNote = (purchasePrice * sellerNotePercent) / 100;
    const needToFinance = purchasePrice - downPayment - sellerNote;
    const cashToSeller = downPayment + needToFinance;
    const sbaLoanAmount = needToFinance;
    const monthlyInterestRate = (sbaInterestRate / 100) / 12;
    const numberOfPayments = sbaLoanTerm * 12;

    // Calculate SBA Monthly Payment using the annuity formula
    let sbaMonthlyPayment = monthlyInterestRate > 0 
        ? sbaLoanAmount * monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) 
        : sbaLoanAmount / numberOfPayments;

    // Calculate annual payment and total loan cost for SBA
    const sbaAnnualPayment = sbaMonthlyPayment * 12;
    const sbaTotalLoanCost = sbaAnnualPayment * sbaLoanTerm;

    // Calculate Seller Note Monthly Payment using the annuity formula
    const sellerNoteMonthlyInterestRate = (sellerNoteInterestRate / 100) / 12;
    const sellerNoteNumberOfPayments = sellerNoteTerm * 12;
    let sellerNoteMonthlyPayment = sellerNoteMonthlyInterestRate > 0 
        ? sellerNote * sellerNoteMonthlyInterestRate / (1 - Math.pow(1 + sellerNoteMonthlyInterestRate, -sellerNoteNumberOfPayments)) 
        : sellerNote / sellerNoteNumberOfPayments;

    // Calculate annual payment and total loan cost for Seller Note
    const sellerNoteAnnualPayment = sellerNoteMonthlyPayment * 12;
    const sellerTotalLoanCost = sellerNoteAnnualPayment * sellerNoteTerm;

    // Calculate total annual loan payments and total loan cost
    const totalAnnualLoanPayments = sbaAnnualPayment + sellerNoteAnnualPayment;
    const totalLoanCost = sbaTotalLoanCost + sellerTotalLoanCost;
    const remainingEbitdaAfterLoanPayments = ebitda - totalAnnualLoanPayments;
    const ebitdaMultiple = purchasePrice / ebitda;

    // Update the HTML elements with calculated values
    const updateValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            let valueString = id === 'ebitdaMultiple' 
                ? `${value.toFixed(1)}` 
                : `${value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            
            // Store the current value
            element.innerHTML = valueString;

            // Add saved scenario markers
            savedScenarios.forEach(scenario => {
                const savedValue = scenario.values[id];
                if (savedValue) {
                    element.innerHTML += ` <span class="saved-scenario" style="color: ${scenario.color};">${savedValue.currentValue}</span>`;
                }
            });
        }
    };

    // Update slider outputs with saved scenarios
    slidersConfig.forEach(config => {
        const sliderElement = document.getElementById(`${config.id}Slider`);
        const outputElement = document.getElementById(`${config.id}Output`);
        
        if (outputElement && sliderElement) {
            const currentValue = sliderElement.noUiSlider.get();
            outputElement.innerHTML = currentValue;

            // Add saved scenario markers
            savedScenarios.forEach(scenario => {
                const savedValue = scenario.values[config.id];
                if (savedValue) {
                    outputElement.innerHTML += ` <span class="saved-scenario" style="color: ${scenario.color};">${savedValue.sliderValue || savedValue.currentValue}</span>`;
                }
            });
        }
    });

    // Update all calculated values
    calculatedValuesConfig.forEach(config => {
        const value = {
            'downPaymentValue': downPayment,
            'sellerNoteValue': sellerNote,
            'needToFinanceValue': needToFinance,
            'cashToSellerValue': cashToSeller,
            'sbaLoanValue': sbaLoanAmount,
            'sbaMonthlyPayment': sbaMonthlyPayment,
            'sbaAnnualPayment': sbaAnnualPayment,
            'sbaTotalLoanCost': sbaTotalLoanCost,
            'sellerNoteMonthlyPayment': sellerNoteMonthlyPayment,
            'sellerNoteAnnualPayment': sellerNoteAnnualPayment,
            'sellerTotalLoanCost': sellerTotalLoanCost,
            'totalAnnualLoanPayments': totalAnnualLoanPayments,
            'totalLoanCost': totalLoanCost,
            'remainingEbitdaAfterLoanPayments': remainingEbitdaAfterLoanPayments,
            'ebitdaMultiple': ebitdaMultiple
        }[config.id];

        updateValue(config.id, value);
    });
}

// Initialize sliders in the variables container
function initializeSliders() {
    const variablesContainer = document.getElementById('variablesContainer');
    variablesContainer.innerHTML = ''; // Clear existing content

    slidersConfig.forEach(config => {
        const container = document.createElement('div');
        container.classList.add('slider-container');
        container.innerHTML = `
            <label for="${config.id}">${config.label}</label>
            <div id="${config.id}Slider"></div>
            <div id="${config.id}Output" class="value-output"></div>
        `;
        variablesContainer.appendChild(container);

        const slider = document.getElementById(`${config.id}Slider`);

        noUiSlider.create(slider, {
            start: [config.start],
            range: {
                min: config.rangeMin,
                max: config.rangeMax
            },
            step: config.step,
            format: {
                to: value => `${config.format.includes('$') ? '$' : ''}${Math.round(value).toLocaleString()}${config.format.includes('%') ? '%' : config.format.includes('years') ? ' years' : ''}`,
                from: value => Number(value.replace(/[^0-9.-]+/g, ""))
            }
        });

        slider.noUiSlider.on('update', (values, handle) => {
            updateSliderOutput(config.id, values[handle]);
            calculateValues();
        });
    });
}

// Initialize calculated values in the calculated values container
function initializeCalculatedValues() {
    const calculatedValuesContainer = document.getElementById('calculatedValuesContainer');
    calculatedValuesContainer.innerHTML = ''; // Clear existing content

    calculatedValuesConfig.forEach(config => {
        const container = document.createElement('div');
        container.classList.add('slider-container');
        container.innerHTML = `
            <label for="${config.id}">${config.label}</label>
            <div id="${config.id}" class="value-output">$0</div>
        `;
        calculatedValuesContainer.appendChild(container);
    });
}

function createScenario() {
    const availableColors = SCENARIO_COLORS.filter(
        color => !savedScenarios.some(scenario => scenario.color === color)
    );
    
    const color = availableColors.length > 0 
        ? availableColors[0] 
        : SCENARIO_COLORS[Math.floor(Math.random() * SCENARIO_COLORS.length)];

    const scenario = { 
        id: Date.now(),
        color: color,
        timestamp: new Date().toLocaleString(),
        values: {} 
    };

    // Correctly capture slider values
    slidersConfig.forEach(config => {
        const sliderElement = document.getElementById(`${config.id}Slider`);
        
        if (sliderElement && sliderElement.noUiSlider) {
            scenario.values[config.id] = {
                sliderValue: sliderElement.noUiSlider.get()
            };
        }
    });

    // Capture calculated values
    calculatedValuesConfig.forEach(config => {
        const element = document.getElementById(config.id);
        
        if (element) {
            // Get the first value before any saved scenario markers
            const firstValue = element.textContent.split(' ')[0].trim();
            
            scenario.values[config.id] = {
                currentValue: firstValue
            };
        }
    });

    return scenario;
}

// Modify saveScenario function to trigger immediate calculation and display
function saveScenario() {
    const newScenario = createScenario();

    savedScenarios.push(newScenario);
    if (savedScenarios.length > MAX_SAVED_SCENARIOS) {
        savedScenarios.shift();
    }

    // Trigger immediate calculation and display of saved scenarios
    calculateValues();

    return newScenario;
}

/**
 * Deletes the last scenario that was saved.
 * If there are no scenarios to delete, it logs a message indicating so.
 */
function deleteScenario() {
    if (savedScenarios.length > 0) {
        savedScenarios.pop();
        console.log('Last scenario deleted');
    } else {
        console.log('No scenarios to delete');
    }
    calculateValues();
}

/**
 * Exports the saved scenarios to a CSV file and triggers a download.
 * If no scenarios are saved, it logs a message indicating so.
 */
function exportScenarios() {
    if (savedScenarios.length === 0) {
        console.log('No scenarios to export');
        return;
    }

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = Object.keys(savedScenarios[0].values).join(",") + "\n";
    csvContent += headers;

    savedScenarios.forEach(scenario => {
        const row = Object.keys(scenario.values)
            .map(key => {
                const value = scenario.values[key];
                // Check if the value is an object with a sliderValue or currentValue
                if (typeof value === 'object') {
                    return value.sliderValue ? value.sliderValue.replace(/,/g, '') : value.currentValue.replace(/,/g, '');
                }
                return '';
            })
            .join(",");
        csvContent += row + "\n";
    });

    // Create a link to download the CSV file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scenarios.csv");
    document.body.appendChild(link);

    // Trigger the download
    link.click();
    console.log('CSV file created and download triggered');

    // Clean up by removing the link
    document.body.removeChild(link);
    console.log('Temporary download link removed');
}


function loadScenarios() {
    // Define some test scenarios with sample data
    const testScenarios = [
        {
            "id": Date.now(),
            "color": "#FF6B6B",
            "timestamp": "10/11/2023, 10:00:00 AM",
            "values": {
                "purchasePrice": { "sliderValue": "1,000,000" },
                "downPayment": { "sliderValue": "10%" },
                "sellerNote": { "sliderValue": "10%" },
                "ebitda": { "sliderValue": "250,000" },
                "sbaInterestRate": { "sliderValue": "10%" },
                "sbaLoanTerm": { "sliderValue": "10 years" },
                "sellerNoteInterestRate": { "sliderValue": "5%" },
                "sellerNoteTerm": { "sliderValue": "10 years" },
                "downPaymentValue": { "currentValue": "$100,000" },
                "sellerNoteValue": { "currentValue": "$100,000" },
                "needToFinanceValue": { "currentValue": "$800,000" },
                "cashToSellerValue": { "currentValue": "$900,000" },
                "sbaLoanValue": { "currentValue": "$800,000" },
                "sbaMonthlyPayment": { "currentValue": "$10,000" },
                "sbaAnnualPayment": { "currentValue": "$120,000" },
                "sbaTotalLoanCost": { "currentValue": "$1,200,000" },
                "sellerNoteMonthlyPayment": { "currentValue": "$1,000" },
                "sellerNoteAnnualPayment": { "currentValue": "$12,000" },
                "sellerTotalLoanCost": { "currentValue": "$120,000" },
                "totalAnnualLoanPayments": { "currentValue": "$132,000" },
                "totalLoanCost": { "currentValue": "$1,320,000" },
                "remainingEbitdaAfterLoanPayments": { "currentValue": "$118,000" },
                "ebitdaMultiple": { "currentValue": "4.0" }
            }
        },
        {
            "id": Date.now()+1,
            "color": "#4ECDC4",
            "timestamp": "10/11/2023, 11:00:00 AM",
            "values": {
                "purchasePrice": { "sliderValue": "1,500,000" },
                "downPayment": { "sliderValue": "15%" },
                "sellerNote": { "sliderValue": "5%" },
                "ebitda": { "sliderValue": "300,000" },
                "sbaInterestRate": { "sliderValue": "8%" },
                "sbaLoanTerm": { "sliderValue": "15 years" },
                "sellerNoteInterestRate": { "sliderValue": "6%" },
                "sellerNoteTerm": { "sliderValue": "10 years" },
                "downPaymentValue": { "currentValue": "$225,000" },
                "sellerNoteValue": { "currentValue": "$75,000" },
                "needToFinanceValue": { "currentValue": "$1,200,000" },
                "cashToSellerValue": { "currentValue": "$1,275,000" },
                "sbaLoanValue": { "currentValue": "$1,200,000" },
                "sbaMonthlyPayment": { "currentValue": "$11,000" },
                "sbaAnnualPayment": { "currentValue": "$132,000" },
                "sbaTotalLoanCost": { "currentValue": "$1,980,000" },
                "sellerNoteMonthlyPayment": { "currentValue": "$1,200" },
                "sellerNoteAnnualPayment": { "currentValue": "$14,400" },
                "sellerTotalLoanCost": { "currentValue": "$144,000" },
                "totalAnnualLoanPayments": { "currentValue": "$146,400" },
                "totalLoanCost": { "currentValue": "$2,124,000" },
                "remainingEbitdaAfterLoanPayments": { "currentValue": "$153,600" },
                "ebitdaMultiple": { "currentValue": "5.0" }
            }
        },
        {
            "id": Date.now()+2,
            "color": "#45B7D1",
            "timestamp": "10/11/2023, 12:00:00 PM",
            "values": {
                "purchasePrice": { "sliderValue": "2,500,000" },
                "downPayment": { "sliderValue": "20%" },
                "sellerNote": { "sliderValue": "15%" },
                "ebitda": { "sliderValue": "500,000" },
                "sbaInterestRate": { "sliderValue": "9%" },
                "sbaLoanTerm": { "sliderValue": "20 years" },
                "sellerNoteInterestRate": { "sliderValue": "7%" },
                "sellerNoteTerm": { "sliderValue": "15 years" },
                "downPaymentValue": { "currentValue": "$500,000" },
                "sellerNoteValue": { "currentValue": "$375,000" },
                "needToFinanceValue": { "currentValue": "$1,625,000" },
                "cashToSellerValue": { "currentValue": "$2,125,000" },
                "sbaLoanValue": { "currentValue": "$1,625,000" },
                "sbaMonthlyPayment": { "currentValue": "$13,500" },
                "sbaAnnualPayment": { "currentValue": "$162,000" },
                "sbaTotalLoanCost": { "currentValue": "$3,240,000" },
                "sellerNoteMonthlyPayment": { "currentValue": "$2,500" },
                "sellerNoteAnnualPayment": { "currentValue": "$30,000" },
                "sellerTotalLoanCost": { "currentValue": "$450,000" },
                "totalAnnualLoanPayments": { "currentValue": "$192,000" },
                "totalLoanCost": { "currentValue": "$3,690,000" },
                "remainingEbitdaAfterLoanPayments": { "currentValue": "$308,000" },
                "ebitdaMultiple": { "currentValue": "5.0" }
            }
        }
    ];

    // Load the test scenarios into the savedScenarios array
    savedScenarios.push(...testScenarios);

    // Trigger a recalculation to update the display with preloaded scenarios
    calculateValues();
}

// Document ready initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sliders and calculated values
    initializeSliders();
    initializeCalculatedValues();

    // Set up save scenario button listener
    document.getElementById('saveScenarioButton').addEventListener('click', () => {
        const savedScenario = saveScenario();
        console.log('Scenario saved:', savedScenario);
    });
    
    // Set up delete scenario button listener
    document.getElementById('deleteScenarioButton').addEventListener('click', () => {
        deleteScenario();
    });

    // Set up export scenario button listener
    document.getElementById('exportScenariosButton').addEventListener('click', () => {
        exportScenarios();
    });
    
    // Set up export scenario button listener
    document.getElementById('loadScenariosButton').addEventListener('click', () => {
        loadScenarios();
    });
});