document.addEventListener('DOMOContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Initialize character counter
    const qrContent = document.getElementById('qr-content');
    const charCounter = document.getElementById('char-counter');
    
    qrContent.addEventListener('input', () => {
        charCounter.textContent = qrContent.value.length;
    });
    
    // Trigger initial count
    charCounter.textContent = qrContent.value.length;
    
    // Update range value displays
    const qrSize = document.getElementById('qr-size');
    const sizeValue = document.getElementById('size-value');
    const qrMargin = document.getElementById('qr-margin');
    const marginValue = document.getElementById('margin-value');
    
    qrSize.addEventListener('input', () => {
        sizeValue.textContent = `${qrSize.value}px`;
    });
    
    qrMargin.addEventListener('input', () => {
        marginValue.textContent = qrMargin.value;
    });
    
    // Preset button handlers
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const content = button.getAttribute('data-content');
            qrContent.value = content;
            charCounter.textContent = content.length;
        });
    });
    
    // Generate QR code
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const qrImage = document.getElementById('qr-image');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const loadingOverlay = document.getElementById('loading');
    
    generateBtn.addEventListener('click', generateQRCode);
    
    async function generateQRCode() {
        const content = qrContent.value.trim();
        
        if (!content) {
            alert('Please enter content to generate QR code');
            qrContent.focus();
            return;
        }
        
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Get customization values
        const size = document.getElementById('qr-size').value;
        const margin = document.getElementById('qr-margin').value;
        const color = document.getElementById('qr-color').value;
        const backgroundColor = document.getElementById('bg-color').value;
        
        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: content,
                    size: size,
                    margin: margin,
                    color: color,
                    backgroundColor: backgroundColor
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show QR code image
                qrImage.src = data.qrCode;
                qrImage.style.display = 'block';
                qrPlaceholder.style.display = 'none';
                
                // Enable download button
                downloadBtn.disabled = false;
                
                // Update QR info
                updateQRInfo(content, size);
            } else {
                alert('Failed to generate QR code: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Failed to generate QR code. Please check your connection and try again.');
        } finally {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Download QR code
    downloadBtn.addEventListener('click', downloadQRCode);
    
    async function downloadQRCode() {
        const content = qrContent.value.trim();
        
        if (!content) {
            alert('No QR code to download. Please generate one first.');
            return;
        }
        
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Get customization values
        const size = document.getElementById('qr-size').value;
        const margin = document.getElementById('qr-margin').value;
        const color = document.getElementById('qr-color').value;
        const backgroundColor = document.getElementById('bg-color').value;
        
        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: content,
                    size: size,
                    margin: margin,
                    color: color,
                    backgroundColor: backgroundColor
                })
            });
            
            if (response.ok) {
                // Create a blob from the response
                const blob = await response.blob();
                
                // Create a download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                // Generate filename
                const filename = `qr-code-${Date.now()}.png`;
                a.download = filename;
                
                // Trigger download
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorData = await response.json();
                alert('Failed to download QR code: ' + (errorData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error downloading QR code:', error);
            alert('Failed to download QR code. Please check your connection and try again.');
        } finally {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Reset button handler
    resetBtn.addEventListener('click', resetForm);
    
    function resetForm() {
        qrContent.value = 'https://example.com';
        charCounter.textContent = qrContent.value.length;
        
        document.getElementById('qr-size').value = 400;
        document.getElementById('size-value').textContent = '400px';
        
        document.getElementById('qr-margin').value = 4;
        document.getElementById('margin-value').textContent = '4';
        
        document.getElementById('qr-color').value = '#000000';
        document.getElementById('bg-color').value = '#FFFFFF';
        
        qrImage.style.display = 'none';
        qrPlaceholder.style.display = 'block';
        
        downloadBtn.disabled = true;
        
        // Reset QR info
        document.getElementById('content-type').textContent = '-';
        document.getElementById('info-size').textContent = '-';
        document.getElementById('generated-time').textContent = '-';
    }
    
    // Update QR code information
    function updateQRInfo(content, size) {
        // Detect content type
        let contentType = 'Text';
        if (content.startsWith('http://') || content.startsWith('https://')) {
            contentType = 'URL';
        } else if (content.startsWith('mailto:')) {
            contentType = 'Email';
        } else if (content.startsWith('TEL:')) {
            contentType = 'Phone';
        } else if (content.includes('@') && content.includes('.') && !content.includes(' ')) {
            contentType = 'Email (without mailto)';
        } else if (/^\d+$/.test(content.replace(/\D/g, '')) && content.replace(/\D/g, '').length >= 7) {
            contentType = 'Phone (without TEL:)';
        }
        
        document.getElementById('content-type').textContent = contentType;
        document.getElementById('info-size').textContent = `${size} × ${size} pixels`;
        document.getElementById('generated-time').textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    // Initialize with a sample QR code on page load
    setTimeout(() => {
        generateQRCode();
    }, 500);
});