// Global variables
let socket;
let currentSessionId = null;
let downloadLinks = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSocketConnection();
    setupFileUpload();
    setupDragAndDrop();
    setupTemplateDownload();
});

// Initialize Socket.IO connection
function initializeSocketConnection() {
    socket = io();
    
    socket.on('connect', function() {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from server');
    });
    
    socket.on('progress', function(data) {
        handleProgressUpdate(data);
    });
}

// Setup file upload functionality
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
        }
    });
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    
    dropZone.addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    });
}

// Setup template download functionality
function setupTemplateDownload() {
    const downloadTemplateBtn = document.getElementById('downloadTemplate');
    
    downloadTemplateBtn.addEventListener('click', function() {
        downloadTemplate();
    });
}

// Download Excel template
function downloadTemplate() {
    try {
        // Create a temporary link to download the template
        const link = document.createElement('a');
        link.href = '/template';
        link.download = 'IncomeTax_Challan_Template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('📥 Template download started!', 'success');
    } catch (error) {
        console.error('Template download error:', error);
        showAlert('Failed to download template. Please try again.', 'danger');
    }
}

// Upload file to server
async function uploadFile(file) {
    // Validate file
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        showAlert('Please select an Excel file (.xlsx)', 'danger');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showAlert('File size must be less than 10MB', 'danger');
        return;
    }
    
    const formData = new FormData();
    formData.append('excelFile', file);
    
    try {
        showProgressSection();
        updateStatus('📤 Uploading file...', 5);
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentSessionId = result.sessionId;
            socket.emit('join-session', currentSessionId);
            
            updateStatus('✅ File uploaded successfully. Processing started...', 10);
            addLogEntry(`File uploaded: ${result.filename}`);
            
        } else {
            throw new Error(result.error || 'Upload failed');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('Upload failed: ' + error.message, 'danger');
        resetForm();
    }
}

// Handle progress updates from server
function handleProgressUpdate(data) {
    const { message, progress, data: additionalData } = data;
    
    addLogEntry(message);
    
    if (progress !== null && progress >= 0) {
        updateProgress(progress);
        updateStatus(message, progress);
    }
    
    // Handle completion
    if (progress === 100 && additionalData) {
        handleCompletion(additionalData);
    }
    
    // Handle error
    if (progress === -1) {
        handleError(additionalData);
    }
    
    // Update stats if available
    if (additionalData && (additionalData.processed !== undefined)) {
        updateStats(additionalData);
    }
}

// Handle automation completion
function handleCompletion(data) {
    updateStatus('🎉 Processing completed successfully!', 100);
    
    // Store download links
    downloadLinks = data.downloadLinks;
    
    // Setup download buttons
    setupDownloadButtons();
    
    // Show download section
    showDownloadSection();
    
    // Show final stats
    updateStats(data);
    
    addLogEntry(`✅ Automation completed! Processed: ${data.processed}, Successful: ${data.successful}, Failed: ${data.failed}`);
}

// Handle errors
function handleError(errorData) {
    updateStatus('❌ Processing failed', -1);
    showAlert('Processing failed: ' + (errorData?.error || 'Unknown error'), 'danger');
    addLogEntry(`❌ Error: ${errorData?.error || 'Unknown error'}`);
}

// Update progress bar and status
function updateProgress(progress) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    progressBar.setAttribute('aria-valuenow', progress);
}

function updateStatus(message, progress) {
    const statusElement = document.getElementById('currentStatus');
    
    if (progress >= 0 && progress < 100) {
        statusElement.innerHTML = `<span class="spinner"></span> ${message}`;
    } else if (progress === 100) {
        statusElement.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${message}`;
    } else {
        statusElement.innerHTML = `<i class="fas fa-exclamation-circle text-danger"></i> ${message}`;
    }
}

// Update statistics
function updateStats(data) {
    if (data.processed !== undefined) {
        document.getElementById('processedCount').textContent = data.processed;
        document.getElementById('statsGrid').style.display = 'grid';
    }
    if (data.successful !== undefined) {
        document.getElementById('successCount').textContent = data.successful;
    }
    if (data.failed !== undefined) {
        document.getElementById('failedCount').textContent = data.failed;
    }
}

// Add log entry
function addLogEntry(message) {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Setup download buttons
function setupDownloadButtons() {
    document.getElementById('downloadExcel').onclick = () => downloadFile('excel');
    document.getElementById('downloadPDFs').onclick = () => downloadFile('pdfs');
    document.getElementById('downloadReport').onclick = () => downloadFile('report');
}

// Download file
function downloadFile(type) {
    if (downloadLinks[type]) {
        window.open(downloadLinks[type], '_blank');
    } else {
        showAlert('Download link not available', 'warning');
    }
}

// Show/hide sections
function showProgressSection() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('downloadSection').style.display = 'none';
}

function showDownloadSection() {
    document.getElementById('downloadSection').style.display = 'block';
}

function showUploadSection() {
    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('downloadSection').style.display = 'none';
}

// Reset form
function resetForm() {
    currentSessionId = null;
    downloadLinks = {};
    
    // Reset file input
    document.getElementById('fileInput').value = '';
    
    // Reset progress
    updateProgress(0);
    updateStatus('Waiting for file upload...', 0);
    
    // Clear logs
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML = '<div class="log-entry"><span class="timestamp">[System]</span> Ready for new upload...</div>';
    
    // Reset stats
    document.getElementById('processedCount').textContent = '0';
    document.getElementById('successCount').textContent = '0';
    document.getElementById('failedCount').textContent = '0';
    document.getElementById('statsGrid').style.display = 'none';
    
    // Show upload section
    showUploadSection();
}

// Show alert
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of main container
    const mainContainer = document.querySelector('.main-container');
    mainContainer.insertBefore(alertDiv, mainContainer.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
