// Botanical Garden - Language as Living Flora
// Interactive generative art visualizing typed text as blooming flowers

const canvas = document.getElementById('gardenCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// Boundary constraints
const MARGIN_PERCENTAGE = 0.18; // 18% margin from edges
let canvasBounds = {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0
};

function updateCanvasBounds() {
    const marginX = width * MARGIN_PERCENTAGE;
    const marginY = height * MARGIN_PERCENTAGE;
    canvasBounds.minX = -width / 2 + marginX;
    canvasBounds.maxX = width / 2 - marginX;
    canvasBounds.minY = -height / 2 + marginY;
    canvasBounds.maxY = height / 2 - marginY;
}

updateCanvasBounds();

// Audio System
let audioContext = null;
let masterGainNode = null;
let musicGainNode = null;
let ambientGainNode = null;
let isMuted = false;
let masterVolume = 0.2; // 20% default volume
let isAudioInitialized = false;

// Oscillators for generative ambient music
let musicOscillators = [];
let musicStartTime = 0;

// Application state
let isPaused = false;
let isBirdsEye = false;
let intensityMultiplier = 1;
let time = 0;
let lastKeystrokeTime = 0;
let sessionStartTime = Date.now();
let totalKeystrokes = 0;
let isNightMode = false;

// Camera and view
let cameraX = 0;
let cameraY = 0;
let cameraZ = 1;
let targetCameraZ = 1;

// Garden data
const flowers = [];
const particles = [];
const letterIndex = {}; // Track each letter and repetition count
let characterCount = 0;
const flowerCounts = {}; // Track repetition for each letter

// Sacred geometry
const geometryRings = [];
const GEOMETRY_RING_COUNT = 8;

// Botanical alphabet mapping
const botanicalAlphabet = {
    'a': { name: 'Anemone', colors: ['#E8D5F2', '#C9A9E0', '#9B7BB5'], petalCount: [6, 8], size: [20, 30] },
    'b': { name: 'Bluebell', colors: ['#4A5FCC', '#6B7FE8', '#8DA4FF'], petalCount: [5, 6], size: [18, 25] },
    'c': { name: 'Carnation', colors: ['#FF6B9D', '#FFB3C9', '#FFFFFF'], petalCount: [20, 30], size: [25, 35] },
    'd': { name: 'Dahlia', colors: ['#FF6B4A', '#FF8C66', '#FFD4C9'], petalCount: [25, 40], size: [30, 45] },
    'e': { name: 'Elderflower', colors: ['#FFFEF7', '#F5F4E8', '#E8E7D5'], petalCount: [8, 12], size: [15, 22] },
    'f': { name: 'Foxglove', colors: ['#B565D8', '#D896FF', '#E8B3FF'], petalCount: [5, 6], size: [22, 32] },
    'g': { name: 'Gladiolus', colors: ['#FF4D6D', '#FF8FA3', '#FFB3C1'], petalCount: [6, 8], size: [25, 35] },
    'h': { name: 'Hollyhock', colors: ['#FFD93D', '#FF6B6B', '#B565D8'], petalCount: [8, 12], size: [28, 40] },
    'i': { name: 'Iris', colors: ['#6B7FE8', '#9B7BB5', '#FFD93D'], petalCount: [3, 6], size: [25, 35] },
    'j': { name: 'Jasmine', colors: ['#FFFFFF', '#FFFEF7', '#F5F4E8'], petalCount: [5, 7], size: [18, 25] },
    'k': { name: 'Kingcup', colors: ['#FFD93D', '#FFED4E', '#FFF5A0'], petalCount: [8, 12], size: [20, 28] },
    'l': { name: 'Lavender', colors: ['#9B7BB5', '#B896D8', '#D5C4E8'], petalCount: [15, 25], size: [18, 28] },
    'm': { name: 'Magnolia', colors: ['#FFB3C9', '#FFFFFF', '#FFF5F7'], petalCount: [8, 12], size: [32, 45] },
    'n': { name: 'Narcissus', colors: ['#FFD93D', '#FFFFFF', '#FFFEF7'], petalCount: [6, 8], size: [22, 32] },
    'o': { name: 'Orchid', colors: ['#B565D8', '#FF6B9D', '#FFFFFF'], petalCount: [5, 7], size: [25, 35] },
    'p': { name: 'Peony', colors: ['#FF6B9D', '#FFB3C9', '#FFFFFF'], petalCount: [30, 50], size: [35, 50] },
    'q': { name: 'Queen Anne\'s Lace', colors: ['#FFFFFF', '#FFFEF7', '#F5F4E8'], petalCount: [20, 30], size: [25, 35] },
    'r': { name: 'Rose', colors: ['#FF6B9D', '#FF4D6D', '#FFFFFF'], petalCount: [20, 30], size: [28, 40] },
    's': { name: 'Sunflower', colors: ['#FFD93D', '#FFED4E', '#8B4513'], petalCount: [15, 25], size: [40, 55] },
    't': { name: 'Tulip', colors: ['#FF6B4A', '#FF8FA3', '#FFD93D'], petalCount: [6, 8], size: [25, 35] },
    'u': { name: 'Urchin Flower', colors: ['#9B7BB5', '#B565D8', '#D896FF'], petalCount: [40, 60], size: [22, 32] },
    'v': { name: 'Violet', colors: ['#6B7FE8', '#9B7BB5', '#4A5FCC'], petalCount: [5, 6], size: [15, 22] },
    'w': { name: 'Wisteria', colors: ['#9B7BB5', '#B896D8', '#6B7FE8'], petalCount: [8, 12], size: [20, 30] },
    'x': { name: 'Xerianthemum', colors: ['#FFB3C9', '#E8B3FF', '#D5C4E8'], petalCount: [12, 18], size: [18, 26] },
    'y': { name: 'Yarrow', colors: ['#FFD93D', '#FF6B4A', '#FFB3C9'], petalCount: [10, 15], size: [22, 30] },
    'z': { name: 'Zinnia', colors: ['#FF6B4A', '#FFD93D', '#FF6B9D'], petalCount: [15, 25], size: [25, 35] }
};

// Pollen particles colors
const pollenColors = ['#FFD93D', '#FFED4E', '#FFF5A0', '#FFB3C9', '#E8D5F2'];

// Falling petals array
const fallingPetals = [];

// Active bees array
const activeBees = [];

// Bee spawn timing
let lastBeeSpawnTime = 0;
const BEE_SPAWN_INTERVAL_MIN = 10000; // 10 seconds
const BEE_SPAWN_INTERVAL_MAX = 30000; // 30 seconds
let nextBeeSpawnTime = 0;

// Audio initialization and management
function initAudio() {
    if (isAudioInitialized) return;
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master gain node
        masterGainNode = audioContext.createGain();
        masterGainNode.connect(audioContext.destination);
        masterGainNode.gain.setValueAtTime(masterVolume, audioContext.currentTime);
        
        // Create music gain node
        musicGainNode = audioContext.createGain();
        musicGainNode.connect(masterGainNode);
        musicGainNode.gain.setValueAtTime(0.15, audioContext.currentTime); // 15% of master
        
        // Create ambient gain node (for future ambient sounds)
        ambientGainNode = audioContext.createGain();
        ambientGainNode.connect(masterGainNode);
        ambientGainNode.gain.setValueAtTime(0.12, audioContext.currentTime); // 12% of master
        
        isAudioInitialized = true;
        startMeditativeMusic();
        
    } catch (e) {
        console.warn('Audio initialization failed:', e);
    }
}

// Generate meditative ambient music using Web Audio API
function startMeditativeMusic() {
    if (!audioContext || !musicGainNode) return;
    
    musicStartTime = audioContext.currentTime;
    
    // Create a meditative soundscape with multiple layers
    // Layer 1: Deep sustained pad (root note)
    createPadLayer(110, 0.03, 0); // A2 - deep foundation
    
    // Layer 2: Harmonic pad (perfect fifth)
    createPadLayer(165, 0.025, 0.5); // E3 - adds warmth
    
    // Layer 3: High shimmer pad (octave + fifth)
    createPadLayer(330, 0.015, 1.2); // E4 - ethereal shimmer
    
    // Layer 4: Slow evolving texture
    createEvolvingLayer(220, 0.02, 2); // A3 - movement
    
    // Layer 5: Sparse bell-like tones
    scheduleBellTones();
}

function createPadLayer(frequency, volume, delay) {
    if (!audioContext) return;
    
    setTimeout(() => {
        if (!audioContext || isPaused) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // Slow frequency modulation for organic feel
        const lfoFreq = 0.05 + Math.random() * 0.05;
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.setValueAtTime(lfoFreq, audioContext.currentTime);
        lfoGain.gain.setValueAtTime(frequency * 0.002, audioContext.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        // Low-pass filter for warmth
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
        filterNode.Q.setValueAtTime(0.5, audioContext.currentTime);
        
        // Gentle fade in
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 4);
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(musicGainNode);
        
        oscillator.start(audioContext.currentTime);
        lfo.start(audioContext.currentTime);
        
        musicOscillators.push({ oscillator, gainNode, lfo, lfoGain });
    }, delay * 1000);
}

function createEvolvingLayer(baseFreq, volume, delay) {
    if (!audioContext) return;
    
    setTimeout(() => {
        if (!audioContext || isPaused) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
        
        // Evolving filter for texture
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(400, audioContext.currentTime);
        filterNode.Q.setValueAtTime(2, audioContext.currentTime);
        
        // Slowly sweep filter
        const sweepDuration = 20 + Math.random() * 10;
        filterNode.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + sweepDuration);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 6);
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(musicGainNode);
        
        oscillator.start(audioContext.currentTime);
        
        musicOscillators.push({ oscillator, gainNode });
    }, delay * 1000);
}

function scheduleBellTones() {
    if (!audioContext || isPaused) return;
    
    const frequencies = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    const nextBellTime = 8000 + Math.random() * 12000; // 8-20 seconds
    
    setTimeout(() => {
        if (!audioContext || isPaused || isMuted) {
            scheduleBellTones(); // Reschedule
            return;
        }
        
        playBellTone(frequencies[Math.floor(Math.random() * frequencies.length)]);
        scheduleBellTones(); // Schedule next bell
    }, nextBellTime);
}

function playBellTone(frequency) {
    if (!audioContext || !musicGainNode) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Bell envelope: quick attack, long decay
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.008, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 4);
    
    oscillator.connect(gainNode);
    gainNode.connect(musicGainNode);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 4);
}

function playKeystrokeChime(char) {
    if (!audioContext || !musicGainNode || isMuted) return;
    
    const baseFreq = 523.25; // C5
    const charCode = char.toLowerCase().charCodeAt(0);
    const offset = charCode - 97; // a=0, z=25
    const frequency = baseFreq * Math.pow(2, offset / 24); // Microtonal scale
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.015, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.6);
    
    oscillator.connect(gainNode);
    gainNode.connect(musicGainNode);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
}

function stopMusic() {
    musicOscillators.forEach(({ oscillator, gainNode, lfo, lfoGain }) => {
        if (gainNode && audioContext) {
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
        }
        if (oscillator) {
            setTimeout(() => {
                try { oscillator.stop(); } catch (e) {}
            }, 600);
        }
        if (lfo) {
            setTimeout(() => {
                try { lfo.stop(); } catch (e) {}
            }, 600);
        }
    });
    musicOscillators = [];
}

function setMasterVolume(volume) {
    masterVolume = volume;
    if (masterGainNode && audioContext) {
        masterGainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
    }
    updateAudioIndicator();
}

function toggleMute() {
    isMuted = !isMuted;
    if (masterGainNode && audioContext) {
        const targetVolume = isMuted ? 0 : masterVolume;
        masterGainNode.gain.linearRampToValueAtTime(targetVolume, audioContext.currentTime + 0.1);
    }
    updateAudioIndicator();
    document.getElementById('muteBtn').textContent = isMuted ? 'Unmute Audio' : 'Mute Audio';
}

function updateAudioIndicator() {
    const indicator = document.getElementById('audioIndicator');
    if (isMuted || masterVolume === 0) {
        indicator.classList.add('muted');
    } else {
        indicator.classList.remove('muted');
    }
}

function pauseAudio() {
    if (audioContext && audioContext.state === 'running') {
        audioContext.suspend();
    }
}

function resumeAudio() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Falling Petal class
class FallingPetal {
    constructor(x, y, color, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = (Math.random() - 0.5) * 0.8; // Gentle horizontal drift
        this.vy = 0.5 + Math.random() * 0.5; // Downward fall
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.08;
        this.alpha = 0.9;
        this.age = 0;
        this.lifespan = 3 + Math.random() * 2; // 3-5 seconds
        this.swayPhase = Math.random() * Math.PI * 2;
    }
    
    update(dt) {
        // Swaying motion as it falls
        const sway = Math.sin(this.age * 2 + this.swayPhase) * 0.5;
        this.x += this.vx + sway;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.age += dt;
        this.alpha = Math.max(0, 0.9 * (1 - this.age / this.lifespan));
    }
    
    draw() {
        if (this.alpha <= 0) return;
        
        const screenX = width / 2 + (this.x - cameraX) * cameraZ;
        const screenY = height / 2 + (this.y - cameraY) * cameraZ;
        const scaledSize = this.size * cameraZ;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        
        // Petal shape
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, scaledSize);
        gradient.addColorStop(0, this.color + 'FF');
        gradient.addColorStop(0.6, this.color + 'AA');
        gradient.addColorStop(1, this.color + '33');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, scaledSize * 0.4, scaledSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Bee class
class Bee {
    constructor() {
        // Spawn from random edge
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { // Top
            this.x = canvasBounds.minX + Math.random() * (canvasBounds.maxX - canvasBounds.minX);
            this.y = canvasBounds.minY;
        } else if (edge === 1) { // Right
            this.x = canvasBounds.maxX;
            this.y = canvasBounds.minY + Math.random() * (canvasBounds.maxY - canvasBounds.minY);
        } else if (edge === 2) { // Bottom
            this.x = canvasBounds.minX + Math.random() * (canvasBounds.maxX - canvasBounds.minX);
            this.y = canvasBounds.maxY;
        } else { // Left
            this.x = canvasBounds.minX;
            this.y = canvasBounds.minY + Math.random() * (canvasBounds.maxY - canvasBounds.minY);
        }
        
        this.age = 0;
        this.lifespan = 3 + Math.random() * 5; // 3-8 seconds
        this.size = 8 + Math.random() * 4;
        this.wingPhase = Math.random() * Math.PI * 2;
        this.speed = 40 + Math.random() * 30; // pixels per second
        
        // Select 2-5 flowers to visit
        this.targetFlowers = [];
        if (flowers.length > 0) {
            const flowerCount = Math.min(flowers.length, 2 + Math.floor(Math.random() * 4));
            const shuffled = [...flowers].sort(() => Math.random() - 0.5);
            
            // Prefer fuller flowers
            const sorted = shuffled.sort((a, b) => b.repetition - a.repetition);
            this.targetFlowers = sorted.slice(0, flowerCount);
        }
        
        this.currentTargetIndex = 0;
        this.hoverTime = 0;
        this.hoverDuration = 0.5 + Math.random() * 1.5; // 0.5-2 seconds per flower
        this.isHovering = false;
        this.exitAngle = Math.random() * Math.PI * 2;
    }
    
    update(dt) {
        this.age += dt;
        this.wingPhase += dt * 15; // Wing flapping speed
        
        if (this.age >= this.lifespan) {
            return; // Bee will be removed
        }
        
        // Check if we have flowers to visit
        if (this.targetFlowers.length === 0 || this.currentTargetIndex >= this.targetFlowers.length) {
            // Exit the canvas
            const exitSpeed = this.speed * dt;
            this.x += Math.cos(this.exitAngle) * exitSpeed;
            this.y += Math.sin(this.exitAngle) * exitSpeed;
            return;
        }
        
        const targetFlower = this.targetFlowers[this.currentTargetIndex];
        const dx = targetFlower.x - this.x;
        const dy = targetFlower.y - targetFlower.stemHeight - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 15 && !this.isHovering) {
            // Arrived at flower, start hovering
            this.isHovering = true;
            this.hoverTime = 0;
        }
        
        if (this.isHovering) {
            // Hover at flower
            this.hoverTime += dt;
            // Small circular hovering motion
            const hoverRadius = 5;
            this.x = targetFlower.x + Math.cos(this.age * 3) * hoverRadius;
            this.y = targetFlower.y - targetFlower.stemHeight + Math.sin(this.age * 3) * hoverRadius;
            
            if (this.hoverTime >= this.hoverDuration) {
                // Move to next flower
                this.isHovering = false;
                this.hoverTime = 0;
                this.currentTargetIndex++;
                this.hoverDuration = 0.5 + Math.random() * 1.5;
            }
        } else {
            // Fly toward target flower with curved path
            const moveSpeed = this.speed * dt;
            const angle = Math.atan2(dy, dx);
            const curvature = Math.sin(this.age * 2) * 0.3; // Add some curvature
            this.x += Math.cos(angle + curvature) * moveSpeed;
            this.y += Math.sin(angle + curvature) * moveSpeed;
        }
    }
    
    draw() {
        const screenX = width / 2 + (this.x - cameraX) * cameraZ;
        const screenY = height / 2 + (this.y - cameraY) * cameraZ;
        const scaledSize = this.size * cameraZ;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Body (yellow/black stripes)
        const bodyGradient = ctx.createLinearGradient(-scaledSize * 0.3, 0, scaledSize * 0.3, 0);
        bodyGradient.addColorStop(0, '#FFD93D');
        bodyGradient.addColorStop(0.5, '#8B4513');
        bodyGradient.addColorStop(1, '#FFD93D');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, scaledSize * 0.4, scaledSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings (fluttering)
        const wingFlutter = Math.sin(this.wingPhase) * 0.3;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = isNightMode ? 'rgba(200, 220, 240, 0.4)' : 'rgba(255, 255, 255, 0.7)';
        
        // Left wing
        ctx.save();
        ctx.rotate(wingFlutter - 0.3);
        ctx.beginPath();
        ctx.ellipse(-scaledSize * 0.2, 0, scaledSize * 0.35, scaledSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Right wing
        ctx.save();
        ctx.rotate(-wingFlutter + 0.3);
        ctx.beginPath();
        ctx.ellipse(scaledSize * 0.2, 0, scaledSize * 0.35, scaledSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Flower class
class Flower {
    constructor(char, x, y, velocity, repetition) {
        this.char = char.toLowerCase();
        this.x = x;
        this.y = y;
        this.creationTime = time;
        this.velocity = velocity;
        this.repetition = repetition;
        
        // Get flower species data
        const species = botanicalAlphabet[this.char] || botanicalAlphabet['a'];
        this.species = species;
        this.name = species.name;
        
        // Size increases with repetition
        const baseSize = species.size[0] + Math.random() * (species.size[1] - species.size[0]);
        this.size = baseSize * (1 + repetition * 0.3);
        
        // Petal count increases with repetition
        const basePetals = species.petalCount[0] + Math.floor(Math.random() * (species.petalCount[1] - species.petalCount[0]));
        this.petalCount = Math.floor(basePetals * (1 + repetition * 0.2));
        
        // Color from species palette
        this.color = species.colors[Math.floor(Math.random() * species.colors.length)];
        this.stemHeight = 30 + Math.random() * 20;
        
        // Bounding radius for collision detection (1.5x size for breathing room)
        this.boundingRadius = this.size * 1.8 + this.stemHeight * 0.5;
        
        // Animation
        this.bloomProgress = 0;
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.001 + Math.random() * 0.0005;
        this.swayAmount = 0.03 + Math.random() * 0.02;
        this.rotationOffset = Math.random() * Math.PI * 2;
        
        // Petal shedding timing
        this.lastPetalShedTime = time;
        this.nextPetalShedDelay = 5000 + Math.random() * 25000; // 5-30 seconds
    }
    
    update() {
        // Bloom animation
        if (this.bloomProgress < 1) {
            this.bloomProgress += 0.03;
        }
        
        // Petal shedding
        if (this.bloomProgress >= 1 && time - this.lastPetalShedTime >= this.nextPetalShedDelay) {
            this.shedPetals();
            this.lastPetalShedTime = time;
            // Older/fuller flowers shed more frequently
            const frequencyMultiplier = 1 - (this.repetition * 0.05);
            this.nextPetalShedDelay = (5000 + Math.random() * 25000) * Math.max(0.5, frequencyMultiplier);
        }
    }
    
    shedPetals() {
        // Shed 1-3 petals
        const petalCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < petalCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.size * 0.3;
            const petalX = this.x + Math.cos(angle) * distance;
            const petalY = this.y - this.stemHeight + Math.sin(angle) * distance;
            const petalSize = this.size * 0.15;
            fallingPetals.push(new FallingPetal(petalX, petalY, this.color, petalSize));
        }
    }
    
    draw() {
        this.update();
        
        const screenX = width / 2 + (this.x - cameraX) * cameraZ;
        const screenY = height / 2 + (this.y - cameraY) * cameraZ;
        const scaledSize = this.size * cameraZ * this.bloomProgress;
        
        // Gentle sway
        const sway = Math.sin(time * this.swaySpeed + this.swayPhase) * this.swayAmount;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(sway);
        
        // Draw stem
        const stemHeight = this.stemHeight * cameraZ;
        ctx.strokeStyle = isNightMode ? 'rgba(80, 120, 100, 0.6)' : 'rgba(100, 140, 80, 0.7)';
        ctx.lineWidth = Math.max(1, 2 * cameraZ);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stemHeight);
        ctx.stroke();
        
        // Draw flower head
        ctx.translate(0, -stemHeight);
        this.drawFlowerHead(scaledSize);
        
        ctx.restore();
    }
    
    drawFlowerHead(size) {
        // Watercolor-style petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (i / this.petalCount) * Math.PI * 2 + this.rotationOffset;
            const petalLength = size * 0.6;
            const petalWidth = size * 0.3;
            
            ctx.save();
            ctx.rotate(angle);
            
            // Petal with gradient (watercolor effect)
            const gradient = ctx.createRadialGradient(0, -petalLength * 0.3, 0, 0, -petalLength * 0.3, petalLength);
            
            if (isNightMode) {
                // Add bioluminescence in night mode
                gradient.addColorStop(0, this.color + 'CC');
                gradient.addColorStop(0.6, this.color + '88');
                gradient.addColorStop(1, this.color + '33');
            } else {
                gradient.addColorStop(0, this.color + 'FF');
                gradient.addColorStop(0.6, this.color + 'AA');
                gradient.addColorStop(1, this.color + '44');
            }
            
            ctx.fillStyle = gradient;
            
            // Petal shape
            ctx.beginPath();
            ctx.ellipse(0, -petalLength * 0.5, petalWidth, petalLength, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Subtle outline
            ctx.strokeStyle = isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Center of flower
        const centerSize = size * 0.25;
        const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
        
        if (isNightMode) {
            centerGradient.addColorStop(0, '#FFD93DDD');
            centerGradient.addColorStop(1, '#FF8C6666');
        } else {
            centerGradient.addColorStop(0, '#FFD93D');
            centerGradient.addColorStop(1, '#FF8C66');
        }
        
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Collision detection helper functions
function checkCollision(x, y, radius, existingFlowers) {
    for (let flower of existingFlowers) {
        const dx = x - flower.x;
        const dy = y - flower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = radius + flower.boundingRadius;
        
        if (distance < minDistance) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function checkBounds(x, y, radius) {
    // Check if flower would be outside canvas bounds
    if (x - radius < canvasBounds.minX) return false;
    if (x + radius > canvasBounds.maxX) return false;
    if (y - radius < canvasBounds.minY) return false;
    if (y + radius > canvasBounds.maxY) return false;
    return true;
}

function constrainToBounds(x, y, radius) {
    // Constrain position to stay within bounds
    let constrainedX = x;
    let constrainedY = y;
    
    if (x - radius < canvasBounds.minX) constrainedX = canvasBounds.minX + radius;
    if (x + radius > canvasBounds.maxX) constrainedX = canvasBounds.maxX - radius;
    if (y - radius < canvasBounds.minY) constrainedY = canvasBounds.minY + radius;
    if (y + radius > canvasBounds.maxY) constrainedY = canvasBounds.maxY - radius;
    
    return { x: constrainedX, y: constrainedY };
}

function findNonCollidingPosition(targetX, targetY, radius, existingFlowers, maxAttempts = 50) {
    // First constrain target to bounds
    const constrained = constrainToBounds(targetX, targetY, radius);
    
    // Try the constrained target position first
    if (checkBounds(constrained.x, constrained.y, radius) && !checkCollision(constrained.x, constrained.y, radius, existingFlowers)) {
        return { x: constrained.x, y: constrained.y };
    }
    
    // If collision or out of bounds, try nearby positions in a spiral pattern
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const spiralAngle = attempt * 0.618 * Math.PI * 2; // Golden angle
        const spiralDistance = 20 + attempt * 8; // Gradually move outward
        
        let testX = constrained.x + Math.cos(spiralAngle) * spiralDistance;
        let testY = constrained.y + Math.sin(spiralAngle) * spiralDistance;
        
        // Constrain test position to bounds
        const testConstrained = constrainToBounds(testX, testY, radius);
        testX = testConstrained.x;
        testY = testConstrained.y;
        
        if (checkBounds(testX, testY, radius) && !checkCollision(testX, testY, radius, existingFlowers)) {
            return { x: testX, y: testY };
        }
    }
    
    // If still no valid position, try random positions within bounds
    for (let attempt = 0; attempt < 20; attempt++) {
        const randomX = canvasBounds.minX + radius + Math.random() * (canvasBounds.maxX - canvasBounds.minX - 2 * radius);
        const randomY = canvasBounds.minY + radius + Math.random() * (canvasBounds.maxY - canvasBounds.minY - 2 * radius);
        
        if (!checkCollision(randomX, randomY, radius, existingFlowers)) {
            return { x: randomX, y: randomY };
        }
    }
    
    // Last resort: place at center with offset
    const centerOffset = flowers.length * 5;
    const angle = flowers.length * 0.618 * Math.PI * 2;
    return constrainToBounds(
        Math.cos(angle) * centerOffset,
        Math.sin(angle) * centerOffset,
        radius
    );
}

// Particle class (pollen)
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5 - 0.5; // Slight upward drift
        this.alpha = 0.9;
        this.size = 1.5 + Math.random() * 2.5;
        this.color = color || pollenColors[Math.floor(Math.random() * pollenColors.length)];
        this.lifespan = 4 + Math.random() * 4;
        this.age = 0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }
    
    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.age += dt;
        this.rotation += this.rotationSpeed;
        this.alpha = Math.max(0, 0.9 * (1 - this.age / this.lifespan));
    }
    
    draw() {
        if (this.alpha <= 0) return;
        
        const screenX = width / 2 + (this.x - cameraX) * cameraZ;
        const screenY = height / 2 + (this.y - cameraY) * cameraZ;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        const alpha = this.alpha * intensityMultiplier;
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(0, 0, this.size * cameraZ, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Initialize sacred geometry
function initGeometry() {
    for (let i = 0; i < GEOMETRY_RING_COUNT; i++) {
        geometryRings.push({
            radius: 100 + i * 80,
            alpha: 0.05 + i * 0.005,
            rotationSpeed: 0.0001 * (i % 2 === 0 ? 1 : -1),
            rotation: 0,
            hexagons: i % 2 === 0
        });
    }
}

// Draw sacred geometry
function drawGeometry() {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    
    geometryRings.forEach(ring => {
        ring.rotation += ring.rotationSpeed;
        
        ctx.save();
        ctx.rotate(ring.rotation);
        
        // Adjust color based on day/night mode
        const geometryAlpha = ring.alpha * intensityMultiplier * 0.5;
        if (isNightMode) {
            ctx.strokeStyle = `rgba(150, 200, 220, ${geometryAlpha})`;
        } else {
            ctx.strokeStyle = `rgba(94, 82, 64, ${geometryAlpha})`;
        }
        ctx.lineWidth = 0.5;
        
        // Concentric circles
        ctx.beginPath();
        ctx.arc(0, 0, ring.radius * cameraZ, 0, Math.PI * 2);
        ctx.stroke();
        
        // Hexagonal sacred geometry pattern
        if (ring.hexagons) {
            const sides = 6;
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * ring.radius * cameraZ, Math.sin(angle) * ring.radius * cameraZ);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    });
    
    ctx.restore();
}

// Draw background
function drawBackground() {
    if (isNightMode) {
        // Night garden - cool moonlit tones
        const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
        bgGradient.addColorStop(0, '#1a2830');
        bgGradient.addColorStop(0.7, '#0f1419');
        bgGradient.addColorStop(1, '#080a0d');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
    } else {
        // Day garden - warm sunlit fertile ground
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#f5f3e8');
        bgGradient.addColorStop(0.5, '#e8e6d8');
        bgGradient.addColorStop(1, '#dcd9c8');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
    }
}

// Handle keystroke with collision detection
function handleKeystroke(char) {
    const lowerChar = char.toLowerCase();
    
    // Only process letters
    if (!botanicalAlphabet[lowerChar]) {
        return;
    }
    
    const currentTime = Date.now();
    const timeSinceLastKey = lastKeystrokeTime ? currentTime - lastKeystrokeTime : 0;
    const velocity = timeSinceLastKey > 0 ? Math.min(10, 1000 / timeSinceLastKey) : 1;
    
    lastKeystrokeTime = currentTime;
    
    // Track repetition count for this letter
    if (!flowerCounts[lowerChar]) {
        flowerCounts[lowerChar] = 0;
    }
    const repetition = flowerCounts[lowerChar];
    flowerCounts[lowerChar]++;
    
    // Get species data to calculate size for collision detection
    const species = botanicalAlphabet[lowerChar];
    const baseSize = species.size[0] + Math.random() * (species.size[1] - species.size[0]);
    const adjustedSize = baseSize * (1 + repetition * 0.3);
    const stemHeight = 30 + Math.random() * 20;
    const boundingRadius = adjustedSize * 1.8 + stemHeight * 0.5;
    
    // Calculate ideal position based on timing and rhythm
    let targetX, targetY;
    
    if (flowers.length === 0) {
        // First flower near center
        targetX = 0;
        targetY = 0;
    } else {
        // Position based on rhythm - spiral/mandala pattern
        const lastFlower = flowers[flowers.length - 1];
        const angle = (characterCount * 0.618 * Math.PI * 2) + (Math.random() - 0.5) * 0.4; // Golden angle
        
        // Fast typing = closer clustering (wildflower effect), slow typing = more spread
        const distance = timeSinceLastKey > 400 ? 70 + Math.random() * 50 : 35 + Math.random() * 25;
        
        targetX = lastFlower.x + Math.cos(angle) * distance;
        targetY = lastFlower.y + Math.sin(angle) * distance;
        
        // If target is outside bounds, pull it toward center
        if (!checkBounds(targetX, targetY, boundingRadius)) {
            const dx = -lastFlower.x;
            const dy = -lastFlower.y;
            const centerDist = Math.sqrt(dx * dx + dy * dy);
            if (centerDist > 0) {
                const centerAngle = Math.atan2(dy, dx);
                targetX = lastFlower.x + Math.cos(centerAngle) * (distance * 0.5);
                targetY = lastFlower.y + Math.sin(centerAngle) * (distance * 0.5);
            }
        }
    }
    
    // Find non-colliding position near target
    const finalPosition = findNonCollidingPosition(targetX, targetY, boundingRadius, flowers);
    
    // Create flower at collision-free position
    const flower = new Flower(char, finalPosition.x, finalPosition.y, velocity, repetition);
    flowers.push(flower);
    characterCount++;
    totalKeystrokes++;
    
    // Play keystroke chime
    playKeystrokeChime(char);
    
    // Track this letter
    if (!letterIndex[lowerChar]) {
        letterIndex[lowerChar] = [];
    }
    letterIndex[lowerChar].push(flower);
    
    // Create pollen particle burst
    const flowerColor = species.colors[Math.floor(Math.random() * species.colors.length)];
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(finalPosition.x, finalPosition.y, flowerColor));
    }
    
    updateStats();
}

// Update statistics display
function updateStats() {
    document.getElementById('nodeCount').textContent = flowers.length;
    document.getElementById('speciesCount').textContent = Object.keys(flowerCounts).length;
    document.getElementById('charCount').textContent = characterCount;
}

// Animation loop
let lastFrameTime = Date.now();
function animate() {
    if (!isPaused) {
        const currentTime = Date.now();
        const dt = (currentTime - lastFrameTime) / 1000;
        time = currentTime;
        
        // Smooth camera zoom
        cameraZ += (targetCameraZ - cameraZ) * 0.05;
        
        ctx.clearRect(0, 0, width, height);
        
        drawBackground();
        drawGeometry();
        
        // Draw flowers
        flowers.forEach(flower => flower.draw());
        
        // Draw and update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(dt);
            particles[i].draw();
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }
        
        // Update and draw falling petals
        for (let i = fallingPetals.length - 1; i >= 0; i--) {
            fallingPetals[i].update(dt);
            fallingPetals[i].draw();
            if (fallingPetals[i].alpha <= 0) {
                fallingPetals.splice(i, 1);
            }
        }
        
        // Update and draw bees
        for (let i = activeBees.length - 1; i >= 0; i--) {
            activeBees[i].update(dt);
            activeBees[i].draw();
            if (activeBees[i].age >= activeBees[i].lifespan) {
                activeBees.splice(i, 1);
            }
        }
        
        // Spawn new bees
        if (flowers.length > 0 && currentTime >= nextBeeSpawnTime) {
            const beeCount = isNightMode ? (Math.random() < 0.3 ? 1 : 0) : (Math.random() < 0.5 ? 1 : Math.random() < 0.3 ? 2 : 0);
            for (let i = 0; i < beeCount; i++) {
                if (activeBees.length < 3) { // Max 3 bees at once
                    activeBees.push(new Bee());
                }
            }
            nextBeeSpawnTime = currentTime + BEE_SPAWN_INTERVAL_MIN + Math.random() * (BEE_SPAWN_INTERVAL_MAX - BEE_SPAWN_INTERVAL_MIN);
        }
        
        // Ambient pollen generation
        if (Math.random() < 0.03 && flowers.length > 0) {
            const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
            particles.push(new Particle(randomFlower.x, randomFlower.y - randomFlower.stemHeight));
        }
        
        lastFrameTime = currentTime;
    }
    
    requestAnimationFrame(animate);
}

// Event listeners
document.getElementById('textInput').addEventListener('input', (e) => {
    const textarea = e.target;
    const newText = textarea.value;
    const oldLength = characterCount;
    const newLength = newText.length;
    
    if (newLength > oldLength) {
        // New characters added
        const addedChars = newText.slice(oldLength);
        for (let char of addedChars) {
            if (char.trim() !== '') { // Ignore pure whitespace for nodes
                handleKeystroke(char);
            } else {
                // Spaces create slight pauses/gaps but still counted
                characterCount++;
    totalKeystrokes++;
                lastKeystrokeTime = Date.now() + 200; // Add artificial delay
            }
        }
    } else if (newLength < oldLength) {
        // Text deleted - could handle differently but for now just update count
        characterCount = newLength;
        updateStats();
    }
});

document.getElementById('intensitySlider').addEventListener('input', (e) => {
    intensityMultiplier = parseFloat(e.target.value);
});

document.getElementById('viewBtn').addEventListener('click', () => {
    isBirdsEye = !isBirdsEye;
    targetCameraZ = isBirdsEye ? 0.3 : 1;
    document.getElementById('viewBtn').textContent = isBirdsEye ? 'Normal View' : "Bird's Eye (V)";
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? 'Resume (P)' : 'Pause (P)';
    if (!isPaused) {
        lastFrameTime = Date.now();
        // Reset bee spawn timing
        if (nextBeeSpawnTime === 0) {
            nextBeeSpawnTime = Date.now() + BEE_SPAWN_INTERVAL_MIN;
        }
        resumeAudio();
    } else {
        pauseAudio();
    }
});

document.getElementById('volumeSlider').addEventListener('input', (e) => {
    const volume = parseInt(e.target.value) / 100;
    setMasterVolume(volume);
});

document.getElementById('muteBtn').addEventListener('click', () => {
    toggleMute();
});

document.getElementById('themeBtn').addEventListener('click', () => {
    isNightMode = !isNightMode;
    document.getElementById('themeBtn').textContent = isNightMode ? 'Day Mode' : 'Night Mode';
});

document.getElementById('legendBtn').addEventListener('click', () => {
    showLegendModal();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Clear the entire garden and start fresh?')) {
        flowers.length = 0;
        particles.length = 0;
        Object.keys(letterIndex).forEach(key => delete letterIndex[key]);
        Object.keys(flowerCounts).forEach(key => delete flowerCounts[key]);
        characterCount = 0;
        lastKeystrokeTime = 0;
        cameraX = 0;
        cameraY = 0;
        document.getElementById('textInput').value = '';
        updateStats();
    }
});

document.getElementById('infoBtn').addEventListener('click', () => {
    document.getElementById('artistModal').classList.add('active');
});

document.getElementById('saveHtmlBtn').addEventListener('click', async () => {
    await saveAsInteractiveHTML();
});

function showLegendModal() {
    let legendHTML = '<div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); z-index: 400; display: flex; align-items: center; justify-content: center;" id="legendModal" onclick="if(event.target.id===\'legendModal\')this.remove()">';
    legendHTML += '<div style="background: var(--color-surface); border: 1px solid var(--color-card-border); border-radius: 12px; max-width: 800px; max-height: 85vh; overflow-y: auto; padding: 32px; position: relative;">';
    legendHTML += '<button onclick="document.getElementById(\'legendModal\').remove()" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: var(--color-primary); font-size: 32px; cursor: pointer; width: 40px; height: 40px;">&times;</button>';
    legendHTML += '<h2 style="font-size: 24px; color: var(--color-primary); margin-bottom: 24px; text-align: center;">Botanical Alphabet</h2>';
    legendHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px;">';
    
    for (let letter in botanicalAlphabet) {
        const species = botanicalAlphabet[letter];
        const count = flowerCounts[letter] || 0;
        legendHTML += `<div style="padding: 12px; background: var(--color-bg-3); border-radius: 8px; border: 1px solid var(--color-card-border);">`;
        legendHTML += `<div style="font-size: 18px; font-weight: 600; color: var(--color-primary); margin-bottom: 4px;">${letter.toUpperCase()} = ${species.name}</div>`;
        legendHTML += `<div style="font-size: 12px; color: var(--color-text-secondary);">Count: ${count}</div>`;
        legendHTML += '</div>';
    }
    
    legendHTML += '</div></div></div>';
    
    document.body.insertAdjacentHTML('beforeend', legendHTML);
}

document.getElementById('saveBtn').addEventListener('click', () => {
    // Create a temporary canvas with the current frame
    const link = document.createElement('a');
    link.download = `botanical-garden-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in textarea
    if (e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        document.getElementById('viewBtn').click();
    }
    
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        document.getElementById('pauseBtn').click();
    }
    
    if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        document.getElementById('artistModal').classList.add('active');
    }
    
    if (e.key === 'Escape') {
        document.getElementById('artistModal').classList.remove('active');
    }
    
    if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
    }
});

// Window resize
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    updateCanvasBounds();
});

// Begin growing
function beginGrowing() {
    document.getElementById('introModal').classList.add('hidden');
    document.getElementById('textInputContainer').style.display = 'block';
    document.getElementById('statsPanel').style.display = 'block';
    document.getElementById('controlsBar').style.display = 'flex';
    
    // Initialize audio on user interaction
    initAudio();
    
    // Focus on textarea
    setTimeout(() => {
        document.getElementById('textInput').focus();
    }, 300);
}

// Close modal
function closeModal() {
    document.getElementById('artistModal').classList.remove('active');
}

// Modal click outside
document.getElementById('artistModal').addEventListener('click', (e) => {
    if (e.target.id === 'artistModal') {
        closeModal();
    }
});

window.beginGrowing = beginGrowing;
window.closeModal = closeModal;

// Save as interactive HTML with robust download and user feedback
async function saveAsInteractiveHTML() {
    const saveBtn = document.getElementById('saveHtmlBtn');
    const originalText = saveBtn.textContent;
    
    try {
        // Show saving feedback
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        const timestamp = new Date();
        const filename = `bloom_${timestamp.getFullYear()}-${String(timestamp.getMonth()+1).padStart(2,'0')}-${String(timestamp.getDate()).padStart(2,'0')}_${String(timestamp.getHours()).padStart(2,'0')}${String(timestamp.getMinutes()).padStart(2,'0')}.html`;
        
        // Prepare garden data for serialization
        const gardenData = {
            flowers: flowers.map(f => ({
                char: f.char,
                x: f.x,
                y: f.y,
                creationTime: f.creationTime,
                velocity: f.velocity,
                repetition: f.repetition,
                size: f.size,
                petalCount: f.petalCount,
                color: f.color,
                stemHeight: f.stemHeight,
                swayPhase: f.swayPhase,
                swaySpeed: f.swaySpeed,
                swayAmount: f.swayAmount,
                rotationOffset: f.rotationOffset,
                name: f.name,
                boundingRadius: f.boundingRadius,
                lastPetalShedTime: f.lastPetalShedTime,
                nextPetalShedDelay: f.nextPetalShedDelay
            })),
            flowerCounts: flowerCounts,
            letterIndex: Object.fromEntries(
                Object.entries(letterIndex).map(([key, flowerArr]) => [
                    key,
                    flowerArr.map(f => flowers.indexOf(f))
                ])
            ),
            originalText: document.getElementById('textInput').value,
            metadata: {
                creationDate: timestamp.toISOString(),
                sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
                totalKeystrokes: totalKeystrokes,
                uniqueSpecies: Object.keys(letterIndex).length,
                flowerCount: flowers.length,
                characterCount: characterCount
            }
        };
        
        // Get letter frequency stats
        const letterFreq = Object.entries(letterIndex)
            .map(([letter, instances]) => ({ 
                letter, 
                count: instances.length,
                species: botanicalAlphabet[letter].name
            }))
            .sort((a, b) => b.count - a.count);
        
        gardenData.metadata.mostFrequent = letterFreq.slice(0, 5);
        gardenData.metadata.leastFrequent = letterFreq.slice(-5).reverse();
        
        // Generate complete HTML file
        const htmlContent = generateStandaloneHTML(gardenData);
        
        // Primary method: Blob download
        try {
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            // Show success feedback
            saveBtn.textContent = 'Downloaded!';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 3000);
            
        } catch (blobError) {
            console.error('Blob download failed:', blobError);
            // Fallback: offer to copy to clipboard
            if (confirm('Download failed. Would you like to copy the HTML to your clipboard instead?')) {
                try {
                    await navigator.clipboard.writeText(htmlContent);
                    saveBtn.textContent = 'Copied to Clipboard!';
                    alert('HTML copied to clipboard! Paste it into a new .html file to save your garden.');
                } catch (clipboardError) {
                    console.error('Clipboard failed:', clipboardError);
                    // Final fallback: show in textarea
                    showHTMLInTextarea(htmlContent, filename);
                }
            } else {
                saveBtn.textContent = 'Download Failed';
            }
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 3000);
        }
        
    } catch (error) {
        console.error('Save failed:', error);
        saveBtn.textContent = 'Error Saving';
        alert('Failed to save garden. Please try again. Error: ' + error.message);
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }, 3000);
    }
}

// Fallback: Show HTML in textarea for manual copy
function showHTMLInTextarea(htmlContent, filename) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    const container = document.createElement('div');
    container.style.cssText = 'background: var(--color-surface); border-radius: 12px; padding: 24px; max-width: 800px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; gap: 16px;';
    
    const title = document.createElement('h3');
    title.textContent = 'Manual Save Required';
    title.style.cssText = 'color: var(--color-primary); margin: 0;';
    
    const instructions = document.createElement('p');
    instructions.textContent = `Copy the HTML below and save it as "${filename}" on your computer:`;
    instructions.style.cssText = 'color: var(--color-text); margin: 0; font-size: 14px;';
    
    const textarea = document.createElement('textarea');
    textarea.value = htmlContent;
    textarea.style.cssText = 'flex: 1; font-family: monospace; font-size: 11px; padding: 12px; border: 1px solid var(--color-border); border-radius: 8px; resize: none;';
    textarea.readOnly = true;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy to Clipboard';
    copyBtn.className = 'btn';
    copyBtn.onclick = () => {
        textarea.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy to Clipboard', 2000);
    };
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.className = 'btn';
    closeBtn.onclick = () => modal.remove();
    
    buttonContainer.appendChild(copyBtn);
    buttonContainer.appendChild(closeBtn);
    
    container.appendChild(title);
    container.appendChild(instructions);
    container.appendChild(textarea);
    container.appendChild(buttonContainer);
    modal.appendChild(container);
    document.body.appendChild(modal);
    
    textarea.select();
}

function generateStandaloneHTML(gardenData) {
    // Create botanical alphabet JSON string for embedding
    const botanicalAlphabetStr = JSON.stringify(botanicalAlphabet);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Botanical Garden Archive - ${gardenData.metadata.creationDate}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f3e8;
            color: #134252;
            overflow: hidden;
        }
        #canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(to bottom, #f5f3e8 0%, #e8e6d8 100%);
        }
        .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 253, 0.95);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(94, 82, 64, 0.2);
            backdrop-filter: blur(10px);
            z-index: 10;
            max-width: 250px;
        }
        .controls h3 {
            font-size: 14px;
            color: #218D8D;
            margin-bottom: 12px;
            font-weight: 600;
        }
        .control-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 12px;
        }
        .control-label {
            color: #626C71;
        }
        .btn {
            width: 100%;
            padding: 8px 12px;
            margin: 4px 0;
            font-size: 12px;
            background: rgba(33, 128, 141, 0.12);
            color: #218D8D;
            border: 1px solid rgba(94, 82, 64, 0.2);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn:hover {
            background: rgba(33, 128, 141, 0.2);
            border-color: #218D8D;
        }
        .slider {
            width: 100px;
            height: 4px;
            border-radius: 9999px;
            background: rgba(94, 82, 64, 0.12);
            outline: none;
            -webkit-appearance: none;
        }
        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #218D8D;
            cursor: pointer;
        }
        .metadata {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(255, 255, 253, 0.95);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(94, 82, 64, 0.2);
            backdrop-filter: blur(10px);
            z-index: 10;
            max-width: 300px;
        }
        .metadata h3 {
            font-size: 14px;
            color: #218D8D;
            margin-bottom: 12px;
            font-weight: 600;
        }
        .stat-line {
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
            font-size: 11px;
        }
        .stat-label { color: rgba(150, 180, 190, 0.7); }
        .stat-value { color: rgba(80, 220, 240, 0.9); font-weight: 500; }
        .text-display {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 700px;
            max-height: 200px;
            overflow-y: auto;
            background: rgba(15, 25, 25, 0.95);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(94, 82, 64, 0.2);
            backdrop-filter: blur(10px);
            z-index: 10;
            font-size: 13px;
            line-height: 1.6;
            color: rgba(180, 200, 200, 0.85);
            display: none;
        }
        .text-display.visible { display: block; }
        .footer {
            position: fixed;
            bottom: 16px;
            right: 24px;
            font-size: 11px;
            color: rgba(33, 128, 141, 0.4);
            z-index: 5;
            letter-spacing: 0.02em;
        }
        .footer a {
            color: rgba(33, 128, 141, 0.5);
            text-decoration: none;
        }
        .footer a:hover { color: rgba(50, 200, 220, 0.7); }
        .timeline {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: none;
            align-items: center;
            gap: 12px;
            background: rgba(255, 255, 253, 0.95);
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid rgba(94, 82, 64, 0.2);
            backdrop-filter: blur(10px);
            z-index: 10;
        }
        .timeline.visible { display: flex; }
        .timeline-slider {
            flex: 1;
            height: 4px;
        }
        .timeline-label {
            font-size: 11px;
            color: #626C71;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    
    <div class="metadata" id="metadata">
        <h3>Garden Archive</h3>
        <div class="stat-line"><span class="stat-label">Created:</span><span class="stat-value">${new Date(gardenData.metadata.creationDate).toLocaleString()}</span></div>
        <div class="stat-line"><span class="stat-label">Duration:</span><span class="stat-value">${Math.floor(gardenData.metadata.sessionDuration / 60)}m ${gardenData.metadata.sessionDuration % 60}s</span></div>
        <div class="stat-line"><span class="stat-label">Keystrokes:</span><span class="stat-value">${gardenData.metadata.totalKeystrokes}</span></div>
        <div class="stat-line"><span class="stat-label">Flowers:</span><span class="stat-value">${gardenData.metadata.flowerCount}</span></div>
        <div class="stat-line"><span class="stat-label">Species:</span><span class="stat-value">${gardenData.metadata.uniqueSpecies}</span></div>
        <div class="stat-line"><span class="stat-label">Characters:</span><span class="stat-value">${gardenData.metadata.characterCount}</span></div>
    </div>
    
    <div class="controls">
        <h3>View Controls</h3>
        <div class="control-row">
            <span class="control-label">Intensity</span>
            <input type="range" id="intensity" class="slider" min="0.3" max="2" step="0.1" value="1">
        </div>
        <button class="btn" id="viewBtn">Bird's Eye View (V)</button>
        <button class="btn" id="pauseBtn">Pause (P)</button>
        <button class="btn" id="textBtn">Show Text (T)</button>
        <button class="btn" id="metadataBtn">Hide Metadata (M)</button>
        <button class="btn" id="timelineBtn">Show Timeline (L)</button>
    </div>
    
    <div class="text-display" id="textDisplay">
        <strong style="color: rgba(50, 200, 220, 0.9); display: block; margin-bottom: 8px;">Original Text:</strong>
        ${gardenData.originalText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </div>
    
    <div class="timeline" id="timeline">
        <span class="timeline-label">Timeline:</span>
        <input type="range" id="timelineSlider" class="slider timeline-slider" min="0" max="100" value="100">
        <span class="timeline-label" id="timelineValue">100%</span>
    </div>
    
    <div class="footer">
        digital monument by <a href="https://unearth.im" target="_blank">unearth.im</a>
    </div>

    <script>
        const networkData = ${JSON.stringify(gardenData).replace(/</g, '\u003c').replace(/>/g, '\u003e')};
        
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        
        let isPaused = false;
        let isBirdsEye = false;
        let intensityMultiplier = 1;
        let time = Date.now();
        let cameraZ = 1;
        let targetCameraZ = 1;
        let timelineProgress = 1;
        
        class Node_UNUSED {
            constructor(data) {
                Object.assign(this, data);
                this.baseCreationTime = data.creationTime;
            }
            
            get age() {
                return (time - this.creationTime) / 1000;
            }
            
            draw() {
                const screenX = width / 2 + (this.x - cameraX) * cameraZ;
                const screenY = height / 2 + (this.y - cameraY) * cameraZ;
                const scaledSize = this.size * cameraZ;
                
                // Gentle sway
                const sway = Math.sin(time * this.swaySpeed + this.swayPhase) * this.swayAmount;
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(sway);
                
                // Draw stem
                const stemHeight = this.stemHeight * cameraZ;
                ctx.strokeStyle = isNightMode ? 'rgba(80, 120, 100, 0.6)' : 'rgba(100, 140, 80, 0.7)';
                ctx.lineWidth = Math.max(1, 2 * cameraZ);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -stemHeight);
                ctx.stroke();
                
                // Draw flower head
                ctx.translate(0, -stemHeight);
                this.drawFlowerHead(scaledSize);
                
                ctx.restore();
            }
            
            drawFlowerHead(size) {
                // Watercolor-style petals
                for (let i = 0; i < this.petalCount; i++) {
                    const angle = (i / this.petalCount) * Math.PI * 2 + this.rotationOffset;
                    const petalLength = size * 0.6;
                    const petalWidth = size * 0.3;
                    
                    ctx.save();
                    ctx.rotate(angle);
                    
                    // Petal with gradient (watercolor effect)
                    const gradient = ctx.createRadialGradient(0, -petalLength * 0.3, 0, 0, -petalLength * 0.3, petalLength);
                    
                    if (isNightMode) {
                        gradient.addColorStop(0, this.color + 'CC');
                        gradient.addColorStop(0.6, this.color + '88');
                        gradient.addColorStop(1, this.color + '33');
                    } else {
                        gradient.addColorStop(0, this.color + 'FF');
                        gradient.addColorStop(0.6, this.color + 'AA');
                        gradient.addColorStop(1, this.color + '44');
                    }
                    
                    ctx.fillStyle = gradient;
                    
                    // Petal shape
                    ctx.beginPath();
                    ctx.ellipse(0, -petalLength * 0.5, petalWidth, petalLength, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Subtle outline
                    ctx.strokeStyle = isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    
                    ctx.restore();
                }
                
                // Center of flower
                const centerSize = size * 0.25;
                const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
                
                if (isNightMode) {
                    centerGradient.addColorStop(0, '#FFD93DDD');
                    centerGradient.addColorStop(1, '#FF8C6666');
                } else {
                    centerGradient.addColorStop(0, '#FFD93D');
                    centerGradient.addColorStop(1, '#FF8C66');
                }
                
                ctx.fillStyle = centerGradient;
                ctx.beginPath();
                ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        class Connection_UNUSED {
            constructor(data, fromNode, toNode) {
                Object.assign(this, data);
                this.fromNode = fromNode;
                this.toNode = toNode;
                this.baseCreationTime = data.creationTime;
            }
            
            get age() {
                return (time - this.creationTime) / 1000;
            }
            
            draw() {
                const from = this.fromNode;
                const to = this.toNode;
                const fromX = width / 2 + from.x * cameraZ;
                const fromY = height / 2 + from.y * cameraZ;
                const toX = width / 2 + to.x * cameraZ;
                const toY = height / 2 + to.y * cameraZ;
                
                const avgGlow = (from.glowIntensity + to.glowIntensity) / 2;
                const intensity = avgGlow * this.brightness * intensityMultiplier;
                const shimmer = Math.sin(time * 0.003 + this.age) * 0.2 + 0.8;
                const avgColorIndex = Math.floor((from.colorIndex + to.colorIndex) / 2);
                const color = biolumColors[avgColorIndex];
                
                ctx.strokeStyle = \`hsla(\${color.h}, \${color.s}%, \${color.l}%, \${0.4 * intensity * shimmer})\`;
                ctx.lineWidth = Math.max(1, 2 * cameraZ);
                ctx.lineCap = 'round';
                
                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;
                
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.quadraticCurveTo(midX, midY, toX, toY);
                ctx.stroke();
                
                ctx.strokeStyle = \`hsla(\${color.h}, \${color.s}%, \${Math.min(color.l + 15, 85)}%, \${0.2 * intensity * shimmer})\`;
                ctx.lineWidth = Math.max(0.5, 1 * cameraZ);
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.quadraticCurveTo(midX, midY, toX, toY);
                ctx.stroke();
            }
        }
        
        const botanicalAlphabet = ${botanicalAlphabetStr};
        
        // Falling petals and bees for saved garden
        const fallingPetals = [];
        const activeBees = [];
        let lastBeeSpawnTime = 0;
        const BEE_SPAWN_INTERVAL_MIN = 10000;
        const BEE_SPAWN_INTERVAL_MAX = 30000;
        let nextBeeSpawnTime = 0;
        let isNightMode = false;
        let cameraX = 0;
        let cameraY = 0;
        
        const MARGIN_PERCENTAGE = 0.18;
        let canvasBounds = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };
        
        function updateCanvasBounds() {
            const marginX = width * MARGIN_PERCENTAGE;
            const marginY = height * MARGIN_PERCENTAGE;
            canvasBounds.minX = -width / 2 + marginX;
            canvasBounds.maxX = width / 2 - marginX;
            canvasBounds.minY = -height / 2 + marginY;
            canvasBounds.maxY = height / 2 - marginY;
        }
        
        updateCanvasBounds();
        
        class FallingPetal {
            constructor(x, y, color, size) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.size = size;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = 0.5 + Math.random() * 0.5;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.08;
                this.alpha = 0.9;
                this.age = 0;
                this.lifespan = 3 + Math.random() * 2;
                this.swayPhase = Math.random() * Math.PI * 2;
            }
            
            update(dt) {
                const sway = Math.sin(this.age * 2 + this.swayPhase) * 0.5;
                this.x += this.vx + sway;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;
                this.age += dt;
                this.alpha = Math.max(0, 0.9 * (1 - this.age / this.lifespan));
            }
            
            draw() {
                if (this.alpha <= 0) return;
                const screenX = width / 2 + (this.x - cameraX) * cameraZ;
                const screenY = height / 2 + (this.y - cameraY) * cameraZ;
                const scaledSize = this.size * cameraZ;
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.alpha;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, scaledSize);
                gradient.addColorStop(0, this.color + 'FF');
                gradient.addColorStop(0.6, this.color + 'AA');
                gradient.addColorStop(1, this.color + '33');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(0, 0, scaledSize * 0.4, scaledSize * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        class Bee {
            constructor() {
                const edge = Math.floor(Math.random() * 4);
                if (edge === 0) {
                    this.x = canvasBounds.minX + Math.random() * (canvasBounds.maxX - canvasBounds.minX);
                    this.y = canvasBounds.minY;
                } else if (edge === 1) {
                    this.x = canvasBounds.maxX;
                    this.y = canvasBounds.minY + Math.random() * (canvasBounds.maxY - canvasBounds.minY);
                } else if (edge === 2) {
                    this.x = canvasBounds.minX + Math.random() * (canvasBounds.maxX - canvasBounds.minX);
                    this.y = canvasBounds.maxY;
                } else {
                    this.x = canvasBounds.minX;
                    this.y = canvasBounds.minY + Math.random() * (canvasBounds.maxY - canvasBounds.minY);
                }
                this.age = 0;
                this.lifespan = 3 + Math.random() * 5;
                this.size = 8 + Math.random() * 4;
                this.wingPhase = Math.random() * Math.PI * 2;
                this.speed = 40 + Math.random() * 30;
                this.targetFlowers = [];
                if (flowers.length > 0) {
                    const flowerCount = Math.min(flowers.length, 2 + Math.floor(Math.random() * 4));
                    const shuffled = [...flowers].sort(() => Math.random() - 0.5);
                    const sorted = shuffled.sort((a, b) => b.repetition - a.repetition);
                    this.targetFlowers = sorted.slice(0, flowerCount);
                }
                this.currentTargetIndex = 0;
                this.hoverTime = 0;
                this.hoverDuration = 0.5 + Math.random() * 1.5;
                this.isHovering = false;
                this.exitAngle = Math.random() * Math.PI * 2;
            }
            
            update(dt) {
                this.age += dt;
                this.wingPhase += dt * 15;
                if (this.age >= this.lifespan) return;
                if (this.targetFlowers.length === 0 || this.currentTargetIndex >= this.targetFlowers.length) {
                    const exitSpeed = this.speed * dt;
                    this.x += Math.cos(this.exitAngle) * exitSpeed;
                    this.y += Math.sin(this.exitAngle) * exitSpeed;
                    return;
                }
                const targetFlower = this.targetFlowers[this.currentTargetIndex];
                const dx = targetFlower.x - this.x;
                const dy = targetFlower.y - targetFlower.stemHeight - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 15 && !this.isHovering) {
                    this.isHovering = true;
                    this.hoverTime = 0;
                }
                if (this.isHovering) {
                    this.hoverTime += dt;
                    const hoverRadius = 5;
                    this.x = targetFlower.x + Math.cos(this.age * 3) * hoverRadius;
                    this.y = targetFlower.y - targetFlower.stemHeight + Math.sin(this.age * 3) * hoverRadius;
                    if (this.hoverTime >= this.hoverDuration) {
                        this.isHovering = false;
                        this.hoverTime = 0;
                        this.currentTargetIndex++;
                        this.hoverDuration = 0.5 + Math.random() * 1.5;
                    }
                } else {
                    const moveSpeed = this.speed * dt;
                    const angle = Math.atan2(dy, dx);
                    const curvature = Math.sin(this.age * 2) * 0.3;
                    this.x += Math.cos(angle + curvature) * moveSpeed;
                    this.y += Math.sin(angle + curvature) * moveSpeed;
                }
            }
            
            draw() {
                const screenX = width / 2 + (this.x - cameraX) * cameraZ;
                const screenY = height / 2 + (this.y - cameraY) * cameraZ;
                const scaledSize = this.size * cameraZ;
                ctx.save();
                ctx.translate(screenX, screenY);
                const bodyGradient = ctx.createLinearGradient(-scaledSize * 0.3, 0, scaledSize * 0.3, 0);
                bodyGradient.addColorStop(0, '#FFD93D');
                bodyGradient.addColorStop(0.5, '#8B4513');
                bodyGradient.addColorStop(1, '#FFD93D');
                ctx.fillStyle = bodyGradient;
                ctx.beginPath();
                ctx.ellipse(0, 0, scaledSize * 0.4, scaledSize * 0.25, 0, 0, Math.PI * 2);
                ctx.fill();
                const wingFlutter = Math.sin(this.wingPhase) * 0.3;
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = isNightMode ? 'rgba(200, 220, 240, 0.4)' : 'rgba(255, 255, 255, 0.7)';
                ctx.save();
                ctx.rotate(wingFlutter - 0.3);
                ctx.beginPath();
                ctx.ellipse(-scaledSize * 0.2, 0, scaledSize * 0.35, scaledSize * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.save();
                ctx.rotate(-wingFlutter + 0.3);
                ctx.beginPath();
                ctx.ellipse(scaledSize * 0.2, 0, scaledSize * 0.35, scaledSize * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.globalAlpha = 1;
                ctx.restore();
            }
        }
        
        class Flower {
            constructor(data) {
                Object.assign(this, data);
                this.baseCreationTime = data.creationTime;
                this.bloomProgress = 1;
                if (!this.lastPetalShedTime) this.lastPetalShedTime = time;
                if (!this.nextPetalShedDelay) this.nextPetalShedDelay = 5000 + Math.random() * 25000;
            }
            
            draw() {
                const screenX = width / 2 + (this.x - cameraX) * cameraZ;
                const screenY = height / 2 + (this.y - cameraY) * cameraZ;
                const scaledSize = this.size * cameraZ * this.bloomProgress;
                
                const sway = Math.sin(time * this.swaySpeed + this.swayPhase) * this.swayAmount;
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(sway);
                
                const stemHeight = this.stemHeight * cameraZ;
                ctx.strokeStyle = isNightMode ? 'rgba(80, 120, 100, 0.6)' : 'rgba(100, 140, 80, 0.7)';
                ctx.lineWidth = Math.max(1, 2 * cameraZ);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -stemHeight);
                ctx.stroke();
                
                ctx.translate(0, -stemHeight);
                this.drawFlowerHead(scaledSize);
                
                ctx.restore();
            }
            
            shedPetals() {
                const petalCount = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < petalCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = this.size * 0.3;
                    const petalX = this.x + Math.cos(angle) * distance;
                    const petalY = this.y - this.stemHeight + Math.sin(angle) * distance;
                    const petalSize = this.size * 0.15;
                    fallingPetals.push(new FallingPetal(petalX, petalY, this.color, petalSize));
                }
            }
            
            update() {
                if (time - this.lastPetalShedTime >= this.nextPetalShedDelay) {
                    this.shedPetals();
                    this.lastPetalShedTime = time;
                    const frequencyMultiplier = 1 - (this.repetition * 0.05);
                    this.nextPetalShedDelay = (5000 + Math.random() * 25000) * Math.max(0.5, frequencyMultiplier);
                }
            }
            
            drawFlowerHead(size) {
                for (let i = 0; i < this.petalCount; i++) {
                    const angle = (i / this.petalCount) * Math.PI * 2 + this.rotationOffset;
                    const petalLength = size * 0.6;
                    const petalWidth = size * 0.3;
                    
                    ctx.save();
                    ctx.rotate(angle);
                    
                    const gradient = ctx.createRadialGradient(0, -petalLength * 0.3, 0, 0, -petalLength * 0.3, petalLength);
                    
                    if (isNightMode) {
                        gradient.addColorStop(0, this.color + 'CC');
                        gradient.addColorStop(0.6, this.color + '88');
                        gradient.addColorStop(1, this.color + '33');
                    } else {
                        gradient.addColorStop(0, this.color + 'FF');
                        gradient.addColorStop(0.6, this.color + 'AA');
                        gradient.addColorStop(1, this.color + '44');
                    }
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.ellipse(0, -petalLength * 0.5, petalWidth, petalLength, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    
                    ctx.restore();
                }
                
                const centerSize = size * 0.25;
                const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
                
                if (isNightMode) {
                    centerGradient.addColorStop(0, '#FFD93DDD');
                    centerGradient.addColorStop(1, '#FF8C6666');
                } else {
                    centerGradient.addColorStop(0, '#FFD93D');
                    centerGradient.addColorStop(1, '#FF8C66');
                }
                
                ctx.fillStyle = centerGradient;
                ctx.beginPath();
                ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        const flowers = networkData.flowers.map(f => new Flower(f));
        
        function drawBackground() {
            if (isNightMode) {
                const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
                bgGradient.addColorStop(0, '#1a2830');
                bgGradient.addColorStop(0.7, '#0f1419');
                bgGradient.addColorStop(1, '#080a0d');
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, width, height);
            } else {
                const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
                bgGradient.addColorStop(0, '#f5f3e8');
                bgGradient.addColorStop(0.5, '#e8e6d8');
                bgGradient.addColorStop(1, '#dcd9c8');
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, width, height);
            }
        }
        
        function drawGeometry() {
            ctx.save();
            ctx.translate(width / 2, height / 2);
            
            const geometryAlpha = 0.05 * intensityMultiplier * 0.5;
            if (isNightMode) {
                ctx.strokeStyle = \`rgba(150, 200, 220, \${geometryAlpha})\`;
            } else {
                ctx.strokeStyle = \`rgba(94, 82, 64, \${geometryAlpha})\`;
            }
            ctx.lineWidth = 0.5;
            
            for (let i = 0; i < 8; i++) {
                const radius = (100 + i * 80) * cameraZ;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                if (i % 2 === 0) {
                    const sides = 6;
                    for (let j = 0; j < sides; j++) {
                        const angle = (j / sides) * Math.PI * 2;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();
        }
        
        function updateTimeline() {
            // Timeline feature removed for botanical garden
        }
        
        function animate() {
            if (!isPaused) {
                time = Date.now();
                cameraZ += (targetCameraZ - cameraZ) * 0.05;
                
                ctx.clearRect(0, 0, width, height);
                drawBackground();
                drawGeometry();
                
                const dt = 0.016;
                flowers.forEach(f => {
                    f.update();
                    f.draw();
                });
                
                for (let i = fallingPetals.length - 1; i >= 0; i--) {
                    fallingPetals[i].update(dt);
                    fallingPetals[i].draw();
                    if (fallingPetals[i].alpha <= 0) fallingPetals.splice(i, 1);
                }
                
                for (let i = activeBees.length - 1; i >= 0; i--) {
                    activeBees[i].update(dt);
                    activeBees[i].draw();
                    if (activeBees[i].age >= activeBees[i].lifespan) activeBees.splice(i, 1);
                }
                
                if (flowers.length > 0 && time >= nextBeeSpawnTime) {
                    const beeCount = isNightMode ? (Math.random() < 0.3 ? 1 : 0) : (Math.random() < 0.5 ? 1 : Math.random() < 0.3 ? 2 : 0);
                    for (let i = 0; i < beeCount; i++) {
                        if (activeBees.length < 3) activeBees.push(new Bee());
                    }
                    nextBeeSpawnTime = time + BEE_SPAWN_INTERVAL_MIN + Math.random() * (BEE_SPAWN_INTERVAL_MAX - BEE_SPAWN_INTERVAL_MIN);
                }
            }
            requestAnimationFrame(animate);
        }
        
        document.getElementById('intensity').addEventListener('input', e => {
            intensityMultiplier = parseFloat(e.target.value);
        });
        
        document.getElementById('viewBtn').addEventListener('click', () => {
            isBirdsEye = !isBirdsEye;
            
            if (isBirdsEye && flowers.length > 0) {
                let maxDist = 0;
                flowers.forEach(f => {
                    const dist = Math.sqrt(f.x * f.x + f.y * f.y) + f.boundingRadius;
                    maxDist = Math.max(maxDist, dist);
                });
                
                const requiredZoom = Math.min(width, height) / (maxDist * 2.4);
                targetCameraZ = isBirdsEye ? Math.min(0.4, Math.max(0.15, requiredZoom)) : 1;
            } else {
                targetCameraZ = 1;
            }
            
            document.getElementById('viewBtn').textContent = isBirdsEye ? 'Normal View' : "Bird's Eye View (V)";
        });
        
        const themeBtn = document.createElement('button');
        themeBtn.className = 'btn';
        themeBtn.textContent = 'Night Mode';
        themeBtn.addEventListener('click', () => {
            isNightMode = !isNightMode;
            themeBtn.textContent = isNightMode ? 'Day Mode' : 'Night Mode';
        });
        document.querySelector('.controls').insertBefore(themeBtn, document.getElementById('viewBtn'));
        
        // Add audio indicator
        const audioIndicator = document.createElement('div');
        audioIndicator.style.cssText = 'position: fixed; bottom: 20px; right: 20px; display: flex; gap: 4px; padding: 12px 16px; background: rgba(255, 255, 253, 0.95); border-radius: 12px; border: 1px solid rgba(94, 82, 64, 0.2); z-index: 10; opacity: 0.7;';
        audioIndicator.innerHTML = '<div style="width: 3px; height: 12px; background: linear-gradient(to top, rgba(100, 160, 140, 0.6), rgba(140, 180, 160, 1)); border-radius: 2px; animation: wave1 0.8s ease-in-out infinite;"></div><div style="width: 3px; height: 12px; background: linear-gradient(to top, rgba(100, 160, 140, 0.6), rgba(140, 180, 160, 1)); border-radius: 2px; animation: wave2 0.8s ease-in-out infinite;"></div><div style="width: 3px; height: 12px; background: linear-gradient(to top, rgba(100, 160, 140, 0.6), rgba(140, 180, 160, 1)); border-radius: 2px; animation: wave3 0.8s ease-in-out infinite;"></div>';
        const style = document.createElement('style');
        style.textContent = '@keyframes wave1 { 0%, 100% { height: 12px; } 50% { height: 20px; } } @keyframes wave2 { 0%, 100% { height: 12px; } 50% { height: 20px; } } @keyframes wave3 { 0%, 100% { height: 12px; } 50% { height: 20px; } } @keyframes wave2 { animation-delay: 0.2s; } @keyframes wave3 { animation-delay: 0.4s; }';
        document.head.appendChild(style);
        document.body.appendChild(audioIndicator);
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            isPaused = !isPaused;
            document.getElementById('pauseBtn').textContent = isPaused ? 'Resume (P)' : 'Pause (P)';
        });
        
        document.getElementById('textBtn').textContent = 'Show Text (T)';
        document.getElementById('textBtn').addEventListener('click', () => {
            const display = document.getElementById('textDisplay');
            display.classList.toggle('visible');
            document.getElementById('textBtn').textContent = display.classList.contains('visible') ? 'Hide Text (T)' : 'Show Text (T)';
        });
        
        document.getElementById('metadataBtn').addEventListener('click', () => {
            const metadata = document.getElementById('metadata');
            metadata.style.display = metadata.style.display === 'none' ? 'block' : 'none';
            document.getElementById('metadataBtn').textContent = metadata.style.display === 'none' ? 'Show Metadata (M)' : 'Hide Metadata (M)';
        });
        
        document.getElementById('timelineBtn').addEventListener('click', () => {
            const timeline = document.getElementById('timeline');
            timeline.classList.toggle('visible');
            document.getElementById('timelineBtn').textContent = timeline.classList.contains('visible') ? 'Hide Timeline (L)' : 'Show Timeline (L)';
        });
        
        document.getElementById('timelineSlider').addEventListener('input', e => {
            timelineProgress = parseFloat(e.target.value) / 100;
            document.getElementById('timelineValue').textContent = Math.round(timelineProgress * 100) + '%';
            updateTimeline();
        });
        
        window.addEventListener('keydown', e => {
            if (e.key === 'v' || e.key === 'V') {
                e.preventDefault();
                document.getElementById('viewBtn').click();
            }
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                document.getElementById('pauseBtn').click();
            }
            if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                document.getElementById('textBtn').click();
            }
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                isNightMode = !isNightMode;
            }
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                document.getElementById('metadataBtn').click();
            }
            if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                document.getElementById('timelineBtn').click();
            }
        });
        
        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            updateCanvasBounds();
        });
        
        nextBeeSpawnTime = time + BEE_SPAWN_INTERVAL_MIN;
        
        // Initialize audio system for saved garden
        let savedAudioContext = null;
        let savedMasterGain = null;
        let savedMusicGain = null;
        let savedMusicOscillators = [];
        let savedIsMuted = false;
        let savedMasterVolume = 0.2;
        
        function initSavedAudio() {
            if (savedAudioContext) return;
            try {
                savedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                savedMasterGain = savedAudioContext.createGain();
                savedMasterGain.connect(savedAudioContext.destination);
                savedMasterGain.gain.setValueAtTime(savedMasterVolume, savedAudioContext.currentTime);
                savedMusicGain = savedAudioContext.createGain();
                savedMusicGain.connect(savedMasterGain);
                savedMusicGain.gain.setValueAtTime(0.15, savedAudioContext.currentTime);
                startSavedMusic();
            } catch (e) {
                console.warn('Audio init failed:', e);
            }
        }
        
        function startSavedMusic() {
            if (!savedAudioContext || !savedMusicGain) return;
            const layers = [
                { freq: 110, vol: 0.03, delay: 0 },
                { freq: 165, vol: 0.025, delay: 0.5 },
                { freq: 330, vol: 0.015, delay: 1.2 }
            ];
            layers.forEach(l => createSavedPad(l.freq, l.vol, l.delay));
            scheduleSavedBells();
        }
        
        function createSavedPad(freq, vol, delay) {
            setTimeout(() => {
                if (!savedAudioContext || isPaused) return;
                const osc = savedAudioContext.createOscillator();
                const gain = savedAudioContext.createGain();
                const filter = savedAudioContext.createBiquadFilter();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, savedAudioContext.currentTime);
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800 + Math.random() * 400, savedAudioContext.currentTime);
                gain.gain.setValueAtTime(0, savedAudioContext.currentTime);
                gain.gain.linearRampToValueAtTime(vol, savedAudioContext.currentTime + 4);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(savedMusicGain);
                osc.start(savedAudioContext.currentTime);
                savedMusicOscillators.push({ osc, gain });
            }, delay * 1000);
        }
        
        function scheduleSavedBells() {
            if (!savedAudioContext || isPaused) return;
            const freqs = [440, 554.37, 659.25, 880];
            setTimeout(() => {
                if (savedAudioContext && !isPaused && !savedIsMuted) {
                    playSavedBell(freqs[Math.floor(Math.random() * freqs.length)]);
                }
                scheduleSavedBells();
            }, 8000 + Math.random() * 12000);
        }
        
        function playSavedBell(freq) {
            if (!savedAudioContext || !savedMusicGain) return;
            const osc = savedAudioContext.createOscillator();
            const gain = savedAudioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, savedAudioContext.currentTime);
            gain.gain.setValueAtTime(0, savedAudioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.008, savedAudioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, savedAudioContext.currentTime + 4);
            osc.connect(gain);
            gain.connect(savedMusicGain);
            osc.start(savedAudioContext.currentTime);
            osc.stop(savedAudioContext.currentTime + 4);
        }
        
        // Volume control for saved garden
        const volumeControl = document.createElement('div');
        volumeControl.style.cssText = 'margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(94, 82, 64, 0.2);';
        volumeControl.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between; margin: 8px 0;"><span style="color: #626C71; font-size: 12px;">Volume</span><input type="range" id="savedVolume" class="slider" min="0" max="100" value="20" style="width: 100px;"></div>';
        document.querySelector('.controls').appendChild(volumeControl);
        
        const muteBtn = document.createElement('button');
        muteBtn.className = 'btn';
        muteBtn.textContent = 'Mute Audio';
        muteBtn.onclick = () => {
            savedIsMuted = !savedIsMuted;
            const vol = savedIsMuted ? 0 : savedMasterVolume;
            if (savedMasterGain) savedMasterGain.gain.linearRampToValueAtTime(vol, savedAudioContext.currentTime + 0.1);
            muteBtn.textContent = savedIsMuted ? 'Unmute Audio' : 'Mute Audio';
        };
        document.querySelector('.controls').appendChild(muteBtn);
        
        document.getElementById('savedVolume').addEventListener('input', (e) => {
            savedMasterVolume = parseInt(e.target.value) / 100;
            if (savedMasterGain && savedAudioContext) {
                savedMasterGain.gain.linearRampToValueAtTime(savedMasterVolume, savedAudioContext.currentTime + 0.1);
            }
        });
        
        const originalPauseBtn = document.getElementById('pauseBtn');
        const origPauseFn = originalPauseBtn.onclick;
        originalPauseBtn.onclick = () => {
            origPauseFn();
            if (savedAudioContext) {
                if (isPaused) {
                    savedAudioContext.suspend();
                } else {
                    savedAudioContext.resume();
                }
            }
        };
        
        // Auto-start audio on first user interaction
        const startAudio = () => {
            initSavedAudio();
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
        
        animate();
    </script>
</body>
</html>`;
}

// Initialize and start
initGeometry();
animate();
updateStats();