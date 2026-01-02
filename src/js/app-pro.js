// App Professional - Controlador Principal
import { TimelineEditor } from './timeline-editor.js';

class OrnnStudioPro {
    constructor() {
        this.animationSystem = null;
        this.timelineEditor = null;
        this.transitionSettings = {
            duration: 0.5,
            easing: 'linear',
            blendMode: 'crossfade'
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        console.log('🔥 Ornn Studio Pro inicializando...');
        
        // Aguardar animation system
        await this.waitForAnimationSystem();
        
        // Inicializar timeline
        this.timelineEditor = new TimelineEditor();
        this.timelineEditor.setAnimationSystem(this.animationSystem);
        
        // Setup UI
        this.setupTransitionControls();
        this.setupPlaybackControls();
        this.setupCameraControls();
        this.setupViewportControls();
        this.setupHeaderButtons();
        this.setupVisualOptions();
        this.setupModelParts();
        this.setupAnimationLibrary();
        this.loadAllAnimations();
        
        this.updateFPS();
        
        console.log('✅ Ornn Studio Pro pronto!');
    }
    
    async waitForAnimationSystem() {
        let attempts = 0;
        while (!window.animationSystem && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.animationSystem) {
            this.animationSystem = window.animationSystem;
            console.log('✅ Sistema de animação conectado');
        } else {
            console.error('❌ Timeout: Sistema de animação não carregou');
        }
    }
    
    setupTransitionControls() {
        // Duração
        const transitionSlider = document.getElementById('transitionSlider');
        const transitionValue = document.getElementById('transitionValue');
        
        if (transitionSlider) {
            transitionSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.transitionSettings.duration = value;
                transitionValue.textContent = `${value.toFixed(2)}s`;
                
                if (this.animationSystem) {
                    this.animationSystem.setTransitionDuration(value);
                }
            });
        }
        
        // Easing
        const easingSelect = document.getElementById('easingSelect');
        const easingValue = document.getElementById('easingValue');
        
        if (easingSelect) {
            easingSelect.addEventListener('change', (e) => {
                this.transitionSettings.easing = e.target.value;
                easingValue.textContent = e.target.options[e.target.selectedIndex].text;
                console.log('🎨 Easing:', this.transitionSettings.easing);
            });
        }
        
        // Blend Mode
        const blendSelect = document.getElementById('blendSelect');
        const blendValue = document.getElementById('blendValue');
        
        if (blendSelect) {
            blendSelect.addEventListener('change', (e) => {
                this.transitionSettings.blendMode = e.target.value;
                blendValue.textContent = e.target.options[e.target.selectedIndex].text;
                console.log('🔀 Blend Mode:', this.transitionSettings.blendMode);
            });
        }
        
        console.log('✅ Controles de transição configurados');
    }
    
    setupPlaybackControls() {
        // Velocidade
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                speedValue.textContent = `${value.toFixed(1)}x`;
                
                if (this.animationSystem) {
                    this.animationSystem.setAnimationSpeed(value);
                }
            });
        }
        
        console.log('✅ Controles de reprodução configurados');
    }
    
    setupCameraControls() {
        // Auto-rotate
        const autoRotateCheck = document.getElementById('autoRotateCheck');
        const rotateSpeedSlider = document.getElementById('rotateSpeedSlider');
        const rotateSpeedValue = document.getElementById('rotateSpeedValue');
        
        if (autoRotateCheck) {
            autoRotateCheck.addEventListener('change', (e) => {
                if (this.animationSystem?.controls) {
                    this.animationSystem.controls.autoRotate = e.target.checked;
                    const speed = parseFloat(rotateSpeedSlider?.value || 2);
                    this.animationSystem.controls.autoRotateSpeed = speed;
                }
            });
        }
        
        if (rotateSpeedSlider) {
            rotateSpeedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                rotateSpeedValue.textContent = value.toFixed(1);
                
                if (this.animationSystem?.controls) {
                    this.animationSystem.controls.autoRotateSpeed = value;
                }
            });
        }
        
        // Grid
        const showGridCheck = document.getElementById('showGridCheck');
        if (showGridCheck) {
            showGridCheck.addEventListener('change', (e) => {
                if (this.animationSystem?.gridHelper) {
                    this.animationSystem.gridHelper.visible = e.target.checked;
                }
            });
        }
        
        console.log('✅ Controles de câmera configurados');
    }
    
    setupViewportControls() {
        // Reset Camera
        document.getElementById('btnResetCamera')?.addEventListener('click', () => {
            if (this.animationSystem?.camera) {
                this.animationSystem.camera.position.set(-176, 84, -110);
                this.animationSystem.controls?.target.set(0, 50, 0);
                this.animationSystem.controls?.update();
                console.log('🎥 Câmera resetada');
            }
        });
        
        // Wireframe
        const btnWireframe = document.getElementById('btnWireframe');
        let wireframeEnabled = false;
        
        btnWireframe?.addEventListener('click', () => {
            wireframeEnabled = !wireframeEnabled;
            btnWireframe.classList.toggle('active', wireframeEnabled);
            
            if (this.animationSystem?.model) {
                this.animationSystem.model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.wireframe = wireframeEnabled;
                    }
                });
            }
            console.log('🔲 Wireframe:', wireframeEnabled);
        });
        
        // Grid
        document.getElementById('btnGrid')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.viewport-btn');
            const isActive = btn.classList.toggle('active');
            
            if (this.animationSystem?.gridHelper) {
                this.animationSystem.gridHelper.visible = isActive;
            }
        });
        
        // Fullscreen
        document.getElementById('btnFullscreen')?.addEventListener('click', () => {
            const viewport = document.querySelector('.viewport-container');
            if (viewport) {
                if (!document.fullscreenElement) {
                    viewport.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
        });
        
        console.log('✅ Controles de viewport configurados');
    }
    
    setupHeaderButtons() {
        // Save
        document.getElementById('btnSave')?.addEventListener('click', () => {
            if (this.timelineEditor) {
                this.timelineEditor.saveToDevice();
            }
        });
        
        // Save Sequence
        document.getElementById('btnSaveSequence')?.addEventListener('click', () => {
            if (this.timelineEditor) {
                const name = prompt('Nome da sequência:', `Sequência ${Date.now()}`);
                if (name) {
                    this.timelineEditor.saveSequenceAsAnimation(name);
                }
            }
        });
        
        // Export
        document.getElementById('btnExport')?.addEventListener('click', () => {
            this.exportVideo();
        });
        
        // Undo/Redo (placeholder)
        document.getElementById('btnUndo')?.addEventListener('click', () => {
            console.log('↶ Desfazer (em desenvolvimento)');
        });
        
        document.getElementById('btnRedo')?.addEventListener('click', () => {
            console.log('↷ Refazer (em desenvolvimento)');
        });
        
        // Habilitar auto-save
        if (this.timelineEditor) {
            this.timelineEditor.enableAutoSave();
        }
        
        console.log('✅ Botões do header configurados');
    }
    
    setupVisualOptions() {
        // Shadows
        const shadowsCheck = document.getElementById('shadowsCheck');
        shadowsCheck?.addEventListener('change', (e) => {
            if (this.animationSystem?.renderer) {
                this.animationSystem.renderer.shadowMap.enabled = e.target.checked;
                console.log('🌑 Sombras:', e.target.checked);
            }
        });
        
        // Wireframe
        const wireframeCheck = document.getElementById('wireframeCheck');
        wireframeCheck?.addEventListener('change', (e) => {
            if (this.animationSystem?.model) {
                this.animationSystem.model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.wireframe = e.target.checked;
                    }
                });
                console.log('🔲 Wireframe:', e.target.checked);
            }
        });
        
        // Skeleton
        const skeletonCheck = document.getElementById('skeletonCheck');
        let skeletonHelper = null;
        skeletonCheck?.addEventListener('change', (e) => {
            if (this.animationSystem) {
                if (e.target.checked && !skeletonHelper) {
                    const THREE = this.animationSystem.THREE;
                    if (this.animationSystem.model && THREE) {
                        skeletonHelper = new THREE.SkeletonHelper(this.animationSystem.model);
                        skeletonHelper.material.linewidth = 2;
                        this.animationSystem.scene.add(skeletonHelper);
                        console.log('🦴 Skeleton: ativado');
                    }
                } else if (!e.target.checked && skeletonHelper) {
                    this.animationSystem.scene.remove(skeletonHelper);
                    skeletonHelper = null;
                    console.log('🦴 Skeleton: desativado');
                }
            }
        });
        
        // Background Color
        const bgColorPicker = document.getElementById('bgColorPicker');
        bgColorPicker?.addEventListener('change', (e) => {
            if (this.animationSystem?.scene) {
                const color = e.target.value;
                this.animationSystem.scene.background = new this.animationSystem.THREE.Color(color);
                console.log('🎨 Background:', color);
            }
        });
        
        console.log('✅ Opções visuais configuradas');
    }
    
    setupModelParts() {
        const modelPartsList = document.getElementById('modelPartsList');
        const showAllBtn = document.getElementById('showAllParts');
        const hideAllBtn = document.getElementById('hideAllParts');
        
        // Aguardar modelo carregar
        const loadParts = () => {
            const parts = this.animationSystem.getModelParts();
            
            if (parts.length === 0) {
                modelPartsList.innerHTML = '<p style="color: #888; font-size: 13px; text-align: center; padding: 20px;">Nenhuma parte encontrada</p>';
                return;
            }
            
            modelPartsList.innerHTML = '';
            
            parts.forEach((part, index) => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; transition: background-color 0.2s;';
                item.onmouseenter = () => item.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                item.onmouseleave = () => item.style.backgroundColor = 'transparent';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `part-${index}`;
                checkbox.checked = part.visible;
                checkbox.style.cursor = 'pointer';
                
                checkbox.addEventListener('change', (e) => {
                    this.animationSystem.toggleModelPart(part.name, e.target.checked);
                });
                
                const label = document.createElement('label');
                label.htmlFor = `part-${index}`;
                label.textContent = part.name;
                label.style.cssText = 'flex: 1; font-size: 13px; color: #e0e0e0; cursor: pointer;';
                
                const info = document.createElement('span');
                info.textContent = `${part.vertices.toLocaleString()}v`;
                info.style.cssText = 'font-size: 11px; color: #888;';
                
                item.appendChild(checkbox);
                item.appendChild(label);
                item.appendChild(info);
                modelPartsList.appendChild(item);
            });
            
            console.log(`✅ ${parts.length} partes do modelo listadas`);
        };
        
        // Carregar partes quando modelo estiver pronto
        if (this.animationSystem.model) {
            setTimeout(loadParts, 100);
        } else {
            window.addEventListener('animationsLoaded', () => {
                setTimeout(loadParts, 100);
            });
        }
        
        // Botões de mostrar/ocultar todas
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                this.animationSystem.showAllParts();
                document.querySelectorAll('#modelPartsList input[type="checkbox"]').forEach(cb => {
                    cb.checked = true;
                });
            });
        }
        
        if (hideAllBtn) {
            hideAllBtn.addEventListener('click', () => {
                this.animationSystem.hideAllParts();
                document.querySelectorAll('#modelPartsList input[type="checkbox"]').forEach(cb => {
                    cb.checked = false;
                });
            });
        }
        
        console.log('✅ Painel de Model Parts configurado');
    }
    
    setupAnimationLibrary() {
        document.querySelectorAll('.anim-item').forEach(item => {
            // Click para preview
            item.addEventListener('click', (e) => {
                // Permitir preview mesmo se clicar no botão +
                const animName = item.dataset.animation;
                
                // Marcar como ativo
                document.querySelectorAll('.anim-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Preview da animação
                if (this.animationSystem) {
                    this.animationSystem.changeAnimation(animName);
                    
                    const animValue = document.getElementById('currentAnimValue');
                    if (animValue) {
                        animValue.textContent = animName.charAt(0).toUpperCase() + animName.slice(1);
                    }
                    
                    console.log('🎬 Preview:', animName);
                }
            });
            
            // Double-click para adicionar à timeline
            item.addEventListener('dblclick', (e) => {
                const animName = item.dataset.animation;
                if (this.timelineEditor) {
                    this.timelineEditor.addClip(animName, 'track1');
                    console.log('➕ Adicionado à timeline:', animName);
                }
            });
        });
        
        console.log('✅ Biblioteca de animações configurada');
    }
    
    updateFPS() {
        setInterval(() => {
            if (this.animationSystem) {
                const fps = this.animationSystem.getFPS();
                const fpsEl = document.getElementById('fpsValue');
                if (fpsEl) {
                    fpsEl.textContent = fps;
                }
            }
        }, 500);
    }
    
    exportVideo() {
        const resolution = document.getElementById('resolutionSelect')?.value || '1920x1080';
        const fps = document.getElementById('exportFpsSelect')?.value || '60';
        
        const sequence = this.timelineEditor?.getAnimationSequence();
        
        if (!sequence || sequence.length === 0) {
            alert('⚠️ Adicione clips na timeline antes de exportar!');
            return;
        }
        
        console.log('⬇️ Exportando vídeo:', {
            resolution,
            fps,
            clips: sequence.length,
            duration: this.timelineEditor.duration
        });
        
        alert(`🎬 Exportação configurada:\n• Resolução: ${resolution}\n• FPS: ${fps}\n• Clips: ${sequence.length}\n• Duração: ${this.timelineEditor.duration.toFixed(2)}s\n\n(Funcionalidade de export será implementada)`);
    }
    
    loadAllAnimations() {
        // Escutar evento de animações carregadas
        window.addEventListener('animationsLoaded', (e) => {
            const animations = e.detail.animations;
            console.log('📚 Carregando', animations.length, 'animações na biblioteca');
            
            const animationList = document.getElementById('animationLibrary');
            if (!animationList) return;
            
            // Limpar loading
            animationList.innerHTML = '';
            
            // Adicionar todas as animações
            animations.forEach((anim, index) => {
                const item = document.createElement('div');
                item.className = 'anim-item';
                item.dataset.animationIndex = index;
                
                // Nome mais limpo
                const cleanName = anim.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                item.innerHTML = `
                    <div class="anim-icon">🎬</div>
                    <div class="anim-info">
                        <div class="anim-name">${cleanName || 'Animação ' + index}</div>
                        <div class="anim-duration">${anim.duration.toFixed(2)}s • #${index}</div>
                    </div>
                    <button class="anim-add" data-tooltip="Adicionar à Timeline">+</button>
                `;
                
                // Click para preview (toggle play/pause)
                let isPlaying = false;
                item.addEventListener('click', (e) => {
                    // Não processar se clicou no botão +
                    if (e.target.classList.contains('anim-add')) return;
                    
                    if (isPlaying) {
                        // Parar animação
                        if (this.animationSystem) {
                            this.animationSystem.pauseAnimation();
                            item.classList.remove('active');
                            isPlaying = false;
                            console.log('⏸ Pausado:', cleanName);
                        }
                    } else {
                        // Tocar animação
                        document.querySelectorAll('.anim-item').forEach(i => i.classList.remove('active'));
                        item.classList.add('active');
                        
                        // PARAR TIMELINE SE ESTIVER RODANDO
                        if (this.timelineEditor && this.timelineEditor.isPlaying) {
                            this.timelineEditor.pause();
                            console.log('⏹ Timeline pausada (preview da biblioteca)');
                        }
                        
                        if (this.animationSystem) {
                            this.animationSystem.changeAnimationByIndex(index);
                            isPlaying = true;
                            console.log('▶️ Preview:', cleanName, '#' + index);
                            
                            const animValue = document.getElementById('currentAnimValue');
                            if (animValue) {
                                animValue.textContent = cleanName;
                            }
                        }
                    }
                });
                
                // Botão + para adicionar
                const addBtn = item.querySelector('.anim-add');
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.timelineEditor) {
                        const animName = cleanName || `anim_${index}`;
                        this.timelineEditor.addClipByIndex(index, animName, anim.duration, 'track1');
                        console.log('➕ Adicionado à timeline:', animName);
                    }
                });
                
                animationList.appendChild(item);
            });
            
            console.log('✅ Biblioteca de animações carregada:', animations.length, 'animações');
        });
    }
}

// Inicializar
window.ornnStudioPro = new OrnnStudioPro();
