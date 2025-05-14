/**
 * QR Code Generator functionality 
 * Using the QRCode.js library for generating 2D and 3D QR codes
 */

class QRGenerator {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = Object.assign({
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H, // High error correction
            mode: '2d' // '2d' or '3d'
        }, options);
        
        this.qrInstance = null;
    }
    
    generate(data, mode = null) {
        // Clear previous QR code
        if (this.container) {
            this.container.innerHTML = '';
            
            // Set mode if provided
            if (mode) {
                this.options.mode = mode;
            }
            
            if (this.options.mode === '3d') {
                // Generate 3D QR code
                this.generate3D(data);
            } else {
                // Generate 2D QR code
                this.generate2D(data);
            }
        }
    }
    
    generate2D(data) {
        // Create new QR code instance
        this.qrInstance = new QRCode(this.container, {
            text: data,
            width: this.options.width,
            height: this.options.height,
            colorDark: this.options.colorDark,
            colorLight: this.options.colorLight,
            correctLevel: this.options.correctLevel
        });
    }
    
    generate3D(data) {
        // First generate a regular QR code
        this.generate2D(data);
        
        // Wait for the QR code to render
        setTimeout(() => {
            // Get the canvas element created by QRCode.js
            const canvas = this.container.querySelector('canvas');
            
            if (canvas) {
                // Create a new canvas for 3D effect
                const canvas3D = document.createElement('canvas');
                canvas3D.width = canvas.width;
                canvas3D.height = canvas.height;
                const ctx3D = canvas3D.getContext('2d');
                
                // Create 3D effect
                this.apply3DEffect(canvas, canvas3D, ctx3D);
                
                // Replace original canvas with 3D version
                canvas.parentNode.replaceChild(canvas3D, canvas);
            }
        }, 100);
    }
    
    apply3DEffect(sourceCanvas, targetCanvas, targetCtx) {
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        const ctx = sourceCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Clear target canvas
        targetCtx.clearRect(0, 0, width, height);
        
        // Draw base layer (slightly darker)
        targetCtx.drawImage(sourceCanvas, 2, 2);
        targetCtx.globalCompositeOperation = 'source-atop';
        targetCtx.fillStyle = 'rgba(0,0,0,0.3)';
        targetCtx.fillRect(0, 0, width, height);
        
        // Reset composite operation
        targetCtx.globalCompositeOperation = 'source-over';
        
        // Draw top layer
        targetCtx.drawImage(sourceCanvas, 0, 0);
        
        // Apply emboss effect
        const embossData = targetCtx.getImageData(0, 0, width, height);
        const embossPixels = embossData.data;
        
        // Loop through each pixel
        for (let i = 0; i < data.length; i += 4) {
            const isBlack = data[i] < 128;
            
            if (isBlack) {
                // Add highlight
                embossPixels[i - 4] = 70;  // R
                embossPixels[i - 3] = 70;  // G
                embossPixels[i - 2] = 70;  // B
                
                // Darken the actual pixel
                embossPixels[i] = 0;     // R
                embossPixels[i + 1] = 0; // G
                embossPixels[i + 2] = 0; // B
            }
        }
        
        targetCtx.putImageData(embossData, 0, 0);
    }
    
    downloadQR(filename = 'qrcode') {
        const canvas = this.container.querySelector('canvas');
        if (canvas) {
            // Create download link
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    }
}

// Initialize QR generators when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create QR generators for any QR container elements
    const qrContainers = document.querySelectorAll('[id^="qr-container-"]');
    
    qrContainers.forEach(container => {
        const containerId = container.id;
        const studentId = containerId.split('-').pop();
        
        // Create generator for this container
        const generator = new QRGenerator(containerId, {
            width: 256,
            height: 256,
            mode: '2d' // Default to 2D
        });
        
        // Store generator instance in window object
        if (!window.qrGenerators) {
            window.qrGenerators = {};
        }
        window.qrGenerators[studentId] = generator;
        
        // Fetch QR data from server
        fetch(`/api/students/${studentId}/qr-data`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Generate QR code with the data
                    generator.generate(data.qr_data);
                    
                    // Setup mode toggle if it exists
                    const modeToggle = document.getElementById(`qr-mode-toggle-${studentId}`);
                    if (modeToggle) {
                        modeToggle.addEventListener('click', function() {
                            const currentMode = this.dataset.mode;
                            const newMode = currentMode === '2d' ? '3d' : '2d';
                            
                            // Update button text
                            this.textContent = `Switch to ${currentMode.toUpperCase()} QR`;
                            this.dataset.mode = newMode;
                            
                            // Regenerate QR code
                            generator.generate(data.qr_data, newMode);
                        });
                    }
                    
                    // Setup download button if it exists
                    const downloadBtn = document.getElementById(`qr-download-${studentId}`);
                    if (downloadBtn) {
                        downloadBtn.addEventListener('click', function() {
                            generator.downloadQR(`qrcode_${data.student_id}`);
                        });
                    }
                }
            })
            .catch(error => console.error('Error fetching QR data:', error));
    });
});
