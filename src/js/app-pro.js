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
        this.setupBackgroundControls();
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

    setupBackgroundControls() {
        const backgroundTypeSelect = document.getElementById('backgroundTypeSelect');
        const colorPickerGroup = document.getElementById('colorPickerGroup');
        const imageUploadGroup = document.getElementById('imageUploadGroup');
        const videoUploadGroup = document.getElementById('videoUploadGroup');
        const backgroundColorPicker = document.getElementById('backgroundColorPicker');
        const backgroundImageInput = document.getElementById('backgroundImageInput');
        const backgroundVideoInput = document.getElementById('backgroundVideoInput');
        const removeBackgroundImage = document.getElementById('removeBackgroundImage');
        const removeBackgroundVideo = document.getElementById('removeBackgroundVideo');

        // Trocar tipo de fundo
        backgroundTypeSelect?.addEventListener('change', (e) => {
            const type = e.target.value;
            
            colorPickerGroup.style.display = type === 'color' ? 'block' : 'none';
            imageUploadGroup.style.display = type === 'image' ? 'block' : 'none';
            videoUploadGroup.style.display = type === 'video' ? 'block' : 'none';

            if (type === 'color' && this.animationSystem) {
                this.animationSystem.setBackgroundColor(backgroundColorPicker.value);
            }
        });

        // Seletor de cor
        backgroundColorPicker?.addEventListener('input', (e) => {
            if (this.animationSystem) {
                this.animationSystem.setBackgroundColor(e.target.value);
            }
        });

        // Upload de imagem
        backgroundImageInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && this.animationSystem) {
                try {
                    await this.animationSystem.setBackgroundImage(file);
                    removeBackgroundImage.style.display = 'block';
                    console.log('✅ Imagem de fundo carregada');
                } catch (error) {
                    console.error('❌ Erro ao carregar imagem:', error);
                    alert('Erro ao carregar imagem de fundo');
                }
            }
        });

        // Upload de vídeo
        backgroundVideoInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && this.animationSystem) {
                try {
                    await this.animationSystem.setBackgroundVideo(file);
                    removeBackgroundVideo.style.display = 'block';
                    console.log('✅ Vídeo de fundo carregado');
                } catch (error) {
                    console.error('❌ Erro ao carregar vídeo:', error);
                    alert('Erro ao carregar vídeo de fundo');
                }
            }
        });

        // Remover imagem
        removeBackgroundImage?.addEventListener('click', () => {
            if (this.animationSystem) {
                this.animationSystem.removeBackground();
                backgroundImageInput.value = '';
                removeBackgroundImage.style.display = 'none';
                console.log('🗑️ Imagem de fundo removida');
            }
        });

        // Remover vídeo
        removeBackgroundVideo?.addEventListener('click', () => {
            if (this.animationSystem) {
                this.animationSystem.removeBackground();
                backgroundVideoInput.value = '';
                removeBackgroundVideo.style.display = 'none';
                console.log('🗑️ Vídeo de fundo removido');
            }
        });

        console.log('✅ Controles de fundo configurados');
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
        
        // Formatos de Redes Sociais
        document.getElementById('btnFormat16x9')?.addEventListener('click', () => {
            this.setViewportFormat('16:9');
        });
        
        document.getElementById('btnFormat9x16')?.addEventListener('click', () => {
            this.setViewportFormat('9:16');
        });
        
        document.getElementById('btnFormat1x1')?.addEventListener('click', () => {
            this.setViewportFormat('1:1');
        });
        
        document.getElementById('btnFormatFree')?.addEventListener('click', () => {
            this.setViewportFormat('free');
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

        // Fullscreen Controls
        this.setupFullscreenControls();
        
        console.log('✅ Controles de viewport configurados');
    }

    setupFullscreenControls() {
        this.isPlaying = true;
        this.playbackSpeed = 1.0;

        // Play/Pause
        const fsPlayPause = document.getElementById('fsPlayPause');
        fsPlayPause?.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            
            if (this.animationSystem) {
                if (this.isPlaying) {
                    this.animationSystem.resumeAnimation();
                    fsPlayPause.textContent = '⏸';
                } else {
                    this.animationSystem.pauseAnimation();
                    fsPlayPause.textContent = '▶';
                }
            }
        });

        // Speed Up
        const fsSpeedUp = document.getElementById('fsSpeedUp');
        fsSpeedUp?.addEventListener('click', () => {
            this.playbackSpeed = Math.min(this.playbackSpeed + 0.25, 3.0);
            this.updatePlaybackSpeed();
        });

        // Speed Down
        const fsSpeedDown = document.getElementById('fsSpeedDown');
        fsSpeedDown?.addEventListener('click', () => {
            this.playbackSpeed = Math.max(this.playbackSpeed - 0.25, 0.25);
            this.updatePlaybackSpeed();
        });
    }

    updatePlaybackSpeed() {
        const fsSpeedValue = document.getElementById('fsSpeedValue');
        if (fsSpeedValue) {
            fsSpeedValue.textContent = `${this.playbackSpeed.toFixed(2)}x`;
        }

        if (this.animationSystem) {
            this.animationSystem.setAnimationSpeed(this.playbackSpeed);
        }
    }
    
    setViewportFormat(format) {
        const viewportContainer = document.querySelector('.viewport-container');
        const viewport3D = document.getElementById('viewport3D');
        
        if (!viewportContainer || !viewport3D) return;
        
        // Remover classe ativa de todos os botões de formato
        document.querySelectorAll('#btnFormat16x9, #btnFormat9x16, #btnFormat1x1, #btnFormatFree').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Remover classes de formato anteriores
        viewportContainer.classList.remove('format-16x9', 'format-9x16', 'format-1x1', 'format-free');
        
        let width, height, aspectRatio;
        
        switch(format) {
            case '16:9':
                // Formato horizontal (YouTube, TV)
                aspectRatio = 16 / 9;
                viewportContainer.classList.add('format-16x9');
                document.getElementById('btnFormat16x9')?.classList.add('active');
                
                // Centralizar e ajustar tamanho
                const containerWidth = viewportContainer.parentElement.offsetWidth;
                width = Math.min(containerWidth * 0.9, 1280);
                height = width / aspectRatio;
                break;
                
            case '9:16':
                // Formato vertical (Stories, Reels, TikTok)
                aspectRatio = 9 / 16;
                viewportContainer.classList.add('format-9x16');
                document.getElementById('btnFormat9x16')?.classList.add('active');
                
                const containerHeight = viewportContainer.parentElement.offsetHeight;
                height = Math.min(containerHeight * 0.9, 720);
                width = height * aspectRatio;
                break;
                
            case '1:1':
                // Formato quadrado (Instagram feed)
                aspectRatio = 1;
                viewportContainer.classList.add('format-1x1');
                document.getElementById('btnFormat1x1')?.classList.add('active');
                
                const containerSize = Math.min(
                    viewportContainer.parentElement.offsetWidth,
                    viewportContainer.parentElement.offsetHeight
                );
                width = height = Math.min(containerSize * 0.8, 720);
                break;
                
            case 'free':
            default:
                // Formato livre (padrão)
                viewportContainer.classList.add('format-free');
                document.getElementById('btnFormatFree')?.classList.add('active');
                viewport3D.style.width = '';
                viewport3D.style.height = '';
                viewport3D.style.margin = '';
                
                // Redimensionar renderizador
                if (this.animationSystem) {
                    this.animationSystem.resizeRenderer();
                }
                return;
        }
        
        // Aplicar dimensões
        viewport3D.style.width = `${width}px`;
        viewport3D.style.height = `${height}px`;
        viewport3D.style.margin = 'auto';
        
        // Mostrar botão de formato livre quando algum formato específico está ativo
        document.getElementById('btnFormatFree').style.display = 'block';
        
        // Redimensionar renderizador Three.js
        if (this.animationSystem) {
            setTimeout(() => {
                this.animationSystem.resizeRenderer();
            }, 100);
        }
        
        console.log(`📱 Formato alterado para ${format}`);
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
                    <button class="anim-add" data-tooltip="Click: Track 1 | Botão Direito: Escolher Track" title="Click esquerdo: adiciona no Track 1&#10;Botão direito: escolher track">+</button>
                `;
                
                // Tornar item arrastável
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        index: index,
                        name: cleanName,
                        duration: anim.duration
                    }));
                    item.style.opacity = '0.5';
                    console.log('🎬 Arrastando:', cleanName);
                });
                
                item.addEventListener('dragend', (e) => {
                    item.style.opacity = '1';
                });
                
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
                
                // Botão + para adicionar - CLICK NORMAL adiciona no track1
                const addBtn = item.querySelector('.anim-add');
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.timelineEditor) {
                        const animName = cleanName || `anim_${index}`;
                        this.timelineEditor.addClipByIndex(index, animName, anim.duration, 'track1');
                        console.log('➕ Adicionado à timeline (Track 1):', animName);
                    }
                });
                
                // BOTÃO DIREITO para escolher track
                addBtn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const menu = document.createElement('div');
                    menu.style.cssText = `
                        position: fixed;
                        left: ${e.clientX}px;
                        top: ${e.clientY}px;
                        background: var(--bg-card);
                        border: 1px solid var(--border);
                        border-radius: 6px;
                        padding: 4px;
                        z-index: 10000;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    `;
                    
                    ['track1', 'track2', 'track3'].forEach(trackId => {
                        const btn = document.createElement('button');
                        btn.textContent = `Track ${trackId.slice(-1)}`;
                        btn.style.cssText = `
                            display: block;
                            width: 100%;
                            padding: 8px 16px;
                            background: transparent;
                            border: none;
                            color: var(--text);
                            cursor: pointer;
                            text-align: left;
                            border-radius: 4px;
                            font-size: 13px;
                        `;
                        btn.onmouseover = () => btn.style.background = 'var(--bg-hover)';
                        btn.onmouseout = () => btn.style.background = 'transparent';
                        btn.onclick = () => {
                            if (this.timelineEditor) {
                                const animName = cleanName || `anim_${index}`;
                                this.timelineEditor.addClipByIndex(index, animName, anim.duration, trackId);
                                console.log(`➕ Adicionado à timeline (${trackId}):`, animName);
                            }
                            document.body.removeChild(menu);
                        };
                        menu.appendChild(btn);
                    });
                    
                    document.body.appendChild(menu);
                    
                    // Fechar ao clicar fora
                    setTimeout(() => {
                        const closeMenu = (ev) => {
                            if (!menu.contains(ev.target)) {
                                document.body.removeChild(menu);
                                document.removeEventListener('click', closeMenu);
                            }
                        };
                        document.addEventListener('click', closeMenu);
                    }, 10);
                });
                
                animationList.appendChild(item);
            });
            
            console.log('✅ Biblioteca de animações carregada:', animations.length, 'animações');
        });
    }
}

// Inicializar
window.ornnStudioPro = new OrnnStudioPro();
