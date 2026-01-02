// Timeline Resize Handler
export class TimelineResizer {
    constructor() {
        this.resizeHandle = document.getElementById('timelineResizeHandle');
        this.editorLayout = document.querySelector('.editor-layout');
        this.timelineContainer = document.querySelector('.timeline-container');
        this.isResizing = false;
        this.startY = 0;
        this.startHeight = 200;
        this.minHeight = 150;
        this.maxHeight = 500;
        
        this.init();
    }

    init() {
        if (!this.resizeHandle) return;

        this.resizeHandle.addEventListener('mousedown', (e) => {
            this.startResize(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isResizing) {
                this.resize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.stopResize();
        });

        // Touch support for mobile
        this.resizeHandle.addEventListener('touchstart', (e) => {
            this.startResize(e.touches[0]);
        });

        document.addEventListener('touchmove', (e) => {
            if (this.isResizing) {
                this.resize(e.touches[0]);
            }
        });

        document.addEventListener('touchend', () => {
            this.stopResize();
        });
    }

    startResize(e) {
        this.isResizing = true;
        this.startY = e.clientY;
        this.startHeight = this.timelineContainer.offsetHeight;
        this.resizeHandle.classList.add('resizing');
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
    }

    resize(e) {
        if (!this.isResizing) return;

        const deltaY = this.startY - e.clientY;
        let newHeight = this.startHeight + deltaY;

        // Clamp height between min and max
        newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, newHeight));

        // Update CSS variable
        this.editorLayout.style.setProperty('--timeline-height', `${newHeight}px`);
    }

    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        this.resizeHandle.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Save to localStorage
        const currentHeight = this.editorLayout.style.getPropertyValue('--timeline-height');
        localStorage.setItem('timelineHeight', currentHeight);
    }

    loadSavedHeight() {
        const savedHeight = localStorage.getItem('timelineHeight');
        if (savedHeight) {
            this.editorLayout.style.setProperty('--timeline-height', savedHeight);
        }
    }
}

// Initialize on DOM load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const resizer = new TimelineResizer();
        resizer.loadSavedHeight();
    });
}
