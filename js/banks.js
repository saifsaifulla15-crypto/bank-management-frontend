/**
 * Logic for Banks Page (banks.html)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on the banks page
    if (!document.getElementById('banks-table')) return;

    let currentPage = 0;
    let pageSize = 10;
    let currentField = 'bankId'; // Default sort field

    // DOM Elements
    const tbody = document.querySelector('#banks-table tbody');
    const searchInput = document.getElementById('search-input');
    const searchType = document.getElementById('search-type');
    const searchBtn = document.getElementById('search-btn');
    const resetBtn = document.getElementById('reset-btn');
    const paginationControls = document.getElementById('pagination-controls');

    // Load Initial Data
    loadBanks();

    // Event Listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentPage = 0;
        loadBanks();
    });

    async function loadBanks() {
        setLoadingState();
        try {
            // Using the pagination endpoint: /bank/{pageNumber}/{pageSize}/{FieldName}
            const response = await BankAPI.getBanksPaged(currentPage, pageSize, currentField);
            const pageData = response.data;
            
            if (!pageData || !pageData.content || pageData.content.length === 0) {
                setEmptyState();
                paginationControls.innerHTML = '';
                return;
            }

            renderTable(pageData.content);
            renderPagination(pageData);
        } catch (error) {
            setErrorState(error.message);
            paginationControls.innerHTML = '';
        }
    }

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            loadBanks();
            return;
        }

        const type = searchType.value;
        setLoadingState();
        
        try {
            let data = null;
            if (type === 'ifsc') {
                const res = await BankAPI.getBankByIfsc(query);
                data = res.data ? [res.data] : [];
            } else if (type === 'city') {
                const res = await BankAPI.getBanksByCity(query);
                data = res.data || [];
            } else if (type === 'contact') {
                const res = await BankAPI.getBankByContact(query);
                data = res.data ? [res.data] : [];
            }

            if (!data || data.length === 0) {
                setEmptyState(`No banks found matching ${type}: ${query}`);
                paginationControls.innerHTML = '';
            } else {
                renderTable(data);
                paginationControls.innerHTML = ''; // Hide pagination for search results
            }
        } catch (error) {
            if (error.message.includes('NoRecordAvailableException') || error.message.includes('not found')) {
                setEmptyState(`No banks found matching ${type}: ${query}`);
            } else {
                setErrorState(error.message);
            }
            paginationControls.innerHTML = '';
        }
    }

    function renderTable(banks) {
        tbody.innerHTML = banks.map(bank => `
            <tr>
                <td>${bank.bankId}</td>
                <td style="font-weight: 500;">${bank.bankName}</td>
                <td style="font-family: monospace;">${bank.ifsc}</td>
                <td>${bank.branchName}</td>
                <td style="font-weight: 600; color: var(--success);">${formatCurrency(bank.balance)}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="bank-details.html?id=${bank.bankId}" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            <i class="fas fa-eye"></i> View
                        </a>
                        <button onclick="promptDeleteBank(${bank.bankId})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderPagination(pageData) {
        const { totalPages, number: current, totalElements } = pageData;
        
        let html = `
            <button class="page-btn" ${current === 0 ? 'disabled' : ''} onclick="changePage(${current - 1})">
                <i class="fas fa-chevron-left"></i> Prev
            </button>
            <span class="page-info">Page ${current + 1} of ${totalPages} (${totalElements} total)</span>
            <button class="page-btn" ${current >= totalPages - 1 ? 'disabled' : ''} onclick="changePage(${current + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;
        paginationControls.innerHTML = html;
    }

    window.changePage = (newPage) => {
        currentPage = newPage;
        loadBanks();
    };

    window.promptDeleteBank = (id) => {
        Modal.show({
            title: 'Confirm Delete',
            body: 'Are you sure you want to delete this bank? All associated accounts will also be affected.',
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: async () => {
                console.log("Selected Bank ID for deletion:", id);
                console.log("Sending Bank ID:", id);
                try {
                    await BankAPI.deleteBank(id);
                    showToast('Bank deleted successfully', 'success');
                    // Reload current page, or previous if current is now empty
                    loadBanks();
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
        });
    };

    function setLoadingState() {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 3rem;">
                    <div class="loading-spinner"></div>
                    <div class="mt-2 text-muted">Loading banks...</div>
                </td>
            </tr>
        `;
    }

    function setEmptyState(msg = 'No banks found.') {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 3rem;">
                    <div class="empty-state">
                        <i class="fas fa-building" style="color: var(--border);"></i>
                        <p>${msg}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function setErrorState(msg) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 3rem;">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle" style="color: var(--error);"></i>
                        <p style="color: var(--error);">${msg}</p>
                        <button class="btn btn-outline mt-2" onclick="location.reload()">Retry</button>
                    </div>
                </td>
            </tr>
        `;
    }
});
