// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded, initializing QR Code Generator...");
    console.log("User Agent:", navigator.userAgent);
    console.log("Touch supported:", 'ontouchstart' in window);
    console.log("Screen size:", window.innerWidth, "x", window.innerHeight);
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Initialize character counter
    const qrContent = document.getElementById('qr-content');
    const charCounter = document.getElementById('char-counter');
    
    qrContent.addEventListener('input', function() {
        charCounter.textContent = this.value.length;
    });
    
    // Set initial character count
    charCounter.textContent = qrContent.value.length;
    
    // Update range value displays
    const qrSize = document.getElementById('qr-size');
    const sizeValue = document.getElementById('size-value');
    const qrMargin = document.getElementById('qr-margin');
    const marginValue = document.getElementById('margin-value');
    
    qrSize.addEventListener('input', function() {
        sizeValue.textContent = this.value + 'px';
    });
    
    qrMargin.addEventListener('input', function() {
        marginValue.textContent = this.value;
    });
    
    // Preset button handlers
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(function(button) {
        // Add both click and touch events for mobile
        button.addEventListener('click', handlePresetClick);
        button.addEventListener('touchend', handlePresetClick);
        
        function handlePresetClick(e) {
            e.preventDefault();
            const content = button.getAttribute('data-content');
            qrContent.value = content;
            charCounter.textContent = content.length;
            // Optional: Auto-generate on preset selection
            // generateQRCode();
        }
    });
    
    // Get references to buttons and elements
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const qrImage = document.getElementById('qr-image');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const loadingOverlay = document.getElementById('loading');
    
    // Add event listeners to buttons - BOTH click and touch for mobile
    generateBtn.addEventListener('click', generateQRCode);
    generateBtn.addEventListener('touchend', generateQRCode);
    
    downloadBtn.addEventListener('click', downloadQRCode);
    downloadBtn.addEventListener('touchend', downloadQRCode);
    
    resetBtn.addEventListener('click', resetForm);
    resetBtn.addEventListener('touchend', resetForm);
    
    console.log("Event listeners attached to buttons");
    
    // Prevent unwanted touch behaviors
    document.addEventListener('touchstart', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.tagName === 'INPUT') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Generate QR code function
    function generateQRCode() {
        console.log("Generate button clicked");
        
        const content = qrContent.value.trim();
        if (!content) {
            alert('Please enter content to generate QR code');
            qrContent.focus();
            return;
        }
        
        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            alert('QR Code library failed to load. Please check your internet connection and refresh the page.');
            console.error('QRCode library not loaded');
            return;
        }
        
        // Show loading
        loadingOverlay.style.display = 'flex';
        
        // Get values
        const size = parseInt(document.getElementById('qr-size').value);
        const color = document.getElementById('qr-color').value;
        const backgroundColor = document.getElementById('bg-color').value;
        
        // Adjust size for mobile performance
        const adjustedSize = Math.min(size, window.innerWidth > 768 ? 800 : 300);
        
        console.log("Generating QR code with content:", content.substring(0, 50) + "...");
        console.log("Size:", adjustedSize, "px, Color:", color, "BG:", backgroundColor);
        
        // Create a temporary container for QR generation
        const tempContainerId = 'temp-qr-' + Date.now();
        const tempDiv = document.createElement('div');
        tempDiv.id = tempContainerId;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        // Add timeout for mobile slow connections
        const generationTimeout = setTimeout(() => {
            loadingOverlay.style.display = 'none';
            if (document.getElementById(tempContainerId)) {
                document.body.removeChild(tempDiv);
            }
            alert('QR generation is taking too long. Your connection might be slow. Please try again.');
            console.warn('QR generation timeout');
        }, 15000); // 15 second timeout for mobile
        
        try {
            // Clear previous content in temp div
            tempDiv.innerHTML = '';
            
            // Generate QR code
            const qr = new QRCode(tempDiv, {
                text: content,
                width: adjustedSize,
                height: adjustedSize,
                colorDark: color,
                colorLight: backgroundColor,
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Wait for QR to generate
            setTimeout(() => {
                clearTimeout(generationTimeout);
                
                const qrImg = tempDiv.querySelector('img');
                if (qrImg && qrImg.src && qrImg.src.length > 0) {
                    console.log("QR image generated successfully, src length:", qrImg.src.length);
                    
                    // Set the image source directly
                    qrImage.src = qrImg.src;
                    qrImage.width = adjustedSize;
                    qrImage.height = adjustedSize;
                    qrImage.style.display = 'block';
                    
                    // Hide placeholder
                    qrPlaceholder.style.display = 'none';
                    
                    // Enable download button
                    downloadBtn.disabled = false;
                    
                    // Update info
                    updateQRInfo(content, adjustedSize);
                    console.log("QR code displayed successfully!");
                } else {
                    console.error('QR code image not found or has no src');
                    // Try alternative approach
                    const qrCanvas = tempDiv.querySelector('canvas');
                    if (qrCanvas) {
                        console.log("Found canvas instead of img, converting...");
                        // Convert canvas to data URL
                        qrImage.src = qrCanvas.toDataURL('image/png');
                        qrImage.width = adjustedSize;
                        qrImage.height = adjustedSize;
                        qrImage.style.display = 'block';
                        qrPlaceholder.style.display = 'none';
                        downloadBtn.disabled = false;
                        updateQRInfo(content, adjustedSize);
                    } else {
                        alert('Failed to generate QR code image. Please try again.');
                    }
                }
                
                // Clean up temp div
                if (document.getElementById(tempContainerId)) {
                    document.body.removeChild(tempDiv);
                }
                loadingOverlay.style.display = 'none';
                
            }, 300); // Wait longer for mobile
            
        } catch (error) {
            clearTimeout(generationTimeout);
            loadingOverlay.style.display = 'none';
            // Clean up temp div if it exists
            if (document.getElementById(tempContainerId)) {
                document.body.removeChild(tempDiv);
            }
            console.error('Error generating QR code:', error);
            alert('Failed to generate QR code: ' + error.message);
        }
    }
    
    // Download QR code function with mobile support
    function downloadQRCode() {
        console.log("Download button clicked");
        
        // Check if QR image is visible
        if (!qrImage || qrImage.style.display === 'none' || !qrImage.src) {
            alert('Please generate a QR code first before downloading.');
            return;
        }
        
        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log("Is mobile device:", isMobile);
        
        if (isMobile) {
            // Mobile download approach
            mobileDownloadQR();
        } else {
            // Desktop download approach
            desktopDownloadQR();
        }
    }
    
    function desktopDownloadQR() {
        // Create a temporary canvas for download
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
        
        // Create new image to avoid CORS issues
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            // Draw image to canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Create download link
            const link = document.createElement('a');
            const filename = 'qr-code-' + Date.now() + '.png';
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log("QR code downloaded as:", filename);
        };
        
        img.onerror = function() {
            alert('Error loading QR code for download. Please generate it again.');
            console.error('Image load error for download');
        };
        
        img.src = qrImage.src;
    }
    
    function mobileDownloadQR() {
        // For mobile devices, show instructions to save
        const mobileSaveWindow = window.open('', '_blank');
        const saveHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Save QR Code</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: #f5f5f5;
                        text-align: center;
                    }
                    .container {
                        max-width: 500px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 10px;
                        padding: 30px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h2 {
                        color: #2c3e50;
                        margin-bottom: 20px;
                    }
                    .qr-image {
                        max-width: 100%;
                        height: auto;
                        border: 2px solid #ddd;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .instructions {
                        text-align: left;
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .instructions h3 {
                        margin-top: 0;
                        color: #3498db;
                    }
                    button {
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 20px;
                    }
                    @media (max-width: 480px) {
                        body { padding: 10px; }
                        .container { padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Save Your QR Code</h2>
                    <img src="${qrImage.src}" class="qr-image" alt="QR Code">
                    
                    <div class="instructions">
                        <h3>How to save on mobile:</h3>
                        <p><strong>On iPhone/iPad:</strong></p>
                        <ol>
                            <li>Tap and hold the QR code image above</li>
                            <li>Select "Save Image" from the menu</li>
                            <li>The image will save to your Photos app</li>
                        </ol>
                        
                        <p><strong>On Android:</strong></p>
                        <ol>
                            <li>Long press the QR code image above</li>
                            <li>Select "Download image" or "Save image"</li>
                            <li>The image will save to your Downloads folder</li>
                        </ol>
                    </div>
                    
                    <button onclick="window.close()">Close Window</button>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        If the image doesn't appear, check if your browser allows pop-ups.
                    </p>
                </div>
            </body>
            </html>
        `;
        
        mobileSaveWindow.document.write(saveHTML);
        mobileSaveWindow.document.close();
        
        // Fallback if popup is blocked
        setTimeout(() => {
            if (mobileSaveWindow.closed || !mobileSaveWindow.document.body) {
                alert('Pop-up blocked! To save the QR code:\n\n1. Long press the QR code on the main page\n2. Select "Save Image" or "Download image"\n\nOr allow pop-ups for this site and try again.');
            }
        }, 500);
    }
    
    // Reset form function
    function resetForm() {
        console.log("Reset button clicked");
        
        qrContent.value = 'https://example.com';
        charCounter.textContent = qrContent.value.length;
        
        document.getElementById('qr-size').value = 300;
        sizeValue.textContent = '300px';
        
        document.getElementById('qr-margin').value = 4;
        marginValue.textContent = '4';
        
        document.getElementById('qr-color').value = '#000000';
        document.getElementById('bg-color').value = '#FFFFFF';
        
        // Hide QR image, show placeholder
        qrImage.style.display = 'none';
        qrPlaceholder.style.display = 'block';
        
        // Clear image source
        qrImage.src = '';
        
        // Disable download
        downloadBtn.disabled = true;
        
        // Reset QR info
        document.getElementById('content-type').textContent = '-';
        document.getElementById('info-size').textContent = '-';
        document.getElementById('generated-time').textContent = '-';
        
        console.log("Form reset to default values");
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
        } else if (content.length <= 10 && /^[A-Z0-9]+$/.test(content)) {
            contentType = 'Code';
        }
        
        document.getElementById('content-type').textContent = contentType;
        document.getElementById('info-size').textContent = size + ' × ' + size + ' pixels';
        document.getElementById('generated-time').textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    // Test mobile function
    window.testMobile = function() {
        console.log("Testing mobile features...");
        const tests = {
            touch: 'ontouchstart' in window,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent,
            isMobile: /Mobi|Android|iPhone/i.test(navigator.userAgent),
            qrLibrary: typeof QRCode !== 'undefined'
        };
        
        let message = "Mobile Test Results:\n\n";
        message += `Touch Supported: ${tests.touch ? '✅' : '❌'}\n`;
        message += `Screen Size: ${tests.screenWidth}x${tests.screenHeight}\n`;
        message += `Mobile Device: ${tests.isMobile ? '✅' : '❌'}\n`;
        message += `QR Library Loaded: ${tests.qrLibrary ? '✅' : '❌'}\n\n`;
        
        if (tests.isMobile) {
            message += "Device detected as mobile.\n";
            message += "Download will show save instructions.\n";
            message += "Buttons support touch events.";
        } else {
            message += "Device detected as desktop.\n";
            message += "Download will work normally.\n";
        }
        
        alert(message);
        return false;
    };
    
    // Helper functions for footer links
    window.showSourceCode = function() {
        alert('This is a mobile-friendly QR Code Generator!\n\nAll code is contained in three files:\n1. index.html - Main HTML structure\n2. style.css - Styling with mobile support\n3. script.js - JavaScript with touch events\n\nThe QR code generation uses QRCode.js library from CDN.');
        return false;
    };
    
    window.showHelp = function() {
        alert('QR Code Generator Help:\n\nMOBILE USERS:\n• Use touch to interact with buttons\n• Generate QR code as usual\n• To save: Long press the QR image\n• Select "Save Image" from menu\n\nDESKTOP USERS:\n• Click "Download" to save PNG\n• Customize size, colors, margins\n• Use presets for quick generation');
        return false;
    };
    
    // Initialize with a sample QR code on page load
    // Wait for library to load completely
    setTimeout(function() {
        console.log("Checking QRCode library...");
        
        if (typeof QRCode !== 'undefined') {
            console.log("QRCode library loaded, generating initial QR code...");
            // Small delay for better UX
            setTimeout(generateQRCode, 500);
        } else {
            console.warn("QRCode library not loaded yet, retrying...");
            // Try again in 1 second
            setTimeout(function() {
                if (typeof QRCode !== 'undefined') {
                    generateQRCode();
                } else {
                    console.error("QRCode library failed to load");
                    alert("QR Code library failed to load. Please check your internet connection.");
                }
            }, 1000);
        }
    }, 1000);
});

// Additional global functions
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Debug function to check current state
function debugQRState() {
    const qrImage = document.getElementById('qr-image');
    const state = {
        qrImageExists: !!qrImage,
        qrImageDisplay: qrImage ? qrImage.style.display : 'N/A',
        qrImageSrc: qrImage && qrImage.src ? qrImage.src.substring(0, 50) + '...' : 'No src',
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        userAgent: navigator.userAgent,
        qrLibrary: typeof QRCode
    };
    console.log("Debug QR State:", state);
    return state;
}