/**
 * Utility functions for Bank Management System
 */

// Format currency in INR
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}

// Toast Notifications
function showToast(message, type = 'success') {
    // Check if container exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${iconClass} toast-icon"></i>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Custom Modal
const Modal = {
    show: (options) => {
        const { title, body, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, isDanger = false } = options;
        
        let overlay = document.querySelector('.modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        const confirmBtnClass = isDanger ? 'btn-danger' : 'btn-primary';
        
        overlay.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">${title}</h3>
                <div class="modal-body">${body}</div>
                <div class="modal-actions">
                    <button class="btn btn-outline" id="modal-cancel-btn">${cancelText}</button>
                    <button class="btn ${confirmBtnClass}" id="modal-confirm-btn">${confirmText}</button>
                </div>
            </div>
        `;

        // Event listeners
        const cancelBtn = overlay.querySelector('#modal-cancel-btn');
        const confirmBtn = overlay.querySelector('#modal-confirm-btn');

        const closeModal = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.innerHTML = '', 300);
        };

        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', async () => {
            if (onConfirm) {
                // disable button during processing
                confirmBtn.innerHTML = '<span class="loading-spinner" style="width: 1rem; height: 1rem; border-width: 2px;"></span> Processing...';
                confirmBtn.disabled = true;
                
                try {
                    await onConfirm();
                    closeModal();
                } catch (error) {
                    confirmBtn.innerHTML = confirmText;
                    confirmBtn.disabled = false;
                }
            } else {
                closeModal();
            }
        });

        // Show modal
        requestAnimationFrame(() => overlay.classList.add('active'));
    }
};

// Form Validation Helpers
function showError(inputElement, message) {
    inputElement.classList.add('is-invalid');
    let errorEl = inputElement.nextElementSibling;
    if (!errorEl || !errorEl.classList.contains('error-message')) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        inputElement.parentNode.insertBefore(errorEl, inputElement.nextSibling);
    }
    errorEl.textContent = message;
}

function clearError(inputElement) {
    inputElement.classList.remove('is-invalid');
    const errorEl = inputElement.nextElementSibling;
    if (errorEl && errorEl.classList.contains('error-message')) {
        errorEl.remove();
    }
}

function clearAllErrors(formElement) {
    const inputs = formElement.querySelectorAll('.is-invalid');
    inputs.forEach(clearError);
}

// Sidebar Mobile Toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
});
