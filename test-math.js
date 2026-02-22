// Test calculation accuracy
// Run: node test-math.js

function calculatePayoff(debts, method, extra = 0) {
    // Deep copy
    debts = debts.map(d => ({...d, balance: parseFloat(d.balance), paidOff: null}));
    
    // Sort debts
    if (method === 'snowball') debts.sort((a, b) => a.balance - b.balance);
    else debts.sort((a, b) => b.rate - a.rate);

    let month = 0;
    let totalInterest = 0;
    const timeline = [];
    const monthlyBreakdown = [];
    const maxMonths = 600;
    const startDate = new Date();
    const originalTotal = debts.reduce((sum, d) => sum + d.balance, 0);

    while (month < maxMonths) {
        month++;
        let monthInterest = 0;
        let extraPayment = extra;
        const targetDebt = debts.find(d => d.balance > 0.01);

        // Pay minimums on all
        debts.forEach(debt => {
            if (debt.balance > 0.01) {
                const monthlyRate = debt.rate / 100 / 12;
                const interest = debt.balance * monthlyRate;
                monthInterest += interest;
                debt.balance += interest;
                const payment = Math.min(debt.payment, debt.balance);
                debt.balance -= payment;

                if (debt.balance <= 0.01) {
                    debt.balance = 0;
                    if (!debt.paidOff) {
                        debt.paidOff = month;
                        timeline.push({ month, debt: debt.name });
                    }
                }
            }
        });

        totalInterest += monthInterest;

        // Apply extra payment - rolls to next debt in same month
        let extraApplied = 0;
        for (let debt of debts) {
            if (debt.balance > 0.01 && extraPayment > 0) {
                const payment = Math.min(extraPayment, debt.balance);
                debt.balance -= payment;
                extraPayment -= payment;
                extraApplied += payment;
                if (debt.balance <= 0.01 && !debt.paidOff) {
                    debt.balance = 0;
                    debt.paidOff = month;
                    timeline.push({ month, debt: debt.name });
                }
                if (extraPayment <= 0) break;
            }
        }

        monthlyBreakdown.push({
            month,
            total: debts.reduce((sum, d) => sum + (d.balance > 0 ? d.payment : 0), 0) + extraApplied
        });

        if (debts.every(d => d.balance <= 0.01)) break;
    }

    // Verification: Total paid should equal original + interest
    const totalPaid = monthlyBreakdown.reduce((sum, m) => sum + m.total, 0);
    
    return { 
        months: month, 
        totalInterest,
        totalPaid,
        originalTotal,
        timeline,
        debts
    };
}

// Test Case 1: Simple single debt
console.log('\n=== TEST 1: Single Debt ===');
const test1 = [{ name: 'Credit Card', balance: 5000, payment: 100, rate: 18 }];
const result1 = calculatePayoff([...test1], 'snowball', 0);
console.log(`Original: $${test1[0].balance}`);
console.log(`Total Interest: $${result1.totalInterest.toFixed(2)}`);
console.log(`Total Paid: $${result1.totalPaid.toFixed(2)}`);
console.log(`Months: ${result1.months}`);
console.log(`Verification: $${(result1.originalTotal + result1.totalInterest).toFixed(2)} should equal $${result1.totalPaid.toFixed(2)}`);
console.log(`Match: ${Math.abs((result1.originalTotal + result1.totalInterest) - result1.totalPaid) < 1 ? '✅ PASS' : '❌ FAIL'}`);

// Test Case 2: Two debts with extra payment
console.log('\n=== TEST 2: Two Debts + $200 Extra ===');
const test2 = [
    { name: 'Card 1', balance: 3000, payment: 75, rate: 20 },
    { name: 'Card 2', balance: 5000, payment: 100, rate: 15 }
];
const snowball = calculatePayoff([...test2.map(d => ({...d}))], 'snowball', 200);
const avalanche = calculatePayoff([...test2.map(d => ({...d}))], 'avalanche', 200);
console.log(`Snowball: ${snowball.months} months, $${snowball.totalInterest.toFixed(2)} interest`);
console.log(`Avalanche: ${avalanche.months} months, $${avalanche.totalInterest.toFixed(2)} interest`);
console.log(`Avalanche saves: $${(snowball.totalInterest - avalanche.totalInterest).toFixed(2)} in interest`);
console.log(`Avalanche ${snowball.months === avalanche.months ? 'same time' : avalanche.months < snowball.months ? 'faster' : 'slower'}`);

// Test Case 3: Verify extra payment rolls correctly
console.log('\n=== TEST 3: Extra Payment Roll Over ===');
const test3 = [
    { name: 'Small', balance: 500, payment: 50, rate: 20 },
    { name: 'Large', balance: 5000, payment: 100, rate: 10 }
];
const result3 = calculatePayoff([...test3.map(d => ({...d}))], 'snowball', 500);
console.log(`Small debt paid off month: ${result3.debts.find(d => d.name === 'Small').paidOff}`);
console.log(`Should be month 1 with $550 payment ($50 min + $500 extra)`);
console.log(`Large debt should start getting payments in month 2`);

console.log('\n=== All Tests Complete ===\n');
