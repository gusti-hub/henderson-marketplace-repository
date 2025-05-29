/**
 * KeyShotXR Direct Image Zoom
 * Modified with 80% default zoom and 0-100% zoom range
 */
(function() {
    // Immediately inject the CSS for zoom controls
    var style = document.createElement('style');
    style.textContent = `
        .ksxr-zoom-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .ksxr-zoom-btn {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 4px;
            background-color: #0d5f63;
            color: white;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ksxr-zoom-reset {
            background-color: #666;
        }
        .ksxr-zoom-indicator {
            background-color: rgba(255,255,255,0.7);
            border-radius: 4px;
            text-align: center;
            padding: 4px;
            font-size: 12px;
        }
        #KeyShotXR {
            overflow: hidden !important;
            position: relative !important;
        }
    `;
    document.head.appendChild(style);

    // Initialize when the page is loaded and KeyShotXR is ready
    function initialize() {
        // Find the KeyShotXR container
        var viewerContainer = document.getElementById('KeyShotXR');
        if (!viewerContainer) return;
        
        // Create the zoom controls
        createZoomControls(viewerContainer);
        
        // Set up the direct zoom functionality
        setupDirectZoom(viewerContainer);
    }
    
    // Create zoom controls
    function createZoomControls(container) {
        var controlsContainer = document.createElement('div');
        controlsContainer.className = 'ksxr-zoom-controls';
        
        // Zoom in button
        var zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'ksxr-zoom-btn';
        zoomInBtn.textContent = '+';
        zoomInBtn.setAttribute('id', 'ksxr-zoom-in');
        
        // Zoom out button
        var zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'ksxr-zoom-btn';
        zoomOutBtn.textContent = '-';
        zoomOutBtn.setAttribute('id', 'ksxr-zoom-out');
        
        // Reset button
        var resetBtn = document.createElement('button');
        resetBtn.className = 'ksxr-zoom-btn ksxr-zoom-reset';
        resetBtn.textContent = 'R';
        resetBtn.setAttribute('id', 'ksxr-zoom-reset');
        
        // Zoom indicator
        var indicator = document.createElement('div');
        indicator.className = 'ksxr-zoom-indicator';
        indicator.textContent = '80%';  // Changed to 80% default
        indicator.setAttribute('id', 'ksxr-zoom-level');
        
        // Add to container
        controlsContainer.appendChild(zoomInBtn);
        controlsContainer.appendChild(zoomOutBtn);
        controlsContainer.appendChild(resetBtn);
        controlsContainer.appendChild(indicator);
        
        container.appendChild(controlsContainer);
    }
    
    // Set up direct zoom functionality
    function setupDirectZoom(container) {
        // Zoom state
        var state = {
            scale: 1.0,           // Changed default to 0.8 (80%)
            minScale: 0.05,       // Setting to 0.05 (5%) instead of 0 to avoid complete collapse
            maxScale: 2.0,        // Max is 1.0 (100%)
            step: 0.05,           // Smaller step for finer control
            offsetX: 0,
            offsetY: 0,
            dragging: false,
            lastX: 0,
            lastY: 0
        };
        
        // Get controls
        var zoomInBtn = document.getElementById('ksxr-zoom-in');
        var zoomOutBtn = document.getElementById('ksxr-zoom-out');
        var resetBtn = document.getElementById('ksxr-zoom-reset');
        var indicator = document.getElementById('ksxr-zoom-level');
        
        // Get container dimensions
        function getCenter() {
            return {
                x: container.offsetWidth / 2,
                y: container.offsetHeight / 2
            };
        }
        
        // Function to apply zoom transformation to all images
        function applyZoom() {
            // Update zoom indicator
            indicator.textContent = Math.round(state.scale * 100) + '%';
            
            // Get all images inside the container (KeyShotXR creates img elements dynamically)
            var images = container.querySelectorAll('img');
            
            // Find the visible image (the one currently showing)
            var visibleImg = null;
            for (var i = 0; i < images.length; i++) {
                if (images[i].style.display !== 'none' && 
                    images[i].id !== 'loadingIcon' &&
                    !images[i].parentElement.classList.contains('ksxr-zoom-controls')) {
                    visibleImg = images[i];
                    break;
                }
            }
            
            if (!visibleImg) return;
            
            // Set transform origin to center for the image
            visibleImg.style.transformOrigin = 'center';
            
            // Apply the transform - using a simple single-step transform that maintains center
            visibleImg.style.transform = 
                `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})`;
            
            // Change cursor based on zoom level
            if (state.scale > 0.85) {  // Changed threshold for move cursor
                container.style.cursor = 'move';
            } else {
                container.style.cursor = '';
            }
        }
        
        // Function to handle zoom operations
        function zoom(direction, e) {
            var oldScale = state.scale;
            
            // Update scale based on direction
            if (direction > 0) {
                if (state.scale >= state.maxScale) return;
                state.scale += state.step;
                if (state.scale > state.maxScale) state.scale = state.maxScale;
            } else {
                if (state.scale <= state.minScale) return;
                state.scale -= state.step;
                if (state.scale < state.minScale) state.scale = state.minScale;
            }
            
            // If we're zooming with mouse, use mouse position as focus point
            if (e && e.clientX) {
                var rect = container.getBoundingClientRect();
                var mouseX = e.clientX - rect.left;
                var mouseY = e.clientY - rect.top;
                
                // Adjust offset to keep the point under the mouse stable
                var center = getCenter();
                var dx = mouseX - center.x;
                var dy = mouseY - center.y;
                
                state.offsetX += dx * (1 - oldScale / state.scale);
                state.offsetY += dy * (1 - oldScale / state.scale);
            }
            
            // If we're getting close to 0.8 scale (our default), gradually snap back to center
            if (state.scale < 0.85 && state.scale > 0.75) {
                var snapFactor = 1 - Math.abs(state.scale - 0.8) / 0.05;
                if (snapFactor > 0) {
                    state.offsetX *= (1 - snapFactor);
                    state.offsetY *= (1 - snapFactor);
                }
            }
            
            // Apply the zoom
            applyZoom();
        }
        
        // Reset zoom
        function reset() {
            state.scale = 0.8;  // Changed to 0.8 (80%)
            state.offsetX = 0;
            state.offsetY = 0;
            applyZoom();
        }
        
        // Start dragging (pan)
        function startDrag(e) {
            // Only allow dragging when zoomed in beyond default
            if (state.scale <= 0.81) return;
            
            state.dragging = true;
            
            // Get starting position
            if (e.type === 'mousedown') {
                state.lastX = e.clientX;
                state.lastY = e.clientY;
                document.addEventListener('mousemove', doDrag);
                document.addEventListener('mouseup', endDrag);
            } else if (e.type === 'touchstart') {
                state.lastX = e.touches[0].clientX;
                state.lastY = e.touches[0].clientY;
                document.addEventListener('touchmove', doDrag);
                document.addEventListener('touchend', endDrag);
            }
            
            e.preventDefault();
        }
        
        // Do the dragging (pan)
        function doDrag(e) {
            if (!state.dragging) return;
            
            var clientX, clientY;
            
            if (e.type === 'mousemove') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            
            // Calculate the change in position
            var deltaX = clientX - state.lastX;
            var deltaY = clientY - state.lastY;
            
            // Update the offset
            state.offsetX += deltaX;
            state.offsetY += deltaY;
            
            // Update the last position
            state.lastX = clientX;
            state.lastY = clientY;
            
            applyZoom();
            e.preventDefault();
        }
        
        // End dragging
        function endDrag() {
            state.dragging = false;
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', doDrag);
            document.removeEventListener('touchend', endDrag);
        }
        
        // Handle mouse wheel
        function handleWheel(e) {
            e.preventDefault();
            zoom(e.deltaY < 0 ? 1 : -1, e);
        }
        
        // Set up event listeners
        zoomInBtn.addEventListener('click', function() { zoom(1); });
        zoomOutBtn.addEventListener('click', function() { zoom(-1); });
        resetBtn.addEventListener('click', reset);
        container.addEventListener('wheel', handleWheel);
        container.addEventListener('mousedown', startDrag);
        container.addEventListener('touchstart', startDrag, { passive: false });
        
        // Monitor image changes - KeyShotXR replaces images during rotation
        // We need to reapply our transforms when this happens
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && 
                     mutation.attributeName === 'style')) {
                    // Delay a bit to let KeyShotXR finish its updates
                    setTimeout(applyZoom, 10);
                }
            });
        });
        
        // Start observing
        observer.observe(container, { 
            childList: true, 
            subtree: true, 
            attributes: true,
            attributeFilter: ['style']
        });
        
        // Initial apply - starting at 80% zoom
        applyZoom();
        
        // Apply zoom whenever window is resized
        window.addEventListener('resize', function() {
            setTimeout(applyZoom, 100);
        });
    }
    
    // Check if the page is already loaded
    if (document.readyState === 'complete') {
        setTimeout(initialize, 500); // Give KeyShotXR time to initialize
    } else {
        window.addEventListener('load', function() {
            setTimeout(initialize, 500);
        });
    }
})();