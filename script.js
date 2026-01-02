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

// --- Global Sprite Data ---
const SPRITE_MAP = {
    '🀀': 'feng_dong', '🀁': 'feng_nan', '🀂': 'feng_xi', '🀃': 'feng_bei',
    '🀄': 'jian_zhong', '🀅': 'jian_fa', '🀆': 'jian_bai',
    '🀇': 'wan_1', '🀈': 'wan_2', '🀉': 'wan_3', '🀊': 'wan_4', '🀋': 'wan_5',
    '🀚': 'tong_2', '🀛': 'tong_3', '🀜': 'tong_4', '🀝': 'tong_5', '🀙': 'tong_1',
    '🀐': 'tiao_1', '🀑': 'tiao_2', '🀒': 'tiao_3', '🀓': 'tiao_4', '🀔': 'tiao_5'
};

const SPRITE_FRAMES = {
    "feng_dong": { x: 0, y: 0 }, "feng_nan": { x: 140, y: 0 }, "feng_xi": { x: 280, y: 0 }, "feng_bei": { x: 420, y: 0 },
    "jian_zhong": { x: 560, y: 0 }, "jian_fa": { x: 700, y: 0 }, "jian_bai": { x: 840, y: 0 },
    "wan_1": { x: 0, y: 180 }, "wan_2": { x: 140, y: 180 }, "wan_3": { x: 280, y: 180 }, "wan_4": { x: 420, y: 180 }, "wan_5": { x: 560, y: 180 },
    "wan_6": { x: 700, y: 180 }, "wan_7": { x: 840, y: 180 }, "wan_8": { x: 0, y: 360 }, "wan_9": { x: 140, y: 360 },
    "tiao_1": { x: 280, y: 360 }, "tiao_2": { x: 420, y: 360 }, "tiao_3": { x: 560, y: 360 }, "tiao_4": { x: 700, y: 360 }, "tiao_5": { x: 840, y: 360 },
    "tiao_6": { x: 0, y: 540 }, "tiao_7": { x: 140, y: 540 }, "tiao_8": { x: 280, y: 540 }, "tiao_9": { x: 420, y: 540 },
    "tong_1": { x: 560, y: 540 }, "tong_2": { x: 700, y: 540 }, "tong_3": { x: 840, y: 540 },
    "tong_4": { x: 0, y: 720 }, "tong_5": { x: 140, y: 720 }, "tong_6": { x: 280, y: 720 }, "tong_7": { x: 420, y: 720 }, "tong_8": { x: 560, y: 720 }, "tong_9": { x: 700, y: 720 },
    "back": { x: 840, y: 720 }
};

const TEXTS = {
    en: {
        gameTitle: "Crazy Blind Match",
        startDesc: "Match pairs. Find the Golden Pair to enter Blind Mode!",
        btnStart: "Start Game",
        score: "Score: ",
        trialTitle: "🌟 Spirit Trial Detected",
        trialDesc: "Match pairs in limited time.",
        trialReward: "Reward: 🛡️ Rescue Charm",
        trialRules: "Rule: Memorize quickly! Match 3x3 grid.",
        btnStartTrial: "Start Now",
        btnLater: "Later",
        btnDismiss: "Dismiss",
        btnShuffle: "🔀 Shuffle",
        btnTrial: "🌟 Trial",
        msgSuccessTitle: "VICTORY!",
        msgSuccessBody: "Great job! You earned +1 Rescue Charm.",
        msgFailTitle: "TRIAL FAILED",
        msgFailBody: "Don't give up! Look for the next Golden Pair.",
        btnContinue: "Continue",
        btnBack: "Back",
        levelPrefix: "Level: "
    },
    cn: {
        gameTitle: "疯狂盲消吧",
        startDesc: "消除麻将。找到金色灵牌进入盲消模式！",
        btnStart: "开始游戏",
        score: "分数: ",
        trialTitle: "🌟 发现灵牌试炼",
        trialDesc: "在有限时间内完成配对。",
        trialReward: "奖励: 🛡️ 救援符",
        trialRules: "规则：快速记忆！消除3x3方阵。",
        btnStartTrial: "立即挑战",
        btnLater: "稍后再说",
        btnDismiss: "忽略",
        btnShuffle: "🔀 洗牌",
        btnTrial: "🌟 挑战",
        msgSuccessTitle: "挑战成功！",
        msgSuccessBody: "太棒了！获得奖励 +1 救援符。",
        msgFailTitle: "挑战失败",
        msgFailBody: "别灰心！寻找下一对金色灵牌吧。",
        btnContinue: "继续游戏",
        btnBack: "返回",
        levelPrefix: "当前等级: "
    }
};

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
        // el.textContent = this.displayChar; // Removed for sprite

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
        // this.el.textContent = this.displayChar; // Removed

        let spriteKey = 'back';
        let frame = { x: 840, y: 720 }; // Default back

        const key = SPRITE_MAP[this.type];
        if (key && SPRITE_FRAMES[key]) {
            spriteKey = key;
            frame = SPRITE_FRAMES[key];
        }

        // Apply Global Scale (54/128 approx 0.421875)
        const SCALE = 54 / 128;
        const bgX = -frame.x * SCALE;
        const bgY = -frame.y * SCALE;

        this.el.style.backgroundPosition = `${bgX}px ${bgY}px`;

        // Overlay Spirit Mark
        if (this.isSpecial) {
            let mark = this.el.querySelector('.spirit-mark');
            if (!mark) {
                mark = document.createElement('div');
                mark.className = 'spirit-mark';
                mark.textContent = '🌟'; // Emoji Overlay
                this.el.appendChild(mark);
            }
        } else {
            const mark = this.el.querySelector('.spirit-mark');
            if (mark) mark.remove();
        }

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
        this.trialModal = document.getElementById('trial-offer-modal');
        this.btnTrialEntry = document.getElementById('btn-trial-entry');
        this.btnShuffle = document.getElementById('btn-shuffle');

        // State
        this.rescueCount = 2; // Start with 2
        this.flashVerifyLevel = 0;
        this.flashVerifyLevel = 0;
        this.deferredTrial = false;

        // Localization
        this.currentLang = localStorage.getItem('lang') || 'en';
        this.setLanguage(this.currentLang);

        this.bindEvents();
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);

        // Update Body Class
        if (lang === 'cn') document.body.classList.add('lang-cn');
        else document.body.classList.remove('lang-cn');

        // Update Button States
        document.querySelectorAll('.btn-lang').forEach(btn => {
            if (btn.dataset.lang === lang) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        this.updateTexts();
    }

    updateTexts() {
        const t = TEXTS[this.currentLang];
        // Static elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) el.textContent = t[key];
        });

        // Dynamic elements update
        this.updateRescueUI(); // Updates shuffle button text
        this.btnTrialEntry.textContent = t.btnTrial;
    }

    bindEvents() {
        // Lang Switch
        document.querySelectorAll('.btn-lang').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setLanguage(btn.dataset.lang);
            });
        });

        document.getElementById('btn-start').addEventListener('click', () => {
            this.startScreen.style.display = 'none';
            this.audio.checkResume();
            this.startLevel();
            this.audio.startBGM('main');
        });

        document.getElementById('btn-shuffle').addEventListener('click', () => {
            if (this.isBlindMode) return;
            if (this.rescueCount > 0) {
                this.rescueCount--;
                this.updateRescueUI();
                this.audio.checkResume();
                this.audio.playShuffle();
                this.board.shuffleRemaining();
                this.board.checkBlockedStatus();
                if (this.selectedTile) {
                    this.selectedTile.el.classList.remove('selected');
                    this.selectedTile = null;
                }
            } else {
                this.audio.playInvalid();
                const btn = document.getElementById('btn-shuffle');
                btn.classList.add('shake');
                setTimeout(() => btn.classList.remove('shake'), 400);
            }
        });

        // Trial Offer Buttons
        document.getElementById('btn-offer-start').addEventListener('click', () => {
            this.handleTrialChoice('START');
        });
        document.getElementById('btn-offer-later').addEventListener('click', () => {
            this.handleTrialChoice('LATER');
        });
        document.getElementById('btn-offer-dismiss').addEventListener('click', () => {
            this.handleTrialChoice('DISMISS');
        });

        // Deferred Entry
        this.btnTrialEntry.addEventListener('click', () => {
            this.handleTrialChoice('START_DEFERRED');
        });

        // Victory Buttons
        document.getElementById('btn-next').addEventListener('click', () => {
            this.vicScreen.classList.add('hidden');
            // Score accumulates!
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
        this.updateRescueUI();
        this.btnTrialEntry.classList.add('hidden');
        this.deferredTrial = false;
    }

    updateRescueUI() {
        // Localized shuffle text
        const t = TEXTS[this.currentLang];
        this.btnShuffle.textContent = `${t.btnShuffle} (${this.rescueCount})`;
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
            if (!this.deferredTrial) {
                setTimeout(() => this.showTrialOffer(), 500);
            }
        }
    }

    triggerVictory() {
        this.audio.stopBGM();
        this.audio.playVictory();
        document.getElementById('final-score').textContent = this.score;
        this.vicScreen.classList.remove('hidden');
    }

    showTrialOffer() {
        this.trialModal.classList.remove('hidden');
        this.audio.playSelect();

        // Show Level
        const t = TEXTS[this.currentLang];
        const lvlEl = document.getElementById('trial-level');
        if (lvlEl) lvlEl.textContent = `${t.levelPrefix}${this.flashVerifyLevel + 1}`;
    }

    handleTrialChoice(choice) {
        this.trialModal.classList.add('hidden');

        if (choice === 'START' || choice === 'START_DEFERRED') {
            if (choice === 'START_DEFERRED') {
                this.deferredTrial = false;
                this.btnTrialEntry.classList.add('hidden');
            }
            this.startBlindMode();
        } else if (choice === 'LATER') {
            this.deferredTrial = true;
            this.btnTrialEntry.classList.remove('hidden');
        } else {
            // DISMISS
            // No action needed, just close
        }
    }

    getFlashConfig(level) {
        // Base logic: 1.5s show time, reduced by 0.2s check level. Min 0.5s.
        // Pairs: 4 fixed for now.
        const BASE_SHOW = 1500;
        const REDUCTION = 200;
        const showTime = Math.max(500, BASE_SHOW - (level * REDUCTION));

        return { pairs: 4, time: 10, show: showTime };
    }

    startBlindMode() {
        this.isBlindMode = true;
        this.audio.startBGM('blind');
        this.overlay.classList.remove('hidden');

        // Flash Config
        const config = this.getFlashConfig(this.flashVerifyLevel);

        // Generate Memory Tiles
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

        // Dynamic Pair Count (Fixed to 4 for 3x3 grid - 1)
        const pairCount = 4;
        const selectedPairs = availablePairs.slice(0, pairCount);

        this.memoryTiles = [];
        selectedPairs.forEach(pair => {
            this.memoryTiles.push({ type: pair[0].type, origin: pair[0], matched: false, dom: null });
            this.memoryTiles.push({ type: pair[1].type, origin: pair[1], matched: false, dom: null });
        });
        this.memoryTiles.sort(() => Math.random() - 0.5);

        // Insert NULL at index 4 for center hole (Total 9 items)
        this.memoryTiles.splice(4, 0, null);

        this.renderMemoryGrid();

        // Flash Logic: Show tiles, then hide
        const countEl = document.getElementById('countdown'); // Reuse for instructions or just hide
        countEl.textContent = "MEMORIZE!";
        countEl.classList.remove('hidden');

        // Open all tiles
        this.memoryTiles.forEach(mt => {
            if (mt) mt.dom.classList.remove('flipped');
        });

        setTimeout(() => {
            countEl.classList.add('hidden');
            this.startBlindInteraction(config.time);
        }, config.show);
    }

    renderMemoryGrid() {
        this.memGrid.innerHTML = '';
        this.memoryTiles.forEach((mt, idx) => {
            if (mt === null) {
                // Placeholder
                const el = document.createElement('div');
                el.className = 'mem-tile-placeholder';
                this.memGrid.appendChild(el);
                return;
            }

            const el = document.createElement('div');
            el.className = 'mem-tile';
            // el.textContent = mt.type; // Removed

            // Sprite Logic for Memory Tile (Scale 60/128 approx 0.46875)
            let frame = { x: 840, y: 720 }; // Default

            const key = SPRITE_MAP[mt.type];
            if (key && SPRITE_FRAMES[key]) {
                frame = SPRITE_FRAMES[key];
            }

            const MEM_SCALE = 60 / 128;
            const bgX = -frame.x * MEM_SCALE;
            const bgY = -frame.y * MEM_SCALE;
            el.style.backgroundPosition = `${bgX}px ${bgY}px`;

            el.onclick = () => this.handleMemClick(mt, idx);
            this.memGrid.appendChild(el);
            mt.dom = el;
        });
    }

    startBlindInteraction(duration) {
        this.memoryTiles.forEach(mt => {
            if (mt) mt.dom.classList.add('flipped');
        });
        const timerEl = document.querySelector('.blind-timer');
        const timeVal = document.getElementById('blind-time');
        timerEl.classList.remove('hidden');

        let timeLeft = duration;
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

                    if (this.memoryTiles.filter(t => t !== null).every(t => t.matched)) this.endBlindMode(true);
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

    endBlindMode(forcedSuccess = false) {
        clearInterval(this.blindInterval);
        this.overlay.classList.add('hidden');
        this.isBlindMode = false;
        this.audio.startBGM('main');

        // Check Success
        // forcedSuccess passed from handleMemClick if all matched early
        const allMatched = forcedSuccess || this.memoryTiles.filter(t => t !== null).every(t => t.matched);

        // Remove matched tiles from board (Consolation/Progress)
        // Ensure tiles are actually removed from board logic
        let removeCount = 0;
        this.memoryTiles.forEach(mt => {
            if (mt && mt.matched && !mt.origin.removed) {
                mt.origin.removed = true;
                mt.origin.el.style.display = 'none';
                removeCount++;
            }
        });

        const t = TEXTS[this.currentLang];
        const msgModal = document.getElementById('msg-modal');
        const mTitle = document.getElementById('msg-title');
        const mBody = document.getElementById('msg-body');
        const mBtn = document.getElementById('msg-btn');

        msgModal.classList.remove('hidden');

        if (allMatched) {
            this.rescueCount++;
            this.flashVerifyLevel++;
            this.updateRescueUI();
            this.audio.playVictory();

            // Success Msg
            mTitle.textContent = t.msgSuccessTitle;
            mBody.textContent = t.msgSuccessBody;
            mBtn.textContent = t.btnContinue;
            mTitle.style.color = '#ffd700';

        } else {
            // Failed
            mTitle.textContent = t.msgFailTitle;
            mBody.textContent = t.msgFailBody;
            mBtn.textContent = t.btnBack;
            mTitle.style.color = '#ff4500';
        }

        mBtn.onclick = () => {
            msgModal.classList.add('hidden');
            if (removeCount > 0) {
                this.board.checkBlockedStatus();
                // Check game victory just in case
                if (this.board.tiles.every(t => t.removed)) this.triggerVictory();
            }
        };
    }
}

// Init Game
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOM Ready. Initializing Game...");
    window.game = new Game();
    console.log("✅ Game Initialized. Current Lang:", window.game.currentLang);
});
