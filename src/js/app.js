// Ornn Animation Studio - App Principal
class OrnnStudio {
    constructor() {
        this.animationSystem = null;
        this.currentAnimationName = 'idle';
        
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        console.log('🔥 Inicializando Ornn Studio...');
        
        // Aguardar sistema de animação carregar
        await this.waitForAnimationSystem();
        
        // Setup UI
        this.setupAnimationButtons();
        this.setupSequenceButtons();
        this.setupSettings();
        this.updateFPSCounter();
        
        console.log('✅ Ornn Studio pronto!');
    }
    
    async waitForAnimationSystem() {
        // Aguardar o sistema de animação estar disponível
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
    
    setupAnimationButtons() {
        const buttons = document.querySelectorAll('.anim-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const animName = btn.dataset.animation;
                
                if (this.animationSystem) {
                    this.animationSystem.changeAnimation(animName);
                    this.currentAnimationName = animName;
                    this.updateCurrentAnimationDisplay(animName);
                    
                    // Atualizar botão ativo
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });
        
        console.log('✅ Botões de animação configurados');
    }
    
    setupSequenceButtons() {
        const buttons = document.querySelectorAll('.sequence-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const sequence = btn.dataset.sequence;
                
                if (!this.animationSystem) return;
                
                if (sequence === 'random') {
                    // Sequência aleatória
                    const anims = ['idle', 'dance', 'walk', 'jump', 'attack', 'spin', 'celebrate'];
                    const randomSequence = [
                        anims[Math.floor(Math.random() * anims.length)],
                        anims[Math.floor(Math.random() * anims.length)],
                        anims[Math.floor(Math.random() * anims.length)]
                    ];
                    this.animationSystem.playSequence(randomSequence);
                    console.log('🎲 Sequência aleatória:', randomSequence.join(' → '));
                } else {
                    // Sequência pré-definida
                    const animList = sequence.split(',');
                    this.animationSystem.playSequence(animList);
                    console.log('🎬 Sequência:', animList.join(' → '));
                }
            });
        });
        
        console.log('✅ Botões de sequência configurados');
    }
    
    setupSettings() {
        // Velocidade
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                if (this.animationSystem) {
                    this.animationSystem.setAnimationSpeed(speed);
                }
                speedValue.textContent = `${speed.toFixed(1)}x`;
            });
        }
        
        // Transição
        const transitionSlider = document.getElementById('transitionSlider');
        const transitionValue = document.getElementById('transitionValue');
        
        if (transitionSlider && transitionValue) {
            transitionSlider.addEventListener('input', (e) => {
                const duration = parseFloat(e.target.value);
                if (this.animationSystem) {
                    this.animationSystem.setTransitionDuration(duration);
                }
                transitionValue.textContent = `${duration.toFixed(2)}s`;
            });
        }
        
        // Auto-rotate
        const autoRotateCheck = document.getElementById('autoRotateCheck');
        if (autoRotateCheck) {
            autoRotateCheck.addEventListener('change', (e) => {
                if (this.animationSystem && this.animationSystem.controls) {
                    this.animationSystem.controls.autoRotate = e.target.checked;
                    this.animationSystem.controls.autoRotateSpeed = 2.0;
                    console.log('🔄 Auto-rotate:', e.target.checked);
                }
            });
        }
        
        // Show grid
        const showGridCheck = document.getElementById('showGridCheck');
        if (showGridCheck) {
            showGridCheck.addEventListener('change', (e) => {
                if (this.animationSystem && this.animationSystem.gridHelper) {
                    this.animationSystem.gridHelper.visible = e.target.checked;
                    console.log('📐 Grid:', e.target.checked);
                }
            });
        }
        
        console.log('✅ Configurações conectadas');
    }
    
    updateCurrentAnimationDisplay(animName) {
        const display = document.getElementById('currentAnimation');
        if (display) {
            const names = {
                'idle': 'Idle',
                'dance': 'Dance',
                'walk': 'Walk',
                'jump': 'Jump',
                'attack': 'Attack',
                'spin': 'Spin',
                'celebrate': 'Celebrate'
            };
            display.textContent = names[animName] || animName;
        }
    }
    
    updateFPSCounter() {
        setInterval(() => {
            if (this.animationSystem) {
                const fps = this.animationSystem.getFPS();
                const fpsElement = document.getElementById('fpsCounter');
                if (fpsElement) {
                    fpsElement.textContent = `FPS: ${fps}`;
                }
            }
        }, 500);
    }
}

// Inicializar aplicação
window.ornnStudio = new OrnnStudio();
