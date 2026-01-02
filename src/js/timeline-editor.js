// Timeline Editor - Sistema Profissional de Edição
export class TimelineEditor {
    constructor() {
        this.clips = [];
        this.currentTime = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.zoom = 1;
        this.pixelsPerSecond = 100;
        this.selectedClip = null;
        this.fps = 60;
        
        this.tracks = {
            track1: document.getElementById('trackContent1'),
            track2: document.getElementById('trackContent2'),
            track3: document.getElementById('trackContent3')
        };
        
        this.animationSystem = null;
        this.setupEventListeners();
        this.createTimeRuler();
        this.createPlayhead();
        
    }
    
    setAnimationSystem(system) {
        this.animationSystem = system;
    }
    
    setupEventListeners() {
        // Play/Pause
        document.getElementById('btnPlayPause')?.addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        // Stop
        document.getElementById('btnStop')?.addEventListener('click', () => {
            this.stop();
        });
        
        // First/Last
        document.getElementById('btnFirst')?.addEventListener('click', () => {
            this.seekTo(0);
        });
        
        document.getElementById('btnLast')?.addEventListener('click', () => {
            this.seekTo(this.duration);
        });
        
        // Zoom
        document.getElementById('btnZoomIn')?.addEventListener('click', () => {
            this.zoomIn();
        });
        
        document.getElementById('btnZoomOut')?.addEventListener('click', () => {
            this.zoomOut();
        });
        
        // Clear
        document.getElementById('btnClearTimeline')?.addEventListener('click', () => {
            if (confirm('Limpar toda a timeline?')) {
                this.clear();
            }
        });
        
        // Drag & Drop para adicionar clips
        document.querySelectorAll('.anim-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.anim-item');
                const animName = item.dataset.animation;
                this.addClip(animName, 'track1');
            });
        });
        
        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.togglePlayPause();
            } else if (e.key === 'Delete' && this.selectedClip) {
                this.removeClip(this.selectedClip);
            } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.saveToDevice();
            } else if (e.key === 'ArrowLeft') {
                this.seekTo(Math.max(0, this.currentTime - 1/this.fps));
            } else if (e.key === 'ArrowRight') {
                this.seekTo(Math.min(this.duration, this.currentTime + 1/this.fps));
            } else if (e.key === 'x' && this.selectedClip) {
                e.preventDefault();
                this.splitClip(this.selectedClip, this.currentTime);
            }
        });
    }
    
    createTimeRuler() {
        const tracksContainer = document.getElementById('timelineTracks');
        if (!tracksContainer) return;
        
        // Criar ruler container
        const rulerContainer = document.createElement('div');
        rulerContainer.id = 'timeRuler';
        rulerContainer.style.cssText = `
            position: sticky;
            top: 0;
            height: 30px;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
            z-index: 10;
            overflow: hidden;
        `;
        
        tracksContainer.insertBefore(rulerContainer, tracksContainer.firstChild);
        this.rulerContainer = rulerContainer;
        this.updateTimeRuler();
    }
    
    updateTimeRuler() {
        if (!this.rulerContainer) return;
        
        this.rulerContainer.innerHTML = '';
        const totalWidth = Math.max(this.duration * this.pixelsPerSecond * this.zoom, 1000);
        
        // Desenhar marcadores
        const step = this.zoom > 2 ? 0.1 : (this.zoom > 1 ? 0.5 : 1);
        
        for (let time = 0; time <= this.duration + step; time += step) {
            const x = time * this.pixelsPerSecond * this.zoom;
            const marker = document.createElement('div');
            
            const isSecond = Math.abs(time % 1) < 0.01;
            marker.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${isSecond ? '0' : '10px'};
                width: 1px;
                height: ${isSecond ? '30px' : '20px'};
                background: ${isSecond ? 'var(--text-muted)' : 'var(--border)'};
            `;
            
            if (isSecond) {
                const label = document.createElement('span');
                label.textContent = `${time.toFixed(1)}s`;
                label.style.cssText = `
                    position: absolute;
                    left: ${x + 4}px;
                    top: 2px;
                    font-size: 10px;
                    color: var(--text-muted);
                `;
                this.rulerContainer.appendChild(label);
            }
            
            this.rulerContainer.appendChild(marker);
        }
    }
    
    createPlayhead() {
        Object.values(this.tracks).forEach(track => {
            if (!track) return;
            
            const playhead = document.createElement('div');
            playhead.className = 'timeline-playhead';
            playhead.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2px;
                background: var(--timeline-cursor);
                pointer-events: none;
                z-index: 20;
                box-shadow: 0 0 10px var(--timeline-cursor);
            `;
            
            const handle = document.createElement('div');
            handle.style.cssText = `
                position: absolute;
                top: -6px;
                left: -6px;
                width: 14px;
                height: 14px;
                background: var(--timeline-cursor);
                border-radius: 50%;
                box-shadow: 0 0 10px var(--timeline-cursor);
            `;
            playhead.appendChild(handle);
            
            track.appendChild(playhead);
        });
        
        // Playhead na ruler também
        if (this.rulerContainer) {
            const rulerPlayhead = document.createElement('div');
            rulerPlayhead.id = 'rulerPlayhead';
            rulerPlayhead.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2px;
                background: var(--timeline-cursor);
                z-index: 15;
                box-shadow: 0 0 10px var(--timeline-cursor);
            `;
            this.rulerContainer.appendChild(rulerPlayhead);
        }
    }
    
    updatePlayhead() {
        const x = this.currentTime * this.pixelsPerSecond * this.zoom;
        
        document.querySelectorAll('.timeline-playhead').forEach(playhead => {
            playhead.style.left = `${x}px`;
        });
        
        const rulerPlayhead = document.getElementById('rulerPlayhead');
        if (rulerPlayhead) {
            rulerPlayhead.style.left = `${x}px`;
        }
    }
    
    splitClip(clip, splitTime) {
        if (!clip || splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) {
            return;
        }
        
        // Criar segundo clip
        const newDuration = clip.startTime + clip.duration - splitTime;
        const originalDuration = splitTime - clip.startTime;
        
        // Ajustar clip original
        clip.duration = originalDuration;
        if (clip.element) {
            clip.element.style.width = `${originalDuration * this.pixelsPerSecond * this.zoom}px`;
        }
        
        // Criar novo clip
        this.addClip(clip.animation, clip.track, splitTime);
        
        this.updateDuration();
    }
    
    addClip(animationName, trackId = 'track1', startTime = null) {
        const track = this.tracks[trackId];
        if (!track) {
            console.error('Track não encontrado:', trackId);
            return null;
        }
        
        // Durations das animações do modelo (baseadas no GLB real)
        const durations = {
            'idle': 5.0,
            'dance': 4.0,
            'walk': 1.33,
            'jump': 1.0,
            'attack': 1.67,
            'spin': 1.5,
            'celebrate': 3.0
        };
        
        const duration = durations[animationName] || 2.0;
        
        // Se startTime não especificado, adiciona no final
        if (startTime === null) {
            const existingClips = this.clips.filter(c => c.track === trackId);
            if (existingClips.length > 0) {
                const lastClip = existingClips[existingClips.length - 1];
                startTime = lastClip.startTime + lastClip.duration;
            } else {
                startTime = 0;
            }
        }
        
        const clip = {
            id: Date.now() + Math.random(),
            animation: animationName,
            track: trackId,
            startTime: startTime,
            duration: duration,
            element: null
        };
        
        // Criar elemento visual
        const clipEl = document.createElement('div');
        clipEl.className = 'clip';
        clipEl.dataset.clipId = clip.id;
        clipEl.textContent = animationName.charAt(0).toUpperCase() + animationName.slice(1);
        clipEl.style.left = `${startTime * this.pixelsPerSecond * this.zoom}px`;
        clipEl.style.width = `${duration * this.pixelsPerSecond * this.zoom}px`;
        
        // Handles de resize
        const leftHandle = document.createElement('div');
        leftHandle.className = 'clip-handle left';
        clipEl.appendChild(leftHandle);
        
        const rightHandle = document.createElement('div');
        rightHandle.className = 'clip-handle right';
        clipEl.appendChild(rightHandle);
        
        // Event listeners
        this.setupClipInteractions(clipEl, clip);
        
        track.appendChild(clipEl);
        clip.element = clipEl;
        this.clips.push(clip);
        
        // Atualizar duração total
        this.updateDuration();
        this.updateClipCount();
        
        
        return clip;
    }
    
    addClipByIndex(animIndex, animName, duration, trackId = 'track1', startTime = null) {
        const track = this.tracks[trackId];
        if (!track) {
            console.error('Track não encontrado:', trackId);
            return null;
        }
        
        // Se startTime não especificado, adiciona no final
        if (startTime === null) {
            const existingClips = this.clips.filter(c => c.track === trackId);
            if (existingClips.length > 0) {
                const lastClip = existingClips[existingClips.length - 1];
                startTime = lastClip.startTime + lastClip.duration;
            } else {
                startTime = 0;
            }
        }
        
        const clip = {
            id: Date.now() + Math.random(),
            animation: animName,
            animationIndex: animIndex,
            track: trackId,
            startTime: startTime,
            duration: duration,
            element: null
        };
        
        // Criar elemento visual
        const clipEl = document.createElement('div');
        clipEl.className = 'clip';
        clipEl.dataset.clipId = clip.id;
        clipEl.textContent = animName;
        clipEl.style.left = `${startTime * this.pixelsPerSecond * this.zoom}px`;
        clipEl.style.width = `${duration * this.pixelsPerSecond * this.zoom}px`;
        
        // Handles de resize
        const leftHandle = document.createElement('div');
        leftHandle.className = 'clip-handle left';
        clipEl.appendChild(leftHandle);
        
        const rightHandle = document.createElement('div');
        rightHandle.className = 'clip-handle right';
        clipEl.appendChild(rightHandle);
        
        // Event listeners
        this.setupClipInteractions(clipEl, clip);
        
        track.appendChild(clipEl);
        clip.element = clipEl;
        this.clips.push(clip);
        
        // Atualizar duração total
        this.updateDuration();
        this.updateClipCount();
        
        
        return clip;
    }
    
    setupClipInteractions(clipEl, clip) {
        let isDragging = false;
        let isResizing = false;
        let resizeHandle = null;
        let startX = 0;
        let startLeft = 0;
        let startWidth = 0;
        
        // Click para selecionar
        clipEl.addEventListener('click', (e) => {
            if (!isDragging && !isResizing) {
                this.selectClip(clip);
            }
        });
        
        // Drag para mover
        clipEl.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('clip-handle')) {
                isResizing = true;
                resizeHandle = e.target.classList.contains('left') ? 'left' : 'right';
            } else {
                isDragging = true;
            }
            
            startX = e.clientX;
            startLeft = clipEl.offsetLeft;
            startWidth = clipEl.offsetWidth;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const newLeft = Math.max(0, startLeft + deltaX);
                clipEl.style.left = `${newLeft}px`;
                clip.startTime = newLeft / (this.pixelsPerSecond * this.zoom);
            } else if (isResizing) {
                const deltaX = e.clientX - startX;
                
                if (resizeHandle === 'right') {
                    const newWidth = Math.max(50, startWidth + deltaX);
                    clipEl.style.width = `${newWidth}px`;
                    clip.duration = newWidth / (this.pixelsPerSecond * this.zoom);
                } else {
                    const newLeft = startLeft + deltaX;
                    const newWidth = Math.max(50, startWidth - deltaX);
                    if (newLeft >= 0) {
                        clipEl.style.left = `${newLeft}px`;
                        clipEl.style.width = `${newWidth}px`;
                        clip.startTime = newLeft / (this.pixelsPerSecond * this.zoom);
                        clip.duration = newWidth / (this.pixelsPerSecond * this.zoom);
                    }
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging || isResizing) {
                this.updateDuration();
                this.sortClips();
            }
            isDragging = false;
            isResizing = false;
            resizeHandle = null;
        });
        
        // Delete com tecla Delete
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedClip === clip) {
                this.removeClip(clip);
            }
        });
    }
    
    selectClip(clip) {
        // Desselecionar anterior
        document.querySelectorAll('.clip').forEach(el => {
            el.style.boxShadow = '';
            el.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });
        
        // Selecionar novo
        if (clip && clip.element) {
            clip.element.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.8)';
            clip.element.style.borderColor = '#00d9ff';
            this.selectedClip = clip;
        }
    }
    
    removeClip(clip) {
        const index = this.clips.indexOf(clip);
        if (index > -1) {
            this.clips.splice(index, 1);
            clip.element?.remove();
            this.selectedClip = null;
            this.updateDuration();
            this.updateClipCount();
        }
    }
    
    sortClips() {
        this.clips.sort((a, b) => {
            if (a.track !== b.track) return a.track.localeCompare(b.track);
            return a.startTime - b.startTime;
        });
    }
    
    updateDuration() {
        this.duration = 0;
        this.clips.forEach(clip => {
            const endTime = clip.startTime + clip.duration;
            if (endTime > this.duration) {
                this.duration = endTime;
            }
        });
        
        const durationEl = document.getElementById('timelineDuration');
        if (durationEl) {
            durationEl.textContent = this.formatTime(this.duration);
        }
    }
    
    updateClipCount() {
        const countEl = document.getElementById('timelineClipCount');
        if (countEl) {
            countEl.textContent = this.clips.length;
        }
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        if (this.clips.length === 0) return;
        
        this.isPlaying = true;
        const btn = document.getElementById('btnPlayPause');
        if (btn) btn.textContent = '⏸';
        
        // Se há uma animação pausada, retomar
        if (this.animationSystem && this.animationSystem.currentAction) {
            this.animationSystem.resumeAnimation();
        }
        
        this.playbackLoop();
    }
    
    pause() {
        this.isPlaying = false;
        const btn = document.getElementById('btnPlayPause');
        if (btn) btn.textContent = '▶';
        
        // Parar animação atual
        if (this.animationSystem) {
            this.animationSystem.pauseAnimation();
        }
        
    }
    
    stop() {
        this.isPlaying = false;
        this.currentTime = 0;
        this.lastPlayedClip = null;
        
        const btn = document.getElementById('btnPlayPause');
        if (btn) btn.textContent = '▶';
        
        // Parar animação completamente
        if (this.animationSystem) {
            this.animationSystem.stopAnimation();
        }
        
        // Atualizar displays
        this.updateTimeDisplay();
        this.updatePlayhead();
        
        // Limpar display de animação
        const animValue = document.getElementById('currentAnimValue');
        if (animValue) {
            animValue.textContent = 'Idle';
        }
        
    }
    
    playbackLoop() {
        if (!this.isPlaying) return;
        
        const deltaTime = 1/60; // 60 FPS
        this.currentTime += deltaTime;
        
        // Loop ou parar no fim
        if (this.currentTime >= this.duration) {
            const loopEnabled = document.getElementById('loopCheck')?.checked;
            if (loopEnabled) {
                this.currentTime = 0;
            } else {
                this.stop();
                return;
            }
        }
        
        // Tocar animação atual
        this.playCurrentAnimation();
        
        // Atualizar display
        this.updateTimeDisplay();
        
        requestAnimationFrame(() => this.playbackLoop());
    }
    
    playCurrentAnimation() {
        // Encontrar clip ativo no tempo atual
        const activeClip = this.clips.find(clip => 
            this.currentTime >= clip.startTime && 
            this.currentTime < clip.startTime + clip.duration
        );
        
        if (activeClip && this.animationSystem) {
            // Verificar se precisamos trocar animação
            if (!this.lastPlayedClip || this.lastPlayedClip.id !== activeClip.id) {
                
                // Se tem índice, usar por índice, senão usar por nome
                if (activeClip.animationIndex !== undefined) {
                    this.animationSystem.changeAnimationByIndex(activeClip.animationIndex);
                } else {
                    this.animationSystem.changeAnimation(activeClip.animation);
                }
                
                this.lastPlayedClip = activeClip;
                
                // Atualizar display com nome real da animação
                const animValue = document.getElementById('currentAnimValue');
                if (animValue && this.animationSystem) {
                    if (activeClip.animationIndex !== undefined) {
                        const anim = this.animationSystem.animations[activeClip.animationIndex];
                        if (anim) {
                            const cleanName = anim.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            animValue.textContent = cleanName;
                        }
                    } else {
                        animValue.textContent = activeClip.animation.charAt(0).toUpperCase() + activeClip.animation.slice(1);
                    }
                }
            }
        } else if (!activeClip && this.lastPlayedClip) {
            // Não há clip ativo, voltar para idle
            this.animationSystem?.changeAnimation('idle');
            this.lastPlayedClip = null;
            
            const animValue = document.getElementById('currentAnimValue');
            if (animValue) {
                animValue.textContent = 'Idle';
            }
        }
    }
    
    seekTo(time) {
        this.currentTime = Math.max(0, Math.min(time, this.duration));
        this.updateTimeDisplay();
        this.updatePlayhead();
    }
    
    updateTimeDisplay() {
        const timeEl = document.getElementById('timelineTime');
        if (timeEl) {
            timeEl.textContent = this.formatTime(this.currentTime);
        }
        
        const timeValueEl = document.getElementById('timeValue');
        if (timeValueEl) {
            timeValueEl.textContent = this.formatTime(this.currentTime, 2);
        }
        
        this.updatePlayhead();
    }
    
    zoomIn() {
        this.zoom = Math.min(3, this.zoom * 1.2);
        this.updateClipPositions();
        this.updateTimeRuler();
    }
    
    zoomOut() {
        this.zoom = Math.max(0.5, this.zoom / 1.2);
        this.updateClipPositions();
        this.updateTimeRuler();
    }
    
    updateClipPositions() {
        this.clips.forEach(clip => {
            if (clip.element) {
                clip.element.style.left = `${clip.startTime * this.pixelsPerSecond * this.zoom}px`;
                clip.element.style.width = `${clip.duration * this.pixelsPerSecond * this.zoom}px`;
            }
        });
    }
    
    clear() {
        this.clips.forEach(clip => clip.element?.remove());
        this.clips = [];
        this.currentTime = 0;
        this.selectedClip = null;
        this.updateDuration();
        this.updateClipCount();
    }
    
    formatTime(seconds, decimals = 3) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const format = decimals === 2 ? 
            `${secs.toFixed(2)}s` :
            `${String(mins).padStart(2, '0')}:${String(Math.floor(secs)).padStart(2, '0')}.${String(Math.floor((secs % 1) * 1000)).padStart(3, '0')}`;
        return format;
    }
    
    // Exportar sequência de animações
    getAnimationSequence() {
        this.sortClips();
        return this.clips.map(clip => ({
            name: clip.animation,
            startTime: clip.startTime,
            duration: clip.duration
        }));
    }
    
    // Salvar projeto
    saveProject() {
        const project = {
            version: '1.0',
            clips: this.clips.map(c => ({
                animation: c.animation,
                track: c.track,
                startTime: c.startTime,
                duration: c.duration
            })),
            duration: this.duration
        };
        
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ornn-animation-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
    }
    
    // Salvar no dispositivo (localStorage + download)
    saveToDevice() {
        const project = {
            version: '1.0',
            timestamp: Date.now(),
            name: `Projeto ${new Date().toLocaleString('pt-BR')}`,
            clips: this.clips.map(c => ({
                animation: c.animation,
                track: c.track,
                startTime: c.startTime,
                duration: c.duration
            })),
            duration: this.duration
        };
        
        // Salvar no localStorage
        try {
            const projects = JSON.parse(localStorage.getItem('ornnProjects') || '[]');
            projects.push(project);
            // Manter apenas últimos 10 projetos
            if (projects.length > 10) {
                projects.shift();
            }
            localStorage.setItem('ornnProjects', JSON.stringify(projects));
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
        }
        
        // Download também
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ornn-project-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('✅ Projeto salvo!\n• LocalStorage: Sim\n• Download: Sim');
    }
    
    // Carregar projeto do arquivo
    loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);
                this.loadProject(project);
            } catch (error) {
                console.error('Erro ao carregar projeto:', error);
                alert('❌ Erro ao carregar projeto!');
            }
        };
        reader.readAsText(file);
    }
    
    // Carregar projeto
    loadProject(project) {
        this.clear();
        
        if (!project.clips) {
            console.error('Projeto inválido');
            return;
        }
        
        project.clips.forEach(clipData => {
            this.addClip(clipData.animation, clipData.track, clipData.startTime);
        });
        
    }
    
    // Listar projetos salvos
    getSavedProjects() {
        try {
            return JSON.parse(localStorage.getItem('ornnProjects') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    // Auto-save a cada 30 segundos
    enableAutoSave() {
        setInterval(() => {
            if (this.clips.length > 0) {
                const project = {
                    version: '1.0',
                    timestamp: Date.now(),
                    name: 'Auto-save',
                    clips: this.clips.map(c => ({
                        animation: c.animation,
                        track: c.track,
                        startTime: c.startTime,
                        duration: c.duration
                    })),
                    duration: this.duration
                };
                
                try {
                    localStorage.setItem('ornnAutoSave', JSON.stringify(project));
                } catch (e) {
                    console.error('Erro no auto-save:', e);
                }
            }
        }, 30000);
    }
    
    // Salvar sequência como animação customizada
    saveSequenceAsAnimation(name) {
        if (this.clips.length === 0) {
            alert('⚠️ Adicione clips na timeline primeiro!');
            return;
        }
        
        const sequence = {
            name: name || `Sequência ${Date.now()}`,
            clips: this.getAnimationSequence(),
            duration: this.duration,
            createdAt: Date.now()
        };
        
        try {
            const sequences = JSON.parse(localStorage.getItem('ornnSequences') || '[]');
            sequences.push(sequence);
            localStorage.setItem('ornnSequences', JSON.stringify(sequences));
            
            alert(`✅ Sequência "${name}" salva com sucesso!`);
            
            return sequence;
        } catch (e) {
            console.error('Erro ao salvar sequência:', e);
            alert('❌ Erro ao salvar sequência!');
        }
    }
    
    // Carregar sequências salvas
    getSavedSequences() {
        try {
            return JSON.parse(localStorage.getItem('ornnSequences') || '[]');
        } catch (e) {
            return [];
        }
    }

}

// Exportar para uso global
window.TimelineEditor = TimelineEditor;
