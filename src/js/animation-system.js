// Sistema de Animação do Ornn (3D com Three.js)
class AnimationSystem {
    constructor(canvasId) {
        this.container = document.getElementById(canvasId);
        
        if (!this.container) {
            console.error('Container não encontrado:', canvasId);
            return;
        }
        
        // Estado da aplicação
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.mixer = null;
        this.clock = null;
        this.controls = null;
        this.THREE = null;
        
        // Animações disponíveis
        this.animations = [];
        this.currentAction = null;
        this.animationSpeed = 1.0;
        this.transitionDuration = 0.2; // Reduzido de 0.5 para 0.2 para transições mais rápidas
        
        // Frame tracking
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        
        // Mapeamento de nomes amigáveis para índices
        this.animationMap = {
            'idle': 8,       // Idle_Base - Personagem parado
            'dance': 5,      // Dance
            'run': 13,       // Run
            'attack': 0,     // Attack1
            'spell': 15,     // Spell1
            'death': 6,      // Death
            'laugh': 11,     // Laugh
            'taunt': 19,     // Taunt
            'tpose': 0      // T_Pose - Pose padrão
        };
        
        // Sistema de transição
        this.transitionQueue = [];
        this.autoTransitionInterval = null;
        
        
        // Inicializar sistema 3D
        this.init();
    }
    
    async init() {
        try {
            // Carregar Three.js usando import map
            const THREE = await import('three');
            const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
            const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
            
            this.THREE = THREE;
            
            // Criar cena
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0f0f1e);
            this.clock = new THREE.Clock();
            
            // Configurar câmera com far plane maior para zoom out
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            this.camera = new THREE.PerspectiveCamera(35, width / height, 1, 10000);
            this.camera.position.set(-176.636, 84.696, -110.620);
            
            // Criar renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: false
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            
            // Adicionar ao container
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);
            
            // Controles de câmera
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            this.controls.autoRotate = false;
            this.controls.target.set(0, 50, 0);
            
            // Limites de zoom otimizados
            this.controls.minDistance = 80;
            this.controls.maxDistance = 800;
            this.controls.minPolarAngle = 0;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.zoomSpeed = 1.2;
            this.controls.rotateSpeed = 0.8;
            this.controls.panSpeed = 0.8;
            
            // Iluminação
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
            directionalLight.position.set(5, 10, 5);
            this.scene.add(directionalLight);
            
            const fillLight = new THREE.DirectionalLight(0xffa500, 0.8);
            fillLight.position.set(-5, 5, -5);
            this.scene.add(fillLight);
            
            // Grid de fundo
            const gridHelper = new THREE.GridHelper(200, 20, 0xff6b35, 0x444444);
            gridHelper.material.opacity = 0.2;
            gridHelper.material.transparent = true;
            this.scene.add(gridHelper);
            
            // Carregar modelo Ornn
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    'assets/models/ornn.glb',
                    resolve,
                    (progress) => {
                        const percent = (progress.loaded / progress.total * 100).toFixed(0);
                    },
                    reject
                );
            });
            
            this.model = gltf.scene;
            this.model.scale.set(1, 1, 1);
            this.model.position.set(0, 0, 0);
            this.model.rotation.y = (230 * Math.PI) / 180;
            
            // Desabilitar frustum culling para evitar que o modelo suma ao dar zoom
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.frustumCulled = false;
                }
            });
            
            this.scene.add(this.model);
            
            // Configurar animações
            if (gltf.animations && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                this.animations = gltf.animations;
                
                
                // Listar todas as animações disponíveis no console
                this.animations.forEach((anim, index) => {
                });
                
                // Disparar evento customizado com lista de animações
                window.dispatchEvent(new CustomEvent('animationsLoaded', {
                    detail: {
                        animations: this.animations.map((anim, index) => ({
                            index: index,
                            name: anim.name,
                            duration: anim.duration
                        }))
                    }
                }));
                
                // Iniciar com animação Idle_Base
                this.changeAnimationByIndex(8);
            }
            
            // Bind eventos
            window.addEventListener('resize', () => this.resizeRenderer());
            
            // Click no personagem para T-pose
            this.renderer.domElement.addEventListener('click', (e) => {
                // Verificar se clicou no modelo (não nos controles)
                if (e.target === this.renderer.domElement) {
                    // Buscar T-Pose por nome
                    let tposeIndex = this.animations.findIndex(anim => 
                        anim.name.toLowerCase().includes('t_pose') || 
                        anim.name.toLowerCase().includes('tpose') ||
                        anim.name.toLowerCase() === 't-pose'
                    );
                    
                    
                    
                    // PARAR TIMELINE (stop ao invés de pause)
                    if (window.ornnStudioPro?.timelineEditor?.isPlaying) {
                        window.ornnStudioPro.timelineEditor.stop();
                    }
                    
                    // DESSELECIONAR animações da biblioteca
                    document.querySelectorAll('.anim-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Parar qualquer animação em andamento
                    this.stopAnimation();
                    
                    // Tocar T-Pose com força
                    this.changeAnimationByIndex(tposeIndex, true);
                    
                    // Atualizar display
                    const animValue = document.getElementById('currentAnimValue');
                    if (animValue) {
                        const tposeName = this.animations[tposeIndex]?.name || 'T-Pose';
                        const cleanName = tposeName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        animValue.textContent = cleanName;
                    }
                }
            });
            
            // Iniciar loop de animação
            this.animate();
            
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema 3D:', error);
            this.container.innerHTML = `
                <div style="color: white; text-align: center; padding: 50px;">
                    <h2>❌ Erro ao carregar modelo 3D</h2>
                    <p>${error.message}</p>
                    <p style="font-size: 12px; margin-top: 20px;">Verifique se o arquivo existe em assets/models/ornn.glb</p>
                </div>
            `;
        }
    }
    
    resizeRenderer() {
        if (!this.camera || !this.renderer || !this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
    }
    
    changeAnimation(animationName) {
        if (!this.mixer || !this.animations.length) {
            console.warn('⚠️ Mixer ou animações não disponíveis');
            return false;
        }
        
        const animIndex = this.animationMap[animationName];
        if (animIndex === undefined || !this.animations[animIndex]) {
            console.warn(`⚠️ Animação "${animationName}" não encontrada`);
            return false;
        }
        
        const newAction = this.mixer.clipAction(this.animations[animIndex]);
        
        // Configurar modo de loop baseado na animação
        const loopOnceAnims = ['jump', 'attack', 'spin', 'celebrate'];
        if (loopOnceAnims.includes(animationName)) {
            newAction.setLoop(this.THREE.LoopOnce);
            newAction.clampWhenFinished = true;
        } else {
            newAction.setLoop(this.THREE.LoopRepeat);
        }
        
        // Fazer transição suave
        if (this.currentAction) {
            this.currentAction.fadeOut(this.transitionDuration);
        }
        
        newAction.reset();
        newAction.fadeIn(this.transitionDuration);
        newAction.timeScale = this.animationSpeed;
        newAction.play();
        
        this.currentAction = newAction;
        
        return true;
    }
    
    pauseAnimation() {
        if (this.currentAction) {
            this.currentAction.paused = true;
            return true;
        }
        return false;
    }
    
    resumeAnimation() {
        if (this.currentAction) {
            this.currentAction.paused = false;
            return true;
        }
        return false;
    }
    
    stopAnimation() {
        if (this.currentAction) {
            this.currentAction.stop();
            this.currentAction = null;
            return true;
        }
        return false;
    }
    
    changeAnimationByIndex(index, forceStop = false) {
        if (!this.mixer || !this.animations.length) {
            console.warn('⚠️ Mixer ou animações não disponíveis');
            return false;
        }
        
        if (index < 0 || index >= this.animations.length) {
            console.warn(`⚠️ Índice ${index} fora do range (0-${this.animations.length - 1})`);
            return false;
        }
        
        const newAction = this.mixer.clipAction(this.animations[index]);
        
        // Parar completamente a animação anterior se forceStop for true
        if (forceStop && this.currentAction) {
            this.currentAction.stop();
            this.currentAction = null;
        }
        
        // Fazer transição suave - NÃO chamar stop(), apenas fadeOut
        if (this.currentAction && this.currentAction !== newAction) {
            this.currentAction.fadeOut(this.transitionDuration);
            // Remover stop() para evitar voltar ao T-pose durante transição
        }
        
        newAction.reset();
        newAction.setLoop(this.THREE.LoopRepeat);
        newAction.fadeIn(this.transitionDuration);
        newAction.timeScale = this.animationSpeed;
        newAction.play();
        
        this.currentAction = newAction;
        
        // Atualizar display
        const animValue = document.getElementById('currentAnimValue');
        if (animValue) {
            const cleanName = this.animations[index].name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            animValue.textContent = cleanName;
        }
        
        return true;
    }
    
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(3.0, speed));
        if (this.currentAction) {
            this.currentAction.timeScale = this.animationSpeed;
        }
    }
    
    setTransitionDuration(duration) {
        this.transitionDuration = Math.max(0.05, Math.min(2.0, duration));
    }
    
    playSequence(animationNames, loopSequence = false) {
        this.stopAutoTransition();
        this.transitionQueue = [];
        
        const playNext = (index) => {
            if (index >= animationNames.length) {
                if (loopSequence) {
                    setTimeout(() => playNext(0), 500);
                }
                return;
            }
            
            const animName = animationNames[index];
            this.changeAnimation(animName);
            
            const animIndex = this.animationMap[animName];
            if (animIndex !== undefined && this.animations[animIndex]) {
                const duration = this.animations[animIndex].duration * 1000 / this.animationSpeed;
                setTimeout(() => playNext(index + 1), duration);
            }
        };
        
        playNext(0);
    }
    
    startAutoTransition(interval = 3000) {
        this.stopAutoTransition();
        this.autoTransitionInterval = setInterval(() => {
            const animNames = Object.keys(this.animationMap);
            const randomAnim = animNames[Math.floor(Math.random() * animNames.length)];
            this.changeAnimation(randomAnim);
        }, interval);
    }
    
    stopAutoTransition() {
        if (this.autoTransitionInterval) {
            clearInterval(this.autoTransitionInterval);
            this.autoTransitionInterval = null;
        }
    }
    
    // Obter todas as partes (meshes) do modelo
    getModelParts() {
        if (!this.model) return [];
        
        const parts = [];
        this.model.traverse((child) => {
            if (child.isMesh) {
                parts.push({
                    name: child.name || 'Unnamed',
                    mesh: child,
                    visible: child.visible,
                    vertices: child.geometry.attributes.position?.count || 0,
                    material: child.material.name || 'Default'
                });
            }
        });
        
        return parts;
    }
    
    // Alternar visibilidade de uma parte do modelo
    toggleModelPart(partName, visible) {
        if (!this.model) return false;
        
        let found = false;
        this.model.traverse((child) => {
            if (child.isMesh && (child.name === partName || child.name.includes(partName))) {
                child.visible = visible;
                found = true;
            }
        });
        
        if (found) {
        }
        return found;
    }
    
    // Mostrar todas as partes
    showAllParts() {
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.visible = true;
            }
        });
    }
    
    // Ocultar todas as partes
    hideAllParts() {
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Calcular FPS
        const now = performance.now();
        const delta = now - this.lastTime;
        this.fps = Math.round(1000 / delta);
        this.lastTime = now;
        
        // Atualizar mixer de animações
        if (this.mixer) {
            const clockDelta = this.clock.getDelta();
            this.mixer.update(clockDelta);
        }
        
        // Atualizar controles
        if (this.controls) {
            this.controls.update();
        }
        
        // Renderizar cena
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        this.frameCount++;
    }
    
    getFPS() {
        return this.fps;
    }
    
    // Obter todas as partes (meshes) do modelo
    getModelParts() {
        if (!this.model) return [];
        
        const parts = [];
        this.model.traverse((child) => {
            if (child.isMesh) {
                parts.push({
                    name: child.name || 'Unnamed',
                    mesh: child,
                    visible: child.visible,
                    vertices: child.geometry.attributes.position?.count || 0,
                    material: child.material.name || 'Default'
                });
            }
        });
        
        return parts;
    }
    
    // Alternar visibilidade de uma parte do modelo
    toggleModelPart(partName, visible) {
        if (!this.model) return false;
        
        let found = false;
        this.model.traverse((child) => {
            if (child.isMesh && (child.name === partName || child.name.includes(partName))) {
                child.visible = visible;
                found = true;
            }
        });
        
        if (found) {
        }
        return found;
    }
    
    // Mostrar todas as partes
    showAllParts() {
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.visible = true;
            }
        });
    }
    
    // Ocultar todas as partes
    hideAllParts() {
        if (!this.model) return;
        
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });
    }
    
    // Métodos auxiliares para compatibilidade
    queueTransition(animations, delay = 0) {
        setTimeout(() => {
            if (Array.isArray(animations)) {
                this.playSequence(animations);
            } else {
                this.changeAnimation(animations);
            }
        }, delay);
    }
    
    processTransitionQueue() {
        // Processamento já feito no playSequence
    }
}

// Exportar para uso global
window.AnimationSystem = AnimationSystem;

// Inicializar automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.animationSystem = new AnimationSystem('viewport3D');
    });
} else {
    window.animationSystem = new AnimationSystem('viewport3D');
}
