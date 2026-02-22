// Test verification script for debt snowball calculations
// Run: node test-calculation.js

function calculatePayoff(debts, method, extra = 0) {
    // Deep copy
    debts = debts.map(d => ({...d, balance: d.balance, originalBalance: d.balance, paidOff: null}));
    
    // Sort debts
    if (method === 'snowball') {
        debts.sort((a, b) => a.balance - b.balance);
    } else {
        debts.sort((a, b) => b.rate - a.rate);
    }

    let month = 0;
    let totalInterest = 0;
    const timeline = [];
    const maxMonths = 600;
    const startDate = new Date();

    console.log(`\n=== ${method.toUpperCase()} METHOD ===`);
    console.log(`Initial debts:`, debts.map(d => `${d.name}: $${d.balance} @ ${d.rate}%`));

    while (month < maxMonths) {
        month++;
        let monthInterest = 0;
        let extraPayment = extra;
        
        console.log(`\n--- Month ${month} ---`);

        // Pay minimums on all
        debts.forEach(debt => {
            if (debt.balance > 0.01) {
                const monthlyRate = debt.rate / 100 / 12;
                const interest = debt.balance * monthlyRate;
                monthInterest += interest;
                
                console.log(`${debt.name}: Balance $${debt.balance.toFixed(2)}, Interest $${interest.toFixed(2)}`);
                
                // Apply minimum payment
                const payment = Math.min(debt.payment, debt.balance + interest);
                const principalPaid = payment - interest;
                debt.balance = debt.balance - principalPaid;
                
                console.log(`  Payment: $${payment.toFixed(2)} ($${interest.toFixed(2)} interest, $${principalPaid.toFixed(2)} principal)`);
                console.log(`  New balance: $${Math.max(0, debt.balance).toFixed(2)}`);

                if (debt.balance <= 0.01) {
                    debt.balance = 0;
                    if (!debt.paidOff) {
                        debt.paidOff = month;
                        const date = new Date(startDate);
                        date.setMonth(date.getMonth() + month);
                        timeline.push({ month, date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), debt: debt.name });
                        console.log(`  🎉 ${debt.name} PAID OFF!`);
                    }
                }
            }
        });

        totalInterest += monthInterest;

        // Apply extra to first non-zero debt
        for (let debt of debts) {
            if (debt.balance > 0.01) {
                console.log(`Applying extra $${extraPayment.toFixed(2)} to ${debt.name}`);
                debt.balance = Math.max(0, debt.balance - extraPayment);
                if (debt.balance <= 0.01 && !debt.paidOff) {
                    debt.paidOff = month;
                    const date = new Date(startDate);
                    date.setMonth(date.getMonth() + month);
                    timeline.push({ month, date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), debt: debt.name });
                    console.log(`  🎉 ${debt.name} PAID OFF with extra payment!`);
                }
                break;
            }
        }

        if (debts.every(d => d.balance <= 0.01)) {
            console.log(`\n✅ ALL DEBTS PAID OFF in ${month} months!`);
            break;
        }
        
        if (month > 120) {
            console.log(`\n⚠️ Stopped after 120 months (10 years)`);
            break;
        }
    }

    const finalDate = new Date(startDate);
    finalDate.setMonth(finalDate.getMonth() + month);

    return { 
        months: month, 
        totalInterest, 
        timeline, 
        finalDate,
        debts: debts.map(d => ({ name: d.name, paidOff: d.paidOff, balance: d.balance }))
    };
}

// Test Case 1: Single debt
console.log("TEST CASE 1: Single Credit Card");
console.log("================================");
const test1 = [
    { name: "Credit Card", balance: 5000, payment: 100, rate: 18, originalBalance: 5000 }
];

const result1 = calculatePayoff(JSON.parse(JSON.stringify(test1)), 'snowball', 0);
console.log(`\n📊 RESULTS:`);
console.log(`Months to payoff: ${result1.months}`);
console.log(`Total interest: $${result1.totalInterest.toFixed(2)}`);
console.log(`Debt-free date: ${result1.finalDate.toLocaleDateString()}`);

// Test Case 2: Two debts with snowball
console.log("\n\nTEST CASE 2: Two Debts - Snowball");
console.log("==================================");
const test2 = [
    { name: "Credit Card", balance: 3000, payment: 75, rate: 18, originalBalance: 3000 },
    { name: "Car Loan", balance: 10000, payment: 250, rate: 6, originalBalance: 10000 }
];

const result2Snowball = calculatePayoff(JSON.parse(JSON.stringify(test2)), 'snowball', 0);
console.log(`\n📊 SNOWBALL RESULTS:`);
console.log(`Months to payoff: ${result2Snowball.months}`);
console.log(`Total interest: $${result2Snowball.totalInterest.toFixed(2)}`);
console.log(`Payoff order:`, result2Snowball.debts.map(d => `${d.name} (month ${d.paidOff})`));

const result2Avalanche = calculatePayoff(JSON.parse(JSON.stringify(test2)), 'avalanche', 0);
console.log(`\n📊 AVALANCHE RESULTS:`);
console.log(`Months to payoff: ${result2Avalanche.months}`);
console.log(`Total interest: $${result2Avalanche.totalInterest.toFixed(2)}`);
console.log(`Payoff order:`, result2Avalanche.debts.map(d => `${d.name} (month ${d.paidOff})`));

// Test Case 3: With extra payment
console.log("\n\nTEST CASE 3: With Extra $200/month");
console.log("===================================");
const result3 = calculatePayoff(JSON.parse(JSON.stringify(test2)), 'snowball', 200);
console.log(`\n📊 RESULTS with $200 extra:`);
console.log(`Months to payoff: ${result3.months}`);
console.log(`Total interest: $${result3.totalInterest.toFixed(2)}`);
console.log(`Time saved: ${result2Snowball.months - result3.months} months`);
console.log(`Interest saved: $${(result2Snowball.totalInterest - result3.totalInterest).toFixed(2)}`);
