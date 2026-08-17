/**
 * Logic for Accounts Page (accounts.html)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on the accounts page
    if (!document.getElementById('accounts-table')) return;

    let currentPage = 0;
    let pageSize = 10;
    let isFiltered = false; // To know if we are rendering paged data or filtered list

    // DOM Elements
    const tbody = document.querySelector('#accounts-table tbody');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const filterType = document.getElementById('filter-type');
    const resetBtn = document.getElementById('reset-btn');
    const paginationControls = document.getElementById('pagination-controls');

    // Load Initial Data
    loadAccounts();

    // Event Listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    filterType.addEventListener('change', performTypeFilter);
    
    resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterType.value = '';
        currentPage = 0;
        isFiltered = false;
        loadAccounts();
    });

    async function loadAccounts() {
        setLoadingState();
        isFiltered = false;
        try {
            // Using the pagination endpoint: /account/page/{pageNumber}/{pageSize}
            const response = await AccountAPI.getAccountsPaged(currentPage, pageSize);
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
            if (!isFiltered) loadAccounts();
            return;
        }

        setLoadingState();
        isFiltered = true;
        
        try {
            // Search by Account ID for now
            // In a real app we'd have a dedicated search endpoint for accountNumber or name
            if (!isNaN(query)) {
                const res = await AccountAPI.getAccountById(query);
                const data = res.data ? [res.data] : [];
                
                if (data.length === 0) {
                    setEmptyState(`No accounts found for ID: ${query}`);
                } else {
                    renderTable(data);
                }
                paginationControls.innerHTML = ''; 
            } else {
                setEmptyState("Please enter a valid numeric Account ID");
                paginationControls.innerHTML = '';
            }
        } catch (error) {
            if (error.message.includes('IdNotFoundException') || error.message.includes('not found')) {
                setEmptyState(`No accounts found for ID: ${query}`);
            } else {
                setErrorState(error.message);
            }
            paginationControls.innerHTML = '';
        }
    }

    async function performTypeFilter() {
        const type = filterType.value;
        if (!type) {
            loadAccounts();
            return;
        }

        setLoadingState();
        isFiltered = true;
        
        try {
            const res = await AccountAPI.getAccountsByType(type);
            const data = res.data || [];

            if (data.length === 0) {
                setEmptyState(`No accounts found of type: ${type}`);
            } else {
                renderTable(data);
            }
            paginationControls.innerHTML = ''; // Hide pagination for filtered results
        } catch (error) {
            setErrorState(error.message);
            paginationControls.innerHTML = '';
        }
    }

    function renderTable(accounts) {
        tbody.innerHTML = accounts.map(acc => {
            let badgeClass = 'primary';
            let typeName = acc.accountType;
            if (acc.accountType === 'SAVINGS') { badgeClass = 'savings'; }
            else if (acc.accountType === 'CURRENT_TYPE') { badgeClass = 'CURRENT_TYPE'; }
            else if (acc.accountType === 'FIXED_DEPOSITE') { badgeClass = 'fixed'; typeName = 'FIXED DEPOSIT'; }

            return `
                <tr>
                    <td>${acc.accountId}</td>
                    <td style="font-family: monospace; font-weight: 600;">${acc.accountNumber}</td>
                    <td style="font-weight: 500;">${acc.accountHolderName}</td>
                    <td>
                        <span class="account-type-badge account-type-${badgeClass}">${typeName}</span>
                    </td>
                    <td style="font-weight: 600; color: var(--success);">${formatCurrency(acc.balance)}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <a href="account-details.html?id=${acc.accountId}" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                <i class="fas fa-eye"></i> View
                            </a>
                            <button onclick="promptDeleteAccount(${acc.accountId})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderPagination(pageData) {
        const { totalPages, number: CURRENT_TYPE, totalElements } = pageData;
        
        let html = `
            <button class="page-btn" ${CURRENT_TYPE === 0 ? 'disabled' : ''} onclick="changePage(${CURRENT_TYPE - 1})">
                <i class="fas fa-chevron-left"></i> Prev
            </button>
            <span class="page-info">Page ${CURRENT_TYPE + 1} of ${totalPages} (${totalElements} total)</span>
            <button class="page-btn" ${CURRENT_TYPE >= totalPages - 1 ? 'disabled' : ''} onclick="changePage(${CURRENT_TYPE + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;
        paginationControls.innerHTML = html;
    }

    window.changePage = (newPage) => {
        currentPage = newPage;
        loadAccounts();
    };

    window.promptDeleteAccount = (id) => {
        Modal.show({
            title: 'Confirm Delete',
            body: 'Are you sure you want to delete this account? This action cannot be undone.',
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await AccountAPI.deleteAccount(id);
                    showToast('Account deleted successfully', 'success');
                    if (isFiltered) {
                        // Re-run the active filter/search
                        if (searchInput.value) performSearch();
                        else if (filterType.value) performTypeFilter();
                    } else {
                        loadAccounts();
                    }
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
                    <div class="mt-2 text-muted">Loading accounts...</div>
                </td>
            </tr>
        `;
    }

    function setEmptyState(msg = 'No accounts found.') {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 3rem;">
                    <div class="empty-state">
                        <i class="fas fa-users" style="color: var(--border);"></i>
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
