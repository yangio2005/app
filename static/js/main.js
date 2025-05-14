/**
 * Main JavaScript functionality for Student Management System
 */

// Initialize Bootstrap tooltips and popovers
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Bootstrap popovers
    const popoverTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="popover"]')
    );
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Handle confirm dialogs
    setupConfirmDialogs();
    
    // Setup date range pickers if they exist
    setupDatePickers();
    
    // Setup responsive tables
    setupResponsiveTables();
});

/**
 * Set up confirmation dialogs for delete actions
 */
function setupConfirmDialogs() {
    const confirmButtons = document.querySelectorAll('[data-confirm]');
    
    confirmButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm') || 'Are you sure you want to proceed?';
            
            if (!confirm(message)) {
                e.preventDefault();
                return false;
            }
            return true;
        });
    });
}

/**
 * Set up date pickers for forms
 */
function setupDatePickers() {
    // Use native date inputs with some enhancements
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        // Set default date to today if empty and has data-default-today
        if (input.hasAttribute('data-default-today') && !input.value) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            input.value = `${year}-${month}-${day}`;
        }
    });
}

/**
 * Make tables responsive
 */
function setupResponsiveTables() {
    const tables = document.querySelectorAll('table.table');
    
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-responsive')) {
            // Wrap table in responsive container if not already wrapped
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

/**
 * Search functionality for tables
 */
function searchTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) return;
    
    input.addEventListener('keyup', function() {
        const searchText = this.value.toLowerCase();
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchText) ? '' : 'none';
        });
        
        // Check if any rows are visible
        const visibleRows = table.querySelectorAll('tbody tr[style=""]');
        const noResultsRow = table.querySelector('tr.no-results');
        
        if (visibleRows.length === 0 && !noResultsRow) {
            // Add "no results" row
            const tbody = table.querySelector('tbody');
            const colSpan = table.querySelector('thead tr').children.length;
            
            const newRow = document.createElement('tr');
            newRow.className = 'no-results';
            const cell = document.createElement('td');
            cell.colSpan = colSpan;
            cell.textContent = 'No matching records found';
            cell.className = 'text-center text-muted py-3';
            
            newRow.appendChild(cell);
            tbody.appendChild(newRow);
        } else if (visibleRows.length > 0 && noResultsRow) {
            // Remove "no results" row
            noResultsRow.remove();
        }
    });
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info', timeout = 5000) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    if (timeout > 0) {
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }, timeout);
    }
}

/**
 * Export table to CSV file
 */
function exportTableToCSV(tableId, filename = 'export.csv') {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    // Get all table rows
    const rows = table.querySelectorAll('tr');
    
    // Prepare CSV content
    let csv = [];
    
    rows.forEach(row => {
        // Skip hidden rows
        if (row.style.display === 'none') return;
        
        const rowData = [];
        const cols = row.querySelectorAll('td, th');
        
        cols.forEach(col => {
            // Get text content and escape quotes
            let text = col.textContent.trim().replace(/"/g, '""');
            // Wrap with quotes if contains comma, newline or quotes
            if (text.includes(',') || text.includes('\n') || text.includes('"')) {
                text = `"${text}"`;
            }
            rowData.push(text);
        });
        
        csv.push(rowData.join(','));
    });
    
    // Create CSV content
    const csvContent = csv.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Set file name
    if (!filename.endsWith('.csv')) {
        filename += '.csv';
    }
    
    // Create and trigger download
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
