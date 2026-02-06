/**
 * BootScene.js - Boot / Splash Screen
 * Feeding Frenzy - Fish Feeding Game
 *
 * Shows the game title, generates all procedural textures via AssetGenerator,
 * initializes SoundSystem, and waits for user interaction to unlock Web Audio
 * before transitioning to MenuScene.
 */

window.BootScene = class BootScene extends Phaser.Scene {

    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // All assets are procedurally generated -- nothing to load from disk.
    }

    create() {
        var C = window.Constants;
        var W = C.GAME_WIDTH;
        var H = C.GAME_HEIGHT;

        // ================================================
        // 1. OCEAN GRADIENT BACKGROUND
        // ================================================
        this._drawOceanBackground(W, H, C);

        // ================================================
        // 2. DECORATIVE BUBBLES (background ambiance)
        // ================================================
        this._bubbles = [];
        this._createBubbles(8, W, H);

        // ================================================
        // 3. TITLE TEXT
        // ================================================
        this._titleText = this.add.text(W / 2, H * 0.28, '피딩 프렌지', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#003366',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.HUD);

        // Gentle bounce tween on the title
        this.tweens.add({
            targets: this._titleText,
            y: H * 0.28 - 8,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ================================================
        // 4. LOADING TEXT
        // ================================================
        this._loadingText = this.add.text(W / 2, H * 0.52, '로딩중...', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '28px',
            color: '#aaddff',
            align: 'center'
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.HUD);

        // ================================================
        // 5. LOADING PROGRESS BAR
        // ================================================
        var barWidth = 400;
        var barHeight = 20;
        var barX = (W - barWidth) / 2;
        var barY = H * 0.58;

        // Bar background (dark rounded rect)
        this._barBg = this.add.graphics().setDepth(C.DEPTH.HUD);
        this._barBg.fillStyle(0x002244, 0.7);
        this._barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 10);
        this._barBg.lineStyle(2, 0x4488aa, 0.9);
        this._barBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 10);

        // Bar fill (will be drawn progressively)
        this._barFill = this.add.graphics().setDepth(C.DEPTH.HUD);
        this._barX = barX;
        this._barY = barY;
        this._barWidth = barWidth;
        this._barHeight = barHeight;

        // Draw initial empty bar
        this._drawProgressBar(0);

        // ================================================
        // 6. GENERATE ASSETS & INITIALIZE SYSTEMS
        // ================================================
        this._generateAssetsAndInit();
    }

    update(time, delta) {
        // Animate bubbles floating upward
        this._updateBubbles(delta);
    }

    // ==================================================
    // PRIVATE: Ocean gradient background
    // ==================================================
    _drawOceanBackground(W, H, C) {
        var gfx = this.add.graphics().setDepth(C.DEPTH.BACKGROUND);
        var colors = C.OCEAN_COLORS;

        // Draw 4-stop vertical gradient using horizontal bands
        var stops = [
            { y: 0, color: colors.SURFACE },
            { y: H * 0.33, color: colors.MID },
            { y: H * 0.66, color: colors.DEEP },
            { y: H, color: colors.ABYSS }
        ];

        var bandCount = 80;
        for (var i = 0; i < bandCount; i++) {
            var t = i / bandCount;
            var yPos = t * H;
            var bandH = H / bandCount + 1;

            // Find which two stops we're between
            var color = this._interpolateGradient(stops, yPos, H);
            gfx.fillStyle(color, 1);
            gfx.fillRect(0, yPos, W, bandH);
        }
    }

    /**
     * Linearly interpolate between gradient stops.
     */
    _interpolateGradient(stops, y, H) {
        // Find the two stops that bracket this y
        var lower = stops[0];
        var upper = stops[stops.length - 1];
        for (var i = 0; i < stops.length - 1; i++) {
            if (y >= stops[i].y && y <= stops[i + 1].y) {
                lower = stops[i];
                upper = stops[i + 1];
                break;
            }
        }

        var range = upper.y - lower.y;
        if (range <= 0) return lower.color;

        var t = (y - lower.y) / range;
        return Phaser.Display.Color.ObjectToColor(
            Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.IntegerToColor(lower.color),
                Phaser.Display.Color.IntegerToColor(upper.color),
                1, t
            )
        ).color;
    }

    // ==================================================
    // PRIVATE: Decorative bubbles
    // ==================================================
    _createBubbles(count, W, H) {
        for (var i = 0; i < count; i++) {
            var radius = 3 + Math.random() * 6;
            var bx = Phaser.Math.Between(50, W - 50);
            var by = Phaser.Math.Between(H * 0.3, H);

            var circle = this.add.graphics().setDepth(Constants.DEPTH.BUBBLES);
            circle.fillStyle(0xffffff, 0.15 + Math.random() * 0.15);
            circle.fillCircle(0, 0, radius);
            circle.lineStyle(1, 0xffffff, 0.2);
            circle.strokeCircle(0, 0, radius);
            circle.setPosition(bx, by);

            this._bubbles.push({
                gfx: circle,
                speed: 20 + Math.random() * 30,
                wobbleSpeed: 0.5 + Math.random() * 1.0,
                wobbleAmount: 5 + Math.random() * 10,
                time: Math.random() * Math.PI * 2,
                baseX: bx,
                radius: radius
            });
        }
    }

    _updateBubbles(delta) {
        var C = window.Constants;
        var H = C.GAME_HEIGHT;
        var ds = delta / 1000;

        for (var i = 0; i < this._bubbles.length; i++) {
            var b = this._bubbles[i];
            b.time += b.wobbleSpeed * ds;

            // Rise upward
            var newY = b.gfx.y - b.speed * ds;
            if (newY < -b.radius * 2) {
                newY = H + b.radius * 2;
                b.baseX = Phaser.Math.Between(50, C.GAME_WIDTH - 50);
            }

            b.gfx.y = newY;
            b.gfx.x = b.baseX + Math.sin(b.time) * b.wobbleAmount;
        }
    }

    // ==================================================
    // PRIVATE: Progress bar drawing
    // ==================================================
    _drawProgressBar(progress) {
        this._barFill.clear();
        if (progress <= 0) return;

        var fillWidth = Math.floor(this._barWidth * Math.min(progress, 1));
        if (fillWidth < 4) return;

        // Gradient fill from cyan to blue
        this._barFill.fillStyle(0x00bbee, 0.9);
        this._barFill.fillRoundedRect(
            this._barX, this._barY,
            fillWidth, this._barHeight,
            { tl: 10, tr: fillWidth >= this._barWidth - 2 ? 10 : 2, bl: 10, br: fillWidth >= this._barWidth - 2 ? 10 : 2 }
        );

        // Bright highlight strip along top
        this._barFill.fillStyle(0x66ddff, 0.5);
        this._barFill.fillRect(this._barX + 4, this._barY + 2, fillWidth - 8, 4);
    }

    // ==================================================
    // PRIVATE: Asset generation & system init
    // ==================================================
    _generateAssetsAndInit() {
        var self = this;
        var C = window.Constants;

        // We split asset generation into timed steps to show progress,
        // even though the generation itself is synchronous canvas work.
        var steps = [];
        var totalSteps = 10;

        // Step 1-8: We will chunk AssetGenerator.generateAll if possible,
        // otherwise call it all at once and simulate progress.
        // Step 9: Initialize SoundSystem
        // Step 10: Show "touch to start"

        var currentStep = 0;

        var runStep = function () {
            currentStep++;
            var progress = currentStep / totalSteps;
            self._drawProgressBar(progress);

            if (currentStep === 1) {
                // Generate all procedural textures
                if (window.AssetGenerator && typeof window.AssetGenerator.generateAll === 'function') {
                    try {
                        window.AssetGenerator.generateAll(self);
                    } catch (e) {
                        console.warn('[BootScene] AssetGenerator error:', e);
                    }
                } else {
                    console.warn('[BootScene] AssetGenerator not found, skipping texture generation');
                }
            }

            if (currentStep < totalSteps - 1) {
                // Continue stepping through progress bar with small delays
                self.time.delayedCall(80, runStep);
            } else if (currentStep === totalSteps - 1) {
                // Initialize SoundSystem
                self._initSoundSystem();
                self.time.delayedCall(80, runStep);
            } else {
                // Final step: show "touch to start"
                self._drawProgressBar(1);
                self._showTouchToStart();
            }
        };

        // Start the simulated progress after a brief delay to let the scene render
        this.time.delayedCall(200, runStep);
    }

    _initSoundSystem() {
        if (window.SoundSystem) {
            try {
                var soundSystem = new window.SoundSystem(this);
                // Store in registry for other scenes to access
                this.game.registry.set('soundSystem', soundSystem);
                // Also store on window for convenience
                window.soundSystem = soundSystem;
            } catch (e) {
                console.warn('[BootScene] SoundSystem init error:', e);
            }
        } else {
            console.warn('[BootScene] SoundSystem not found, audio disabled');
        }
    }

    _showTouchToStart() {
        var C = window.Constants;
        var W = C.GAME_WIDTH;
        var H = C.GAME_HEIGHT;

        // Hide loading text
        if (this._loadingText) {
            this._loadingText.setVisible(false);
        }

        // "Touch to start" text with pulse animation
        var touchText = this.add.text(W / 2, H * 0.72, '터치하여 시작', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#003366',
                blur: 4,
                fill: true
            }
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.HUD);

        // Gentle pulse tween
        this.tweens.add({
            targets: touchText,
            alpha: { from: 1.0, to: 0.4 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle below title
        this.add.text(W / 2, H * 0.37, 'Fish Feeding Game', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '22px',
            color: '#88ccee',
            align: 'center'
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.HUD);

        // Listen for any input to proceed
        // This is required for Web Audio API context activation (browser policy)
        this.input.once('pointerdown', function () {
            // Resume audio context if suspended
            if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume().catch(function (e) {
                    console.warn('[BootScene] AudioContext resume failed:', e);
                });
            }

            // Camera fade out then start menu
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', function () {
                this.scene.start(C.SCENES.MENU);
            }, this);
        }, this);
    }
};
