/**
 * QR Code Scanner functionality
 * Uses jsQR library to scan QR codes from camera feed
 */

class QRScanner {
    constructor(videoElement, canvasElement, scanCallback) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.canvasContext = this.canvas.getContext('2d');
        this.scanCallback = scanCallback;
        this.scanning = false;
        this.lastScannedCode = null;
        this.lastScannedTime = 0;
        this.scanInterval = 500; // Minimum time (ms) between successful scans
    }

    async startScanning() {
        try {
            // Request camera access
            const constraints = {
                video: {
                    facingMode: "environment", // Use the back camera when available
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;
            this.video.setAttribute('playsinline', true); // Required for iOS
            this.video.play();
            
            this.scanning = true;
            requestAnimationFrame(() => this.scanFrame());
            
            return true;
        } catch (error) {
            console.error('Error starting camera:', error);
            return false;
        }
    }

    stopScanning() {
        this.scanning = false;
        
        // Stop the video stream
        if (this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    scanFrame() {
        if (!this.scanning) return;

        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            // Set canvas dimensions to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // Draw video frame to canvas
            this.canvasContext.drawImage(
                this.video, 
                0, 
                0, 
                this.canvas.width, 
                this.canvas.height
            );
            
            // Get image data for QR scanning
            const imageData = this.canvasContext.getImageData(
                0, 
                0, 
                this.canvas.width, 
                this.canvas.height
            );
            
            // Scan for QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            // Process the detected QR code
            if (code) {
                // Draw border around detected QR code
                this.drawQRBoundary(code.location, '#00FF00');
                
                const currentTime = new Date().getTime();
                
                // Rate limit successful scans to avoid duplicates
                if (code.data !== this.lastScannedCode || 
                    (currentTime - this.lastScannedTime > this.scanInterval)) {
                    this.lastScannedCode = code.data;
                    this.lastScannedTime = currentTime;
                    
                    // Call the callback with the scanned data
                    if (this.scanCallback) {
                        this.scanCallback(code.data);
                    }
                }
            }
        }
        
        // Continue scanning
        if (this.scanning) {
            requestAnimationFrame(() => this.scanFrame());
        }
    }

    drawQRBoundary(location, color) {
        // Draw lines between the corners
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
        this.canvasContext.lineTo(location.topRightCorner.x, location.topRightCorner.y);
        this.canvasContext.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
        this.canvasContext.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
        this.canvasContext.lineTo(location.topLeftCorner.x, location.topLeftCorner.y);
        this.canvasContext.lineWidth = 4;
        this.canvasContext.strokeStyle = color;
        this.canvasContext.stroke();
        
        // Draw corner points
        [
            location.topLeftCorner,
            location.topRightCorner,
            location.bottomRightCorner,
            location.bottomLeftCorner
        ].forEach(corner => {
            this.canvasContext.beginPath();
            this.canvasContext.arc(corner.x, corner.y, 8, 0, 2 * Math.PI);
            this.canvasContext.fillStyle = color;
            this.canvasContext.fill();
        });
    }
}

// Global scanner instance
let qrScanner = null;

// Initialize QR scanner when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const videoElement = document.getElementById('qr-video');
    const canvasElement = document.getElementById('qr-canvas');
    const scanButton = document.getElementById('start-scan-button');
    const scanForm = document.getElementById('scan-form');
    const scanDataField = document.getElementById('scanned-data');
    const scanResults = document.getElementById('scan-results');
    
    if (videoElement && canvasElement) {
        // Initialize scanner
        qrScanner = new QRScanner(
            videoElement, 
            canvasElement, 
            function(data) {
                // Handle successful scan
                console.log('QR Code detected:', data);
                
                // Play success sound
                const audio = new Audio('https://cdn.jsdelivr.net/npm/beepbeep@1.0.0/beep-s.wav');
                audio.play().catch(e => console.log('Audio play failed:', e));
                
                // Populate form field with scanned data
                if (scanDataField) {
                    scanDataField.value = data;
                    
                    // Submit the form if it exists
                    if (scanForm) {
                        // If we're in the attendance form
                        const activityId = document.getElementById('activity_id').value;
                        
                        // Submit the data via AJAX
                        fetch('/attendance/scan', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            body: new URLSearchParams({
                                'activity_id': activityId,
                                'scanned_data': data,
                                'csrf_token': document.querySelector('input[name="csrf_token"]').value
                            })
                        })
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                // Add to the scanned list
                                const student = result.student;
                                
                                const attendanceList = document.getElementById('attendance-list');
                                if (attendanceList) {
                                    const listItem = document.createElement('li');
                                    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                                    listItem.innerHTML = `
                                        <div>
                                            <strong>${student.name}</strong> 
                                            <small class="text-muted">(${student.student_id})</small>
                                        </div>
                                        <span class="badge bg-success">Recorded</span>
                                    `;
                                    attendanceList.prepend(listItem);
                                }
                                
                                // Show success message
                                showAlert(result.message, 'success');
                            } else {
                                // Show error message
                                showAlert(result.message, 'danger');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showAlert('Error recording attendance', 'danger');
                        });
                    }
                }
            }
        );
        
        // Start scanning when button is clicked
        if (scanButton) {
            scanButton.addEventListener('click', function() {
                // Toggle scanning
                if (!qrScanner.scanning) {
                    qrScanner.startScanning().then(success => {
                        if (success) {
                            scanButton.textContent = 'Stop Scanning';
                            scanButton.classList.replace('btn-primary', 'btn-danger');
                            showAlert('QR scanner is active', 'info');
                        } else {
                            showAlert('Failed to start camera. Please check permissions.', 'danger');
                        }
                    });
                } else {
                    qrScanner.stopScanning();
                    scanButton.textContent = 'Start Scanning';
                    scanButton.classList.replace('btn-danger', 'btn-primary');
                }
            });
        }
    }
});

// Helper function to show alerts
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 300);
    }, 5000);
}
