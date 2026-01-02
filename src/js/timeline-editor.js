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
        this.clipboard = null; // Para copiar/colar clips
        this.trimTooltip = null; // Tooltip para mostrar valores do trim
        
        this.tracks = {
            track1: document.getElementById('trackContent1'),
            track2: document.getElementById('trackContent2'),
            track3: document.getElementById('trackContent3')
        };
        
        this.animationSystem = null;
        this.setupEventListeners();
        this.createTrimTooltip();
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
            } else if (e.key === 'c' && (e.ctrlKey || e.metaKey) && this.selectedClip) {
                e.preventDefault();
                this.copyClip(this.selectedClip);
            } else if (e.key === 'v' && (e.ctrlKey || e.metaKey) && this.clipboard) {
                e.preventDefault();
                this.pasteClip();
            } else if (e.key === 'd' && (e.ctrlKey || e.metaKey) && this.selectedClip) {
                e.preventDefault();
                this.duplicateClip(this.selectedClip);
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
            originalDuration: duration, // Duração original da animação
            trimStart: 0, // Início do corte (em segundos dentro da animação)
            trimEnd: duration, // Fim do corte (em segundos dentro da animação)
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
            originalDuration: duration, // Duração original da animação
            trimStart: 0, // Início do corte (em segundos dentro da animação)
            trimEnd: duration, // Fim do corte (em segundos dentro da animação)
            element: null
        };
        
        // Criar elemento visual
        const clipEl = document.createElement('div');
        clipEl.className = 'clip';
        clipEl.dataset.clipId = clip.id;
        clipEl.textContent = animName;
        clipEl.style.left = `${startTime * this.pixelsPerSecond * this.zoom}px`;
        clipEl.style.width = `${duration * this.pixelsPerSecond * this.zoom}px`;
        
        // Handles de posição (mover clip na timeline)
        const leftHandle = document.createElement('div');
        leftHandle.className = 'clip-handle left';
        clipEl.appendChild(leftHandle);
        
        const rightHandle = document.createElement('div');
        rightHandle.className = 'clip-handle right';
        clipEl.appendChild(rightHandle);
        
        // Handles de trim (cortar início/fim da animação)
        const trimStartHandle = document.createElement('div');
        trimStartHandle.className = 'clip-trim-handle trim-start';
        trimStartHandle.title = 'Arraste para cortar o início da animação';
        clipEl.appendChild(trimStartHandle);
        
        const trimEndHandle = document.createElement('div');
        trimEndHandle.className = 'clip-trim-handle trim-end';
        trimEndHandle.title = 'Arraste para cortar o fim da animação';
        clipEl.appendChild(trimEndHandle);
        
        // Área trimada visual
        const trimStartOverlay = document.createElement('div');
        trimStartOverlay.className = 'trim-overlay trim-start-overlay';
        clipEl.appendChild(trimStartOverlay);
        
        const trimEndOverlay = document.createElement('div');
        trimEndOverlay.className = 'trim-overlay trim-end-overlay';
        clipEl.appendChild(trimEndOverlay);
        
        // Indicador de trim ativo
        const trimIndicator = document.createElement('div');
        trimIndicator.className = 'trim-indicator';
        trimIndicator.innerHTML = '✂️';
        trimIndicator.title = 'Este clip foi cortado';
        trimIndicator.style.display = 'none';
        clipEl.appendChild(trimIndicator);
        
        this.updateTrimVisuals(clip, clipEl);
        
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
        let isTrimming = false;
        let resizeHandle = null;
        let trimHandle = null;
        let startX = 0;
        let startLeft = 0;
        let startWidth = 0;
        let startTrimStart = 0;
        let startTrimEnd = 0;
        
        // Click para selecionar
        clipEl.addEventListener('click', (e) => {
            if (!isDragging && !isResizing && !isTrimming) {
                this.selectClip(clip);
            }
        });
        
        // Drag para mover
        clipEl.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('clip-handle')) {
                isResizing = true;
                resizeHandle = e.target.classList.contains('left') ? 'left' : 'right';
            } else if (e.target.classList.contains('clip-trim-handle')) {
                isTrimming = true;
                trimHandle = e.target.classList.contains('trim-start') ? 'start' : 'end';
                startTrimStart = clip.trimStart;
                startTrimEnd = clip.trimEnd;
            } else if (!e.target.classList.contains('trim-overlay')) {
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
            } else if (isTrimming) {
                const deltaX = e.clientX - startX;
                const deltaTime = deltaX / (this.pixelsPerSecond * this.zoom);
                
                if (trimHandle === 'start') {
                    // Cortar início: ajustar trimStart
                    const newTrimStart = Math.max(0, Math.min(clip.originalDuration - 0.1, startTrimStart + deltaTime));
                    if (newTrimStart < clip.trimEnd - 0.1) {
                        clip.trimStart = newTrimStart;
                        clip.duration = clip.trimEnd - clip.trimStart;
                        this.updateTrimVisuals(clip, clipEl);
                        
                        // Mostrar tooltip com valores
                        this.showTrimTooltip(e.clientX, e.clientY, clip, 'start');
                        
                        // Preview em tempo real no modelo
                        this.previewTrim(clip);
                    }
                } else if (trimHandle === 'end') {
                    // Cortar fim: ajustar trimEnd
                    const newTrimEnd = Math.max(0.1, Math.min(clip.originalDuration, startTrimEnd + deltaTime));
                    if (newTrimEnd > clip.trimStart + 0.1) {
                        clip.trimEnd = newTrimEnd;
                        clip.duration = clip.trimEnd - clip.trimStart;
                        this.updateTrimVisuals(clip, clipEl);
                        
                        // Mostrar tooltip com valores
                        this.showTrimTooltip(e.clientX, e.clientY, clip, 'end');
                        
                        // Preview em tempo real no modelo
                        this.previewTrim(clip);
                    }
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging || isResizing || isTrimming) {
                this.updateDuration();
                this.sortClips();
            }
            
            // Esconder tooltip de trim
            if (isTrimming) {
                this.hideTrimTooltip();
            }
            
            isDragging = false;
            isResizing = false;
            isTrimming = false;
            resizeHandle = null;
            trimHandle = null;
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
            // Calcular o tempo local dentro do clip (considerando trim)
            const localTime = this.currentTime - activeClip.startTime;
            const animationTime = activeClip.trimStart + localTime;
            
            // Verificar se precisamos trocar animação
            if (!this.lastPlayedClip || this.lastPlayedClip.id !== activeClip.id) {
                
                // Se tem índice, usar por índice, senão usar por nome
                if (activeClip.animationIndex !== undefined) {
                    this.animationSystem.changeAnimationByIndex(activeClip.animationIndex, animationTime);
                } else {
                    this.animationSystem.changeAnimation(activeClip.animation, animationTime);
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
                this.updateTrimVisuals(clip, clip.element);
            }
        });
    }
    
    updateTrimVisuals(clip, clipEl) {
        if (!clip || !clipEl) return;
        
        // Calcular porcentagens de trim
        const trimStartPercent = (clip.trimStart / clip.originalDuration) * 100;
        const trimEndPercent = ((clip.originalDuration - clip.trimEnd) / clip.originalDuration) * 100;
        
        // Verificar se há trim ativo
        const hasTrim = clip.trimStart > 0 || clip.trimEnd < clip.originalDuration;
        
        // Atualizar overlays
        const trimStartOverlay = clipEl.querySelector('.trim-start-overlay');
        const trimEndOverlay = clipEl.querySelector('.trim-end-overlay');
        
        if (trimStartOverlay) {
            trimStartOverlay.style.width = `${trimStartPercent}%`;
        }
        
        if (trimEndOverlay) {
            trimEndOverlay.style.width = `${trimEndPercent}%`;
        }
        
        // Mostrar/esconder indicador de trim
        const trimIndicator = clipEl.querySelector('.trim-indicator');
        if (trimIndicator) {
            trimIndicator.style.display = hasTrim ? 'flex' : 'none';
        }
        
        // Posicionar handles de trim
        const trimStartHandle = clipEl.querySelector('.trim-start');
        const trimEndHandle = clipEl.querySelector('.trim-end');
        
        if (trimStartHandle) {
            trimStartHandle.style.left = `${trimStartPercent}%`;
        }
        
        if (trimEndHandle) {
            trimEndHandle.style.right = `${trimEndPercent}%`;
        }
    }
    
    clear() {
        this.clips.forEach(clip => clip.element?.remove());
        this.clips = [];
        this.currentTime = 0;
        this.selectedClip = null;
        this.clipboard = null;
        this.updateDuration();
        this.updateClipCount();
    }
    
    // Criar tooltip de trim
    createTrimTooltip() {
        this.trimTooltip = document.createElement('div');
        this.trimTooltip.className = 'trim-tooltip';
        this.trimTooltip.style.display = 'none';
        document.body.appendChild(this.trimTooltip);
    }
    
    // Mostrar tooltip com valores do trim
    showTrimTooltip(x, y, clip, handle) {
        if (!this.trimTooltip) return;
        
        const trimStartTime = this.formatTime(clip.trimStart, 2);
        const trimEndTime = this.formatTime(clip.trimEnd, 2);
        const durationTime = this.formatTime(clip.duration, 2);
        
        let content = '';
        if (handle === 'start') {
            content = `
                <div style="font-weight: 600; margin-bottom: 4px;">✂️ Cortando Início</div>
                <div>Início: <span style="color: #00d9ff;">${trimStartTime}</span></div>
                <div>Fim: ${trimEndTime}</div>
                <div>Duração: <span style="color: #00ff88;">${durationTime}</span></div>
            `;
        } else {
            content = `
                <div style="font-weight: 600; margin-bottom: 4px;">✂️ Cortando Fim</div>
                <div>Início: ${trimStartTime}</div>
                <div>Fim: <span style="color: #00d9ff;">${trimEndTime}</span></div>
                <div>Duração: <span style="color: #00ff88;">${durationTime}</span></div>
            `;
        }
        
        this.trimTooltip.innerHTML = content;
        this.trimTooltip.style.display = 'block';
        this.trimTooltip.style.left = `${x + 15}px`;
        this.trimTooltip.style.top = `${y - 60}px`;
    }
    
    // Esconder tooltip
    hideTrimTooltip() {
        if (this.trimTooltip) {
            this.trimTooltip.style.display = 'none';
        }
    }
    
    // Preview em tempo real do trim
    previewTrim(clip) {
        if (!this.animationSystem || !clip) return;
        
        // Pausar timeline se estiver tocando
        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            this.pause();
        }
        
        // Mostrar o frame do trimStart
        if (clip.animationIndex !== undefined) {
            this.animationSystem.changeAnimationByIndex(clip.animationIndex, false, clip.trimStart);
        } else {
            this.animationSystem.changeAnimation(clip.animation, clip.trimStart);
        }
        
        // Pausar a animação para mostrar o frame específico
        setTimeout(() => {
            if (this.animationSystem.currentAction) {
                this.animationSystem.currentAction.paused = true;
            }
        }, 50);
    }
    
    // Copiar clip
    copyClip(clip) {
        if (!clip) return;
        
        this.clipboard = {
            animation: clip.animation,
            animationIndex: clip.animationIndex,
            duration: clip.duration,
            originalDuration: clip.originalDuration,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd
        };
        
        // Feedback visual
        if (clip.element) {
            clip.element.style.animation = 'clipCopy 0.3s ease';
            setTimeout(() => {
                if (clip.element) {
                    clip.element.style.animation = '';
                }
            }, 300);
        }
        
        console.log('📋 Clip copiado:', clip.animation);
    }
    
    // Colar clip
    pasteClip() {
        if (!this.clipboard) return;
        
        // Determinar onde colar (após o clip selecionado ou no cursor da timeline)
        let startTime = this.currentTime;
        let trackId = 'track1';
        
        if (this.selectedClip) {
            startTime = this.selectedClip.startTime + this.selectedClip.duration;
            trackId = this.selectedClip.track;
        }
        
        // Criar novo clip com os dados copiados
        let newClip;
        if (this.clipboard.animationIndex !== undefined) {
            newClip = this.addClipByIndex(
                this.clipboard.animationIndex,
                this.clipboard.animation,
                this.clipboard.originalDuration,
                trackId,
                startTime
            );
        } else {
            newClip = this.addClip(this.clipboard.animation, trackId, startTime);
        }
        
        // Aplicar trim copiado
        if (newClip) {
            newClip.trimStart = this.clipboard.trimStart;
            newClip.trimEnd = this.clipboard.trimEnd;
            newClip.duration = this.clipboard.duration;
            newClip.originalDuration = this.clipboard.originalDuration;
            
            // Atualizar visual
            if (newClip.element) {
                newClip.element.style.width = `${newClip.duration * this.pixelsPerSecond * this.zoom}px`;
                this.updateTrimVisuals(newClip, newClip.element);
            }
            
            this.selectClip(newClip);
            this.updateDuration();
        }
        
        console.log('📋 Clip colado:', this.clipboard.animation);
    }
    
    // Duplicar clip (atalho para copiar e colar)
    duplicateClip(clip) {
        if (!clip) return;
        
        this.copyClip(clip);
        this.pasteClip();
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
