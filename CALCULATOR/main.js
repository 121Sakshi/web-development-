// Get the display element
const display = document.getElementById("display");

// Initialize variables to store current input and operation
let currentInput = "";
let previousInput = "";
let operator = null;

// Function to update the display
function updateDisplay(value) {
    display.textContent = value || "0";
}

// Function to handle button clicks
function handleButtonClick(value) {
    if (!isNaN(value)) {
        // If the value is a number, append it to the current input
        currentInput += value;
    } else if (value === "C") {
        // Clear everything
        currentInput = "";
        previousInput = "";
        operator = null;
    } else if (value === "=") {
        // Calculate the result
        if (currentInput && previousInput && operator) {
            const result = calculate(previousInput, currentInput, operator);
            currentInput = result.toString();
            previousInput = "";
            operator = null;
        }
    } else {
        // Handle operators (+, -, *, /)
        if (currentInput) {
            if (previousInput) {
                // If there's already a previous input, calculate the intermediate result
                previousInput = calculate(previousInput, currentInput, operator).toString();
            } else {
                previousInput = currentInput;
            }
            operator = value;
            currentInput = "";
        }
    }
    updateDisplay(currentInput || previousInput);
}

// Function to perform the calculation
function calculate(a, b, operator) {
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);
    switch (operator) {
        case "+":
            return num1 + num2;
        case "-":
            return num1 - num2;
        case "*":
            return num1 * num2;
        case "/":
            return num2 !== 0 ? num1 / num2 : "Error";
        default:
            return 0;
    }
}

// Attach event listeners to the buttons
document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("click", () => {
        const value = button.getAttribute("data-value");
        handleButtonClick(value);
    });
});
