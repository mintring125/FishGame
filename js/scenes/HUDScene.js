/**
 * HUDScene.js
 *
 * Heads-Up Display overlay scene for the Feeding Frenzy fish game.
 * Runs in parallel with GameScene and displays:
 * - Score, Lives, Level
 * - Level progress bar
 * - Frenzy multiplier
 * - Combo counter
 * - Pause button
 * - Power-up indicators
 */

window.HUDScene = class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    init(data) {
        this.lives = data.lives || 3;
        this.level = data.level || 1;
        this.score = data.score || 0;
        this.combo = 0;
        this.frenzyTier = 0;
        this.powerUps = new Map(); // Track active power-ups
    }

    create() {
        const { GAME_WIDTH, GAME_HEIGHT, HUD_PADDING, HUD_FONT_SIZE,
            HUD_SCORE_COLOR, HUD_COMBO_FONT_SIZE, HUD_LIFE_ICON_SIZE,
            HUD_LIFE_ICON_SPACING, DEPTH } = window.Constants;

        // Setup event listeners from GameScene
        this.setupEventListeners();

        // Score display (top-left)
        this.scoreText = this.add.text(HUD_PADDING, HUD_PADDING, '점수: 0', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: `${HUD_FONT_SIZE}px`,
            color: HUD_SCORE_COLOR,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(DEPTH.HUD);

        // Lives display (below score)
        const livesY = HUD_PADDING + HUD_FONT_SIZE + 10;
        this.heartsGroup = this.add.container(HUD_PADDING, livesY);
        this.hearts = [];

        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(
                i * (HUD_LIFE_ICON_SIZE + HUD_LIFE_ICON_SPACING),
                0,
                'heart_full'
            ).setDisplaySize(HUD_LIFE_ICON_SIZE, HUD_LIFE_ICON_SIZE);
            this.hearts.push(heart);
            this.heartsGroup.add(heart);
        }
        this.heartsGroup.setDepth(DEPTH.HUD);

        // Level display (top-right)
        this.levelText = this.add.text(GAME_WIDTH - HUD_PADDING, HUD_PADDING, `레벨 ${this.level}`, {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: `${HUD_FONT_SIZE}px`,
            color: HUD_SCORE_COLOR,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0).setDepth(DEPTH.HUD);

        // Level progress bar (below level text)
        const progressBarY = HUD_PADDING + HUD_FONT_SIZE + 10;
        const progressBarWidth = 200;
        const progressBarHeight = 20;
        const progressBarX = GAME_WIDTH - HUD_PADDING - progressBarWidth;

        this.progressBarBg = this.add.image(progressBarX, progressBarY, 'frenzy_bar_bg')
            .setOrigin(0, 0)
            .setDisplaySize(progressBarWidth, progressBarHeight)
            .setDepth(DEPTH.HUD);

        this.progressBarFill = this.add.image(progressBarX, progressBarY, 'frenzy_bar_fill')
            .setOrigin(0, 0)
            .setDisplaySize(0, progressBarHeight)
            .setDepth(DEPTH.HUD);

        // Frenzy multiplier (center-top)
        this.frenzyText = this.add.text(GAME_WIDTH / 2, HUD_PADDING + 10, '', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '48px',
            color: '#FFFF00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5, 0).setDepth(DEPTH.HUD).setVisible(false);

        // Combo counter (below frenzy)
        this.comboText = this.add.text(GAME_WIDTH / 2, HUD_PADDING + 70, '', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: `${HUD_COMBO_FONT_SIZE}px`,
            color: '#FFA500',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0).setDepth(DEPTH.HUD).setVisible(false);

        // Pause button (top-right area, below level display)
        const pauseButtonX = GAME_WIDTH - HUD_PADDING - 30;
        const pauseButtonY = HUD_PADDING + HUD_FONT_SIZE + 45;

        this.pauseButton = this.add.text(pauseButtonX, pauseButtonY, '멈춤', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '24px',
            color: '#FFFFFF',
            backgroundColor: '#000000AA',
            padding: { x: 15, y: 10 },
            stroke: '#FFFFFF',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5).setDepth(DEPTH.HUD).setInteractive({ useHandCursor: true });

        this.pauseButton.on('pointerdown', () => {
            const gameScene = this.scene.get('GameScene');
            if (gameScene && gameScene.events) {
                gameScene.events.emit('requestPause');
            }
        });

        // Power-up indicators container (bottom-left)
        this.powerUpContainer = this.add.container(HUD_PADDING, GAME_HEIGHT - HUD_PADDING - 60)
            .setDepth(DEPTH.HUD);

        // Level cleared flash text (hidden initially)
        this.levelClearedText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '레벨 클리어!', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '64px',
            color: '#00FF00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(DEPTH.HUD).setVisible(false);

        // Stun indicator (hidden initially)
        this.stunText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '기절!', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '48px',
            color: '#FF0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(DEPTH.HUD).setVisible(false);

        // Initial update
        this.updateScore(this.score);
        this.updateLives(this.lives);
        this.updateLevelProgress();
    }

    setupEventListeners() {
        const gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.events) return;

        const events = gameScene.events;

        events.on('fishEaten', (data) => {
            this.updateScore(data.score);
            this.updateCombo(data.combo);
            this.updateLevelProgress();
        });

        events.on('playerHit', (data) => {
            if (data && typeof data.lives !== 'undefined') {
                this.updateLives(data.lives);
            }
        });

        events.on('frenzyUpdate', (data) => {
            this.updateFrenzy(data.tier, data.multiplier);
        });

        events.on('frenzyReset', () => {
            this.hideFrenzy();
        });

        events.on('frenzyTierUp', (tier) => {
            this.flashFrenzyTierUp(tier);
        });

        events.on('levelCleared', () => {
            this.flashLevelCleared();
        });

        events.on('playerStunned', (data) => {
            this.showStunIndicator(data.duration);
        });

        events.on('powerUpActivated', (type, duration) => {
            this.addPowerUpIndicator(type, duration);
        });

        events.on('powerUpExpired', (type) => {
            this.removePowerUpIndicator(type);
        });
    }

    updateScore(score) {
        this.score = score;
        // Format with thousand separators
        const formattedScore = score.toLocaleString('ko-KR');
        this.scoreText.setText(`점수: ${formattedScore}`);
    }

    updateLives(lives) {
        const oldLives = this.lives;
        this.lives = lives;

        // Update heart icons
        for (let i = 0; i < 3; i++) {
            if (i < lives) {
                this.hearts[i].setTexture('heart_full');
            } else {
                this.hearts[i].setTexture('heart_empty');
            }
        }

        // Animate heart loss
        if (lives < oldLives) {
            const lostHeartIndex = lives; // 0-indexed
            if (this.hearts[lostHeartIndex]) {
                this.tweens.add({
                    targets: this.hearts[lostHeartIndex],
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0.5,
                    duration: 200,
                    yoyo: true,
                    onComplete: () => {
                        this.hearts[lostHeartIndex].setAlpha(1);
                    }
                });
            }
        }
    }

    updateCombo(combo) {
        this.combo = combo;
        if (combo > 1) {
            this.comboText.setText(`${combo} 콤보!`);
            this.comboText.setVisible(true);

            // Pulse animation
            this.tweens.add({
                targets: this.comboText,
                scale: 1.2,
                duration: 150,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        } else {
            this.comboText.setVisible(false);
        }
    }

    updateFrenzy(tier, multiplier) {
        this.frenzyTier = tier;

        if (tier > 0) {
            const { FRENZY_COLORS } = window.Constants;
            const color = FRENZY_COLORS[tier] || '#FFFF00';

            this.frenzyText.setText(`X${multiplier}!`);
            this.frenzyText.setColor(color);
            this.frenzyText.setVisible(true);
        } else {
            this.hideFrenzy();
        }
    }

    hideFrenzy() {
        this.frenzyText.setVisible(false);
        this.frenzyTier = 0;
    }

    flashFrenzyTierUp(tier) {
        // Flash animation for frenzy tier increase
        this.tweens.add({
            targets: this.frenzyText,
            scale: 1.5,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }

    updateLevelProgress() {
        const { DIFFICULTY } = window.Constants;
        const clearScore = DIFFICULTY.levelClearScore(this.level);
        const progress = Math.min(this.score / clearScore, 1);

        const progressBarWidth = 200;
        this.progressBarFill.setDisplaySize(progressBarWidth * progress, 20);
    }

    flashLevelCleared() {
        this.levelClearedText.setVisible(true);
        this.levelClearedText.setScale(0);

        this.tweens.add({
            targets: this.levelClearedText,
            scale: 1.2,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.levelClearedText,
                    alpha: 0,
                    duration: 1000,
                    delay: 1000,
                    onComplete: () => {
                        this.levelClearedText.setVisible(false);
                        this.levelClearedText.setAlpha(1);
                    }
                });
            }
        });
    }

    showStunIndicator(duration) {
        this.stunText.setVisible(true);
        this.stunText.setAlpha(1);

        this.tweens.add({
            targets: this.stunText,
            alpha: 0,
            duration: duration,
            onComplete: () => {
                this.stunText.setVisible(false);
            }
        });
    }

    addPowerUpIndicator(type, duration) {
        // Create power-up indicator
        const index = this.powerUps.size;
        const spacing = 50;
        const x = index * spacing;

        const container = this.add.container(x, 0);

        // Icon (use placeholder circle for now)
        const icon = this.add.circle(0, 0, 20, 0x00FF00, 0.8);

        // Duration bar background
        const barBg = this.add.rectangle(0, 25, 40, 6, 0x000000, 0.5);

        // Duration bar fill
        const barFill = this.add.rectangle(0, 25, 40, 6, 0xFFFFFF, 1)
            .setOrigin(0.5, 0.5);

        container.add([icon, barBg, barFill]);
        this.powerUpContainer.add(container);

        this.powerUps.set(type, { container, barFill, duration, elapsed: 0 });
    }

    removePowerUpIndicator(type) {
        const indicator = this.powerUps.get(type);
        if (indicator) {
            indicator.container.destroy();
            this.powerUps.delete(type);

            // Reposition remaining indicators
            let index = 0;
            const spacing = 50;
            this.powerUps.forEach((ind) => {
                ind.container.setPosition(index * spacing, 0);
                index++;
            });
        }
    }

    update(time, delta) {
        // Update power-up duration bars
        this.powerUps.forEach((indicator, type) => {
            indicator.elapsed += delta;
            const remaining = Math.max(0, 1 - (indicator.elapsed / indicator.duration));
            indicator.barFill.setScale(remaining, 1);

            if (remaining === 0) {
                this.removePowerUpIndicator(type);
            }
        });
    }

    shutdown() {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.events) {
            gameScene.events.off('fishEaten');
            gameScene.events.off('playerHit');
            gameScene.events.off('frenzyUpdate');
            gameScene.events.off('frenzyReset');
            gameScene.events.off('frenzyTierUp');
            gameScene.events.off('levelCleared');
            gameScene.events.off('playerStunned');
            gameScene.events.off('powerUpActivated');
            gameScene.events.off('powerUpExpired');
        }
    }
};
