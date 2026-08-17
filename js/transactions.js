/**
 * Logic for Transaction Pages (deposit.html, withdraw.html, transfer.html)
 */

document.addEventListener('DOMContentLoaded', () => {

    // Clear errors on input
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('input', () => clearError(input));
    });

    // 1. DEPOSIT FORM
    const depositForm = document.getElementById('deposit-form');
    if (depositForm) {
        depositForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            
            clearAllErrors(depositForm);
            let isValid = true;

            const accountId = depositForm.accountId.value;
            if (!accountId) { showError(depositForm.accountId, 'Please enter Account ID'); isValid = false; }

            const accountNumber = depositForm.accountNumber.value.trim();
            if (!accountNumber) { showError(depositForm.accountNumber, 'Please enter Account Number'); isValid = false; }

            const amount = parseFloat(depositForm.amount.value);
            if (isNaN(amount) || amount <= 0) { showError(depositForm.amount, 'Amount must be greater than 0'); isValid = false; }

            if (!isValid) return;

            const payload = { 
                accountId: parseInt(accountId), 
                accountNumber, 
                amount 
            };

            console.log("Deposit Request body:", payload);

            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading-spinner" style="width: 1rem; height: 1rem; border-width: 2px;"></span> Processing...';
            submitBtn.disabled = true;

            try {
                const response = await AccountAPI.deposit(payload);
                showToast(response.message || 'Deposit successful!', 'success');
                showSuccessResult('Deposit Successful', amount, response.data);
                depositForm.reset();
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
            }
        });
    }

    // 2. WITHDRAW FORM
    const withdrawForm = document.getElementById('withdraw-form');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            
            clearAllErrors(withdrawForm);
            let isValid = true;

            const accountId = withdrawForm.accountId.value;
            if (!accountId) { showError(withdrawForm.accountId, 'Please enter Account ID'); isValid = false; }

            const accountNumber = withdrawForm.accountNumber.value.trim();
            if (!accountNumber) { showError(withdrawForm.accountNumber, 'Please enter Account Number'); isValid = false; }

            const amount = parseFloat(withdrawForm.amount.value);
            if (isNaN(amount) || amount <= 0) { showError(withdrawForm.amount, 'Amount must be greater than 0'); isValid = false; }

            if (!isValid) return;

            const payload = { 
                accountId: parseInt(accountId), 
                accountNumber, 
                amount 
            };

            console.log("Withdraw Request body:", payload);

            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading-spinner" style="width: 1rem; height: 1rem; border-width: 2px;"></span> Processing...';
            submitBtn.disabled = true;

            try {
                const response = await AccountAPI.withdraw(payload);
                showToast(response.message || 'Withdrawal successful!', 'success');
                showSuccessResult('Withdrawal Successful', amount, response.data);
                withdrawForm.reset();
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
            }
        });
    }

    // 3. TRANSFER FORM
    const transferForm = document.getElementById('transfer-form');
    if (transferForm) {
        const previewBtn = document.getElementById('preview-btn');
        
        previewBtn.addEventListener('click', () => {
            clearAllErrors(transferForm);
            let isValid = true;

            const fromAccountId = transferForm.fromAccountId.value;
            if (!fromAccountId) { showError(transferForm.fromAccountId, 'Source Account ID required'); isValid = false; }

            const fromAccountNumber = transferForm.fromAccountNumber.value.trim();
            if (!fromAccountNumber) { showError(transferForm.fromAccountNumber, 'Source Account Number required'); isValid = false; }

            const toAccountId = transferForm.toAccountId.value;
            if (!toAccountId) { showError(transferForm.toAccountId, 'Destination Account ID required'); isValid = false; }

            const toAccountNumber = transferForm.toAccountNumber.value.trim();
            if (!toAccountNumber) { showError(transferForm.toAccountNumber, 'Destination Account Number required'); isValid = false; }

            if (fromAccountId === toAccountId && fromAccountId) {
                showError(transferForm.toAccountId, 'Cannot transfer to the same account'); 
                isValid = false; 
            }

            const amount = parseFloat(transferForm.amount.value);
            if (isNaN(amount) || amount <= 0) { showError(transferForm.amount, 'Amount must be greater than 0'); isValid = false; }

            if (!isValid) return;

            const payload = { 
                accountId: parseInt(fromAccountId), 
                accountNumber: fromAccountNumber, 
                toAccountId: parseInt(toAccountId),
                toAccountNumber: toAccountNumber,
                amount 
            };

            console.log("Transfer Request body:", payload);

            // Show Confirmation Modal
            Modal.show({
                title: 'Confirm Transfer',
                body: `
                    <div style="background: var(--background); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span class="text-muted">From Account:</span>
                            <strong>${fromAccountNumber} (ID: ${fromAccountId})</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span class="text-muted">To Account:</span>
                            <strong>${toAccountNumber} (ID: ${toAccountId})</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                            <span class="text-muted">Transfer Amount:</span>
                            <strong style="color: #3b82f6; font-size: 1.25rem;">${formatCurrency(amount)}</strong>
                        </div>
                    </div>
                    <p style="font-size: 0.9rem;">Please verify the details above. This action cannot be reversed.</p>
                `,
                confirmText: 'Confirm Transfer',
                onConfirm: async () => {
                    try {
                        const response = await AccountAPI.transfer(payload);
                        showToast(response.message || 'Transfer completed successfully!', 'success');
                        
                        const summary = `
                            <p style="margin-bottom: 1rem;">Transferred <strong>${formatCurrency(amount)}</strong> to ${toAccountNumber}.</p>
                            <a href="account-details.html?id=${fromAccountId}" class="btn btn-outline">View Source Account</a>
                        `;
                        
                        const resultDiv = document.getElementById('tx-result');
                        resultDiv.innerHTML = `
                            <i class="fas fa-check-circle" style="color: var(--success); font-size: 3rem; margin-bottom: 1rem;"></i>
                            <h3 style="margin-bottom: 0.5rem; color: var(--success);">Transfer Successful</h3>
                            ${summary}
                        `;
                        resultDiv.classList.add('active');
                        transferForm.reset();
                    } catch (error) {
                        showToast(error.message, 'error');
                        throw error;
                    }
                }
            });
        });
    }

    function showSuccessResult(title, amount, updatedAccount) {
        const resultDiv = document.getElementById('tx-result');
        if (!resultDiv) return;

        let newBalanceHtml = '';
        if (updatedAccount && updatedAccount.balance !== undefined) {
            newBalanceHtml = `<p>New Balance: <strong>${formatCurrency(updatedAccount.balance)}</strong></p>`;
        }

        resultDiv.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success); font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem; color: var(--success);">${title}</h3>
            <p style="margin-bottom: 1rem;">Amount: <strong>${formatCurrency(amount)}</strong></p>
            ${newBalanceHtml}
            <button class="btn btn-outline mt-4" onclick="document.getElementById('tx-result').classList.remove('active')">Make Another Transaction</button>
        `;
        resultDiv.classList.add('active');
    }
});
