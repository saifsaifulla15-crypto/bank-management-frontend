const BASE_URL = "https://bank-management-xyn9.onrender.com";
/**
 * Core API request function
 */
async function apiRequest(endpoint, options = {}) {
    const defaultHeaders = {
        "Content-Type": "application/json",
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        // Some backends might return empty bodies for DELETE
        if (response.status === 204) return null;
        
        const data = await response.json();

        if (!response.ok) {
            // Throw error with the message provided by the backend ResponseStructure
            throw new Error(data.message || "Something went wrong");
        }

        // Return the whole ResponseStructure (statusCode, message, data)
        return data;
    } catch (error) {
        if (error.name === "TypeError" && error.message === "Failed to fetch") {
            throw new Error("Cannot connect to server. Please ensure the backend is running and CORS is configured.");
        }
        throw error;
    }
}

/**
 * Bank API Service
 */
const BankAPI = {
    getAllBanks: () => apiRequest("/bank"),
    getBankById: (id) => apiRequest(`/bank/${id}`),
    createBank: (bankData) => apiRequest("/bank", { method: "POST", body: JSON.stringify(bankData) }),
    deleteBank: (id) => apiRequest(`/bank/${id}`, { method: "DELETE" }),
    getBanksPaged: (page, size, field) => apiRequest(`/bank/${page}/${size}/${field}`),
    getBankByIfsc: (ifsc) => apiRequest(`/bank/ifsc/${ifsc}`),
    getBanksByCity: (city) => apiRequest(`/bank/city/${city}`),
    getBankByContact: (number) => apiRequest(`/bank/num/${number}`)
};

/**
 * Account API Service
 */
const AccountAPI = {
    getAllAccounts: () => apiRequest("/account"),
    getAccountById: (id) => apiRequest(`/account/${id}`),
    createAccount: (accountData) => apiRequest("/account", { method: "POST", body: JSON.stringify(accountData) }),
    deleteAccount: (id) => apiRequest(`/account/${id}`, { method: "DELETE" }),
    getAccountsByBankId: (bankId) => apiRequest(`/account/bank/${bankId}`),
    getAccountsPaged: (page, size) => apiRequest(`/account/page/${page}/${size}`),
    getAccountsByType: (type) => apiRequest("/account/type", {
        headers: { "value": type }
    }),
    
    // Transactions
    deposit: (transactionData) => apiRequest("/account/deposite", { method: "POST", body: JSON.stringify(transactionData) }),
    withdraw: (transactionData) => apiRequest("/account/withdrawl/acc", { method: "POST", body: JSON.stringify(transactionData) }),
    transfer: (transactionData) => apiRequest("/account/transfer", { method: "POST", body: JSON.stringify(transactionData) })
};
