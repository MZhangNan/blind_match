class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.bgmOscs = [];
        this.currentBGM = 'none'; // 'main', 'blind', 'none'

        // Custom Audio Elements
        this.bgmMain = new Audio('sound/relax_music.mp3');
        this.bgmMain.loop = true;
        this.bgmMain.volume = 0.5;

        this.bgmBlind = new Audio('sound/intense_music.mp3');
        this.bgmBlind.loop = true;
        this.bgmBlind.volume = 0.6;
    }

    checkResume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        // Also try to play/resume audio elements if needed
    }

    // --- SFX ---
    playTone(freq, duration, type = 'sine', ramp = true) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        if (ramp) {
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSelect() { this.playTone(440, 0.1, 'triangle'); }
    playMatch() {
        this.playTone(523.25, 0.1, 'sine');
        setTimeout(() => this.playTone(659.25, 0.2, 'sine'), 100);
    }
    playInvalid() {
        this.playTone(150, 0.2, 'sawtooth', false);
        setTimeout(() => this.playTone(100, 0.2, 'sawtooth', false), 100);
    }
    playShuffle() {
        for (let i = 0; i < 5; i++) setTimeout(() => this.playTone(800 + Math.random() * 400, 0.05, 'square'), i * 50);
    }
    playVictory() {
        [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 0.4, 'square'), i * 150));
    }

    // --- BGM ---
    startBGM(type) {
        if (!this.enabled) return;
        if (this.currentBGM === type) return;

        this.stopBGM();
        this.currentBGM = type;

        if (type === 'main') {
            this.bgmMain.play().catch(e => console.log("Audio play failed", e));
        } else if (type === 'blind') {
            this.bgmBlind.play().catch(e => console.log("Audio play failed", e));
        }
    }

    stopBGM() {
        this.bgmMain.pause();
        this.bgmMain.currentTime = 0;
        this.bgmBlind.pause();
        this.bgmBlind.currentTime = 0;
        this.currentBGM = 'none';
    }
}

class Tile {
    constructor(id, type, x, y, z) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.el = null;
        this.isBlocked = false;
        this.isSpecial = false;
        this.removed = false;
        this.displayChar = type;
    }

    createDOM() {
        const el = document.createElement('div');
        el.className = 'tile';
        el.textContent = this.displayChar;

        const domX = (this.x * 50) + (window.innerWidth / 2) - 150;
        const domY = (this.y * 65) - (this.z * 5) + 100;

        el.style.left = `${domX}px`;
        el.style.top = `${domY}px`;
        el.style.zIndex = this.z * 10 + this.x + this.y;
        el.dataset.id = this.id;

        if (this.isSpecial) el.classList.add('special');

        this.el = el;
        return el;
    }

    updateDOM() {
        if (!this.el) return;
        this.el.textContent = this.displayChar;
        if (this.isSpecial) this.el.classList.add('special');
        else this.el.classList.remove('special');

        if (this.isBlocked) this.el.classList.add('blocked');
        else this.el.classList.remove('blocked');
    }
}

class Board {
    constructor() {
        this.tiles = [];
        this.types = [
            '🀀', '🀁', '🀂', '🀃', '🀄', '🀅', '🀆',
            '🀇', '🀈', '🀉', '🀊', '🀋', '🀙', '🀚', '🀛', '🀜', '🀝',
            '🀐', '🀑', '🀒', '🀓', '🀔'
        ];
    }

    generateLayout() {
        this.tiles = [];
        let idCount = 0;
        let positions = [];

        // Layers
        const layers = [
            { w: 6, h: 6, z: 0 },
            { w: 4, h: 4, z: 1 },
            { w: 2, h: 2, z: 2 },
            { w: 2, h: 1, z: 3 }
        ];

        // Layer 0
        for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) positions.push({ x, y, z: 0 });
        // Layer 1
        for (let x = 1; x < 5; x++) for (let y = 1; y < 5; y++) positions.push({ x, y, z: 1 });
        // Layer 2
        for (let x = 2; x < 4; x++) for (let y = 2; y < 4; y++) positions.push({ x, y, z: 2 });
        // Layer 3
        positions.push({ x: 2, y: 2, z: 3 });
        positions.push({ x: 3, y: 2, z: 3 });

        if (positions.length % 2 !== 0) positions.pop();

        // Assign Types
        const pairCount = positions.length / 2;
        let deck = [];
        for (let i = 0; i < pairCount; i++) {
            const type = this.types[i % this.types.length];
            deck.push(type, type);
        }
        deck.sort(() => Math.random() - 0.5);

        // --- Prevent Stacked Duplicates ---
        // We assign types tentatively, then check for violations.
        // Violation: tile at (x,y,z) has same type as tile at (x,y,z-1).

        // First map all positions to have a temp type
        positions.forEach((pos, i) => {
            // Create objects but don't finalize type
            const tile = new Tile(idCount++, deck[i], pos.x, pos.y, pos.z);
            this.tiles.push(tile);
        });

        // Resolve conflicts
        // Iterate and swap if conflict found
        let iterations = 0;
        let hasConflict = true;

        while (hasConflict && iterations < 100) {
            hasConflict = false;
            iterations++;

            this.tiles.forEach(t => {
                // Check tile below
                const tileBelow = this.tiles.find(other =>
                    other.z === t.z - 1 &&
                    Math.abs(other.x - t.x) < 0.1 &&
                    Math.abs(other.y - t.y) < 0.1
                );

                if (tileBelow && tileBelow.type === t.type) {
                    hasConflict = true;
                    // Swap logic: Pick a random other tile and swap types
                    const swapTarget = this.tiles[Math.floor(Math.random() * this.tiles.length)];
                    [t.type, swapTarget.type] = [swapTarget.type, t.type];
                }
            });
        }

        if (iterations >= 100) console.warn("Could not fully resolve stack conflicts");

        // --- Special Tile Logic ---
        // Pick one TYPE to be special.
        // We must ensure the SPECIAL TYPE pairs are accessible or at least valid.
        const specialType = this.tiles[0].type; // Just pick the first tile's type? No, random.
        // Actually, let's just pick one random type from the active set
        const activeTypes = [...new Set(this.tiles.map(t => t.type))];
        const chosenSpecialType = activeTypes[Math.floor(Math.random() * activeTypes.length)];

        this.tiles.forEach(t => {
            if (t.type === chosenSpecialType) {
                t.isSpecial = true;
                t.displayChar = '🌟';
            } else {
                t.displayChar = t.type;
            }
        });

        // Ensure Special Tiles are NOT at z=3 (Top) 
        const topSpecials = this.tiles.filter(t => t.isSpecial && t.z === 3);
        const bottomNormals = this.tiles.filter(t => !t.isSpecial && t.z === 0);

        topSpecials.forEach(ts => {
            if (bottomNormals.length > 0) {
                const swapTarget = bottomNormals.pop();
                [ts.type, swapTarget.type] = [swapTarget.type, ts.type];
                [ts.displayChar, swapTarget.displayChar] = [swapTarget.displayChar, ts.displayChar];
                [ts.isSpecial, swapTarget.isSpecial] = [swapTarget.isSpecial, ts.isSpecial];
            }
        });

        return this.tiles;
    }

    shuffleRemaining() {
        const active = this.tiles.filter(t => !t.removed);
        const currentTypes = active.map(t => ({ type: t.type, special: t.isSpecial }));

        currentTypes.sort(() => Math.random() - 0.5);

        // We need to apply the No-Stack Logic to shuffle too!
        // Simple Shuffle first
        active.forEach((t, i) => {
            t.type = currentTypes[i].type;
            t.isSpecial = currentTypes[i].special;
        });

        // Resolve conflicts again
        let iterations = 0;
        let hasConflict = true;
        while (hasConflict && iterations < 50) {
            hasConflict = false;
            iterations++;
            active.forEach(t => {
                // Check below (only if below is not removed)
                const tileBelow = this.tiles.find(other =>
                    !other.removed &&
                    other.z === t.z - 1 &&
                    Math.abs(other.x - t.x) < 0.1 &&
                    Math.abs(other.y - t.y) < 0.1
                );

                if (tileBelow && tileBelow.type === t.type) {
                    hasConflict = true;
                    // Swap with another active tile
                    const swapTarget = active[Math.floor(Math.random() * active.length)];
                    // Swap type/special status
                    const tempType = t.type;
                    const tempSpecial = t.isSpecial;

                    t.type = swapTarget.type;
                    t.isSpecial = swapTarget.isSpecial;

                    swapTarget.type = tempType;
                    swapTarget.isSpecial = tempSpecial;
                }
            });
        }

        // Re-set display chars
        active.forEach(t => {
            if (t.isSpecial) t.displayChar = '🌟';
            else t.displayChar = t.type;
            t.updateDOM();
        });
    }

    checkBlockedStatus() {
        this.tiles.forEach(t => {
            if (t.removed) return;
            const onTop = this.tiles.some(other => !other.removed && other.z === t.z + 1 && Math.abs(other.x - t.x) < 1 && Math.abs(other.y - t.y) < 1);
            const leftBlock = this.tiles.some(other => !other.removed && other.z === t.z && other.y === t.y && other.x === t.x - 1);
            const rightBlock = this.tiles.some(other => !other.removed && other.z === t.z && other.y === t.y && other.x === t.x + 1);
            t.isBlocked = onTop || (leftBlock && rightBlock);
            t.updateDOM();
        });
    }
}

class Game {
    constructor() {
        this.audio = new AudioManager();
        this.board = new Board();
        this.selectedTile = null;
        this.score = 0;
        this.isBlindMode = false;

        // UI
        this.uiScore = document.getElementById('score');
        this.boardDiv = document.getElementById('game-board');
        this.startScreen = document.getElementById('start-screen');
        this.overlay = document.getElementById('memory-overlay');
        this.memGrid = document.getElementById('memory-grid');
        this.vicScreen = document.getElementById('victory-screen');

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.startScreen.style.display = 'none';
            this.audio.checkResume();
            this.startLevel();
            this.audio.startBGM('main');
        });

        document.getElementById('btn-shuffle').addEventListener('click', () => {
            this.audio.checkResume();
            this.audio.playShuffle();
            this.board.shuffleRemaining();
            this.board.checkBlockedStatus();
            if (this.selectedTile) {
                this.selectedTile.el.classList.remove('selected');
                this.selectedTile = null;
            }
        });

        // Victory Buttons
        document.getElementById('btn-next').addEventListener('click', () => {
            this.vicScreen.classList.add('hidden');
            this.score = 0;
            this.uiScore.textContent = 0;
            this.startLevel();
            this.audio.startBGM('main');
        });

        document.getElementById('btn-end').addEventListener('click', () => {
            location.reload();
        });

        // Audio Toggle
        document.getElementById('audio-toggle').addEventListener('click', () => {
            this.audio.enabled = !this.audio.enabled;
            if (!this.audio.enabled) this.audio.stopBGM();
            else this.audio.startBGM(this.isBlindMode ? 'blind' : 'main');
        });
    }

    startLevel() {
        this.boardDiv.innerHTML = '';
        const tiles = this.board.generateLayout();
        tiles.forEach(t => {
            const el = t.createDOM();
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleTileClick(t);
            });
            this.boardDiv.appendChild(el);
        });
        this.board.checkBlockedStatus();
    }

    handleTileClick(tile) {
        if (this.isBlindMode) return;
        if (tile.removed || tile.isBlocked) {
            this.audio.playInvalid();
            tile.el.classList.add('shake');
            setTimeout(() => tile.el.classList.remove('shake'), 400);
            return;
        }

        this.audio.playSelect();

        if (this.selectedTile === tile) {
            tile.el.classList.remove('selected');
            this.selectedTile = null;
            return;
        }

        if (!this.selectedTile) {
            this.selectedTile = tile;
            tile.el.classList.add('selected');
        } else {
            if (this.selectedTile.type === tile.type) {
                this.processMatch(this.selectedTile, tile);
            } else {
                this.audio.playInvalid();
                this.selectedTile.el.classList.remove('selected');
                this.selectedTile.el.classList.add('shake');
                tile.el.classList.add('shake');
                setTimeout(() => {
                    if (this.selectedTile) this.selectedTile.el.classList.remove('shake');
                    tile.el.classList.remove('shake');
                    this.selectedTile = null;
                }, 400);
            }
        }
    }

    processMatch(t1, t2) {
        this.audio.playMatch();
        this.score += 100;
        this.uiScore.textContent = this.score;

        t1.removed = true;
        t2.removed = true;

        // Animate out
        t1.el.style.opacity = '0'; t1.el.style.transform = 'scale(0.0) rotate(180deg)';
        t2.el.style.opacity = '0'; t2.el.style.transform = 'scale(0.0) rotate(180deg)';
        setTimeout(() => { t1.el.style.display = 'none'; t2.el.style.display = 'none'; }, 300);

        this.selectedTile = null;
        this.board.checkBlockedStatus();

        // Check Victory
        if (this.board.tiles.every(t => t.removed)) {
            setTimeout(() => this.triggerVictory(), 1000);
        } else if (t1.isSpecial || t2.isSpecial) {
            setTimeout(() => this.triggerBlindMode(), 500);
        }
    }

    triggerVictory() {
        this.audio.stopBGM();
        this.audio.playVictory();
        document.getElementById('final-score').textContent = this.score;
        this.vicScreen.classList.remove('hidden');
    }

    triggerBlindMode() {
        this.isBlindMode = true;
        this.audio.startBGM('blind');
        this.overlay.classList.remove('hidden');

        const activeTiles = this.board.tiles.filter(t => !t.removed);
        let typeMap = {};
        activeTiles.forEach(t => {
            if (!typeMap[t.type]) typeMap[t.type] = [];
            typeMap[t.type].push(t);
        });

        let availablePairs = [];
        for (let type in typeMap) {
            const list = typeMap[type];
            while (list.length >= 2) availablePairs.push([list.pop(), list.pop()]);
        }
        availablePairs.sort(() => Math.random() - 0.5);
        const selectedPairs = availablePairs.slice(0, 10);

        this.memoryTiles = [];
        selectedPairs.forEach(pair => {
            this.memoryTiles.push({ type: pair[0].type, origin: pair[0], matched: false, dom: null });
            this.memoryTiles.push({ type: pair[1].type, origin: pair[1], matched: false, dom: null });
        });
        this.memoryTiles.sort(() => Math.random() - 0.5);

        this.renderMemoryGrid();

        let count = 5;
        const countEl = document.getElementById('countdown');
        const timerEl = document.querySelector('.blind-timer');
        timerEl.classList.add('hidden');
        countEl.classList.remove('hidden');
        countEl.textContent = count;

        const interval = setInterval(() => {
            count--;
            countEl.textContent = count;
            if (count <= 0) {
                clearInterval(interval);
                countEl.classList.add('hidden');
                this.startBlindInteraction();
            }
        }, 1000);
    }

    renderMemoryGrid() {
        this.memGrid.innerHTML = '';
        this.memoryTiles.forEach((mt, idx) => {
            const el = document.createElement('div');
            el.className = 'mem-tile';
            el.textContent = mt.type;
            el.onclick = () => this.handleMemClick(mt, idx);
            this.memGrid.appendChild(el);
            mt.dom = el;
        });
    }

    startBlindInteraction() {
        this.memoryTiles.forEach(mt => mt.dom.classList.add('flipped'));
        const timerEl = document.querySelector('.blind-timer');
        const timeVal = document.getElementById('blind-time');
        timerEl.classList.remove('hidden');

        let timeLeft = 30;
        timeVal.textContent = timeLeft;
        this.memLocked = false;
        this.memSelected = null;

        this.blindInterval = setInterval(() => {
            timeLeft--;
            timeVal.textContent = timeLeft;
            if (timeLeft <= 0) this.endBlindMode();
        }, 1000);
    }

    handleMemClick(mt, idx) {
        if (this.memLocked || mt.matched || !mt.dom.classList.contains('flipped')) return;
        this.audio.playSelect();
        mt.dom.classList.remove('flipped');

        if (!this.memSelected) {
            this.memSelected = mt;
        } else {
            this.memLocked = true;
            if (this.memSelected.type === mt.type) {
                this.audio.playMatch();
                mt.matched = true;
                this.memSelected.matched = true;

                setTimeout(() => {
                    mt.dom.style.opacity = 0;
                    this.memSelected.dom.style.opacity = 0;
                    this.memSelected = null;
                    this.memLocked = false;

                    if (this.memoryTiles.every(t => t.matched)) this.endBlindMode();
                }, 500);

                this.score += 200;
                this.uiScore.textContent = this.score;
            } else {
                this.audio.playInvalid();
                setTimeout(() => {
                    mt.dom.classList.add('flipped');
                    this.memSelected.dom.classList.add('flipped');
                    this.memSelected = null;
                    this.memLocked = false;
                }, 600);
            }
        }
    }

    endBlindMode() {
        clearInterval(this.blindInterval);
        this.overlay.classList.add('hidden');
        this.isBlindMode = false;

        this.audio.startBGM('main');

        let removeCount = 0;
        this.memoryTiles.forEach(mt => {
            if (mt.matched && !mt.origin.removed) {
                mt.origin.removed = true;
                mt.origin.el.style.display = 'none';
                removeCount++;
            }
        });

        if (removeCount > 0) this.board.checkBlockedStatus();

        if (this.board.tiles.every(t => t.removed)) this.triggerVictory();
    }
}

const game = new Game();
