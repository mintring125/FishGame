/**
 * MenuScene.js - Main Menu Screen
 * Feeding Frenzy - Fish Feeding Game
 *
 * Displays the game title, menu buttons (Start, Tutorial, Settings),
 * high score / level info, sound/music toggles, and decorative
 * background fish + bubbles. Plays menu BGM if music is enabled.
 */

window.MenuScene = class MenuScene extends Phaser.Scene {

    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        var C = window.Constants;
        var W = C.GAME_WIDTH;
        var H = C.GAME_HEIGHT;

        // Fade in
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Track all interactive elements for cleanup
        this._tweens = [];
        this._settingsOpen = false;
        this._settingsContainer = null;

        // ================================================
        // 1. OCEAN BACKGROUND
        // ================================================
        this._drawOceanBackground(W, H, C);

        // ================================================
        // 2. AMBIENT BUBBLES
        // ================================================
        this._bubbles = [];
        this._createBubbles(12, W, H);

        // ================================================
        // 3. DECORATIVE BACKGROUND FISH
        // ================================================
        this._bgFish = [];
        this._createBackgroundFish(5, W, H, C);

        // ================================================
        // 4. LIGHT RAYS (subtle atmospheric effect)
        // ================================================
        this._createLightRays(W, H, C);

        // ================================================
        // 5. TITLE
        // ================================================
        this._createTitle(W, H, C);

        // ================================================
        // 6. MENU BUTTONS
        // ================================================
        this._createMenuButtons(W, H, C);

        // ================================================
        // 7. INFO AREA (bottom)
        // ================================================
        this._createInfoArea(W, H, C);

        // ================================================
        // 8. PLAY MENU BGM
        // ================================================
        this._playMenuMusic(C);
    }

    update(time, delta) {
        this._updateBubbles(delta);
        this._updateBackgroundFish(delta);
    }

    // ==================================================
    // OCEAN BACKGROUND
    // ==================================================
    _drawOceanBackground(W, H, C) {
        var gfx = this.add.graphics().setDepth(C.DEPTH.BACKGROUND);
        var colors = C.OCEAN_COLORS;

        var stops = [
            { y: 0,         color: colors.SURFACE },
            { y: H * 0.33,  color: colors.MID },
            { y: H * 0.66,  color: colors.DEEP },
            { y: H,         color: colors.ABYSS }
        ];

        var bandCount = 80;
        for (var i = 0; i < bandCount; i++) {
            var t = i / bandCount;
            var yPos = t * H;
            var bandH = H / bandCount + 1;
            var color = this._interpolateGradient(stops, yPos, H);
            gfx.fillStyle(color, 1);
            gfx.fillRect(0, yPos, W, bandH);
        }
    }

    _interpolateGradient(stops, y, H) {
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
    // AMBIENT BUBBLES
    // ==================================================
    _createBubbles(count, W, H) {
        for (var i = 0; i < count; i++) {
            var radius = 2 + Math.random() * 7;
            var bx = Phaser.Math.Between(40, W - 40);
            var by = Phaser.Math.Between(H * 0.2, H);

            var circle = this.add.graphics().setDepth(Constants.DEPTH.BUBBLES);
            circle.fillStyle(0xffffff, 0.12 + Math.random() * 0.15);
            circle.fillCircle(0, 0, radius);
            circle.lineStyle(1, 0xffffff, 0.18);
            circle.strokeCircle(0, 0, radius);
            circle.setPosition(bx, by);

            this._bubbles.push({
                gfx: circle,
                speed: 18 + Math.random() * 35,
                wobbleSpeed: 0.4 + Math.random() * 1.0,
                wobbleAmount: 4 + Math.random() * 12,
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
            var newY = b.gfx.y - b.speed * ds;
            if (newY < -b.radius * 2) {
                newY = H + b.radius * 2;
                b.baseX = Phaser.Math.Between(40, C.GAME_WIDTH - 40);
            }
            b.gfx.y = newY;
            b.gfx.x = b.baseX + Math.sin(b.time) * b.wobbleAmount;
        }
    }

    // ==================================================
    // DECORATIVE BACKGROUND FISH
    // ==================================================
    _createBackgroundFish(count, W, H, C) {
        var fishColors = C.FISH_COLORS;

        for (var i = 0; i < count; i++) {
            var colorIdx = i % fishColors.length;
            var fc = fishColors[colorIdx];
            var size = 18 + Math.random() * 28;
            var fromLeft = Math.random() < 0.5;
            var dir = fromLeft ? 1 : -1;
            var x = fromLeft ? -(size + Math.random() * 200) : W + size + Math.random() * 200;
            var y = Phaser.Math.Between(Math.floor(H * 0.15), Math.floor(H * 0.85));
            var speed = 40 + Math.random() * 60;

            // Draw a simple fish shape using graphics
            var fishGfx = this.add.graphics().setDepth(C.DEPTH.ENEMY_FISH - 2);
            this._drawSimpleFish(fishGfx, fc, size, dir);
            fishGfx.setPosition(x, y);
            fishGfx.setAlpha(0.5 + Math.random() * 0.3);

            this._bgFish.push({
                gfx: fishGfx,
                speed: speed,
                dir: dir,
                size: size,
                baseY: y,
                wobbleTime: Math.random() * Math.PI * 2,
                wobbleSpeed: 1.0 + Math.random() * 1.5,
                wobbleAmount: 10 + Math.random() * 20
            });
        }
    }

    _drawSimpleFish(gfx, colors, size, dir) {
        var s = size;
        var hw = s;      // half-width (body length)
        var hh = s * 0.5; // half-height

        // Body ellipse
        gfx.fillStyle(colors.body, 1);
        gfx.fillEllipse(0, 0, hw * 2, hh * 2);

        // Belly (lighter lower half)
        gfx.fillStyle(colors.belly, 0.5);
        gfx.fillEllipse(0, hh * 0.3, hw * 1.4, hh * 1.0);

        // Tail fin
        var tailX = -dir * hw;
        gfx.fillStyle(colors.fin, 1);
        gfx.fillTriangle(
            tailX, 0,
            tailX - dir * s * 0.5, -hh * 0.7,
            tailX - dir * s * 0.5, hh * 0.7
        );

        // Eye
        var eyeX = dir * hw * 0.45;
        var eyeY = -hh * 0.2;
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(eyeX, eyeY, s * 0.12);
        gfx.fillStyle(0x000000, 1);
        gfx.fillCircle(eyeX + dir * 1.5, eyeY, s * 0.06);
    }

    _updateBackgroundFish(delta) {
        var C = window.Constants;
        var W = C.GAME_WIDTH;
        var ds = delta / 1000;

        for (var i = 0; i < this._bgFish.length; i++) {
            var f = this._bgFish[i];
            f.wobbleTime += f.wobbleSpeed * ds;

            // Move horizontally
            f.gfx.x += f.dir * f.speed * ds;

            // Vertical wobble
            f.gfx.y = f.baseY + Math.sin(f.wobbleTime) * f.wobbleAmount;

            // Wrap around when offscreen
            if (f.dir > 0 && f.gfx.x > W + f.size * 3) {
                f.gfx.x = -(f.size * 2);
                f.baseY = Phaser.Math.Between(
                    Math.floor(C.GAME_HEIGHT * 0.15),
                    Math.floor(C.GAME_HEIGHT * 0.85)
                );
            } else if (f.dir < 0 && f.gfx.x < -(f.size * 3)) {
                f.gfx.x = W + f.size * 2;
                f.baseY = Phaser.Math.Between(
                    Math.floor(C.GAME_HEIGHT * 0.15),
                    Math.floor(C.GAME_HEIGHT * 0.85)
                );
            }
        }
    }

    // ==================================================
    // LIGHT RAYS
    // ==================================================
    _createLightRays(W, H, C) {
        var rayGfx = this.add.graphics().setDepth(C.DEPTH.LIGHT_RAYS);

        for (var i = 0; i < C.LIGHT_RAY_COUNT; i++) {
            var rx = Phaser.Math.Between(Math.floor(W * 0.1), Math.floor(W * 0.9));
            var rayWidth = 30 + Math.random() * 60;
            var rayAlpha = C.LIGHT_RAY_ALPHA * (0.5 + Math.random() * 0.5);

            rayGfx.fillStyle(0xffffff, rayAlpha);
            rayGfx.fillTriangle(
                rx - rayWidth / 2, 0,
                rx + rayWidth / 2, 0,
                rx + (Math.random() - 0.5) * 40, H * (0.6 + Math.random() * 0.3)
            );
        }
    }

    // ==================================================
    // TITLE
    // ==================================================
    _createTitle(W, H, C) {
        // Main title
        var title = this.add.text(W / 2, H * 0.15, '피딩 프렌지', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '72px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center',
            stroke: '#FFB300',
            strokeThickness: 4,
            shadow: {
                offsetX: 3,
                offsetY: 4,
                color: '#004466',
                blur: 10,
                fill: true
            }
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.HUD);

        // Gentle float
        this.tweens.add({
            targets: title,
            y: H * 0.15 - 6,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle
        this.add.text(W / 2, H * 0.22, 'Fish Feeding Game', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '24px',
            color: '#88ccee',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#003366',
                blur: 4,
                fill: true
            }
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.HUD);
    }

    // ==================================================
    // MENU BUTTONS
    // ==================================================
    _createMenuButtons(W, H, C) {
        var self = this;
        var centerX = W / 2;
        var startY = H * 0.42;
        var spacing = 90;

        var btnW = 280;
        var btnH = 70;
        var btnFontSize = '32px';

        // --- "시작" (Start) button - primary ---
        this._createButton(centerX, startY, btnW, btnH, '시작', {
            fontSize: btnFontSize,
            fillColor: 0x0088CC,
            fillColorHover: 0x00AAEE,
            strokeColor: 0x006699,
            textColor: '#ffffff',
            depth: C.DEPTH.HUD
        }, function () {
            self._onStartGame(C);
        });

        // --- "도움말" (Tutorial) button ---
        this._createButton(centerX, startY + spacing, btnW, btnH, '도움말', {
            fontSize: btnFontSize,
            fillColor: 0x2E7D32,
            fillColorHover: 0x43A047,
            strokeColor: 0x1B5E20,
            textColor: '#ffffff',
            depth: C.DEPTH.HUD
        }, function () {
            self._stopMenuMusic();
            self.cameras.main.fadeOut(400, 0, 0, 0);
            self.cameras.main.once('camerafadeoutcomplete', function () {
                self.scene.start(C.SCENES.TUTORIAL);
            });
        });

        // --- "설정" (Settings) button ---
        this._createButton(centerX, startY + spacing * 2, btnW, btnH, '설정', {
            fontSize: btnFontSize,
            fillColor: 0x546E7A,
            fillColorHover: 0x78909C,
            strokeColor: 0x37474F,
            textColor: '#ffffff',
            depth: C.DEPTH.HUD
        }, function () {
            self._toggleSettings(W, H, C);
        });
    }

    /**
     * Create a rounded rectangle button with hover/touch effects.
     */
    _createButton(x, y, w, h, label, style, callback) {
        var self = this;
        var gfx = this.add.graphics().setDepth(style.depth || 100);

        // Draw button background
        var drawButton = function (color) {
            gfx.clear();

            // Shadow
            gfx.fillStyle(0x000000, 0.25);
            gfx.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w, h, 16);

            // Main fill
            gfx.fillStyle(color, 1);
            gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 16);

            // Top highlight
            gfx.fillStyle(0xffffff, 0.15);
            gfx.fillRoundedRect(x - w / 2 + 4, y - h / 2 + 2, w - 8, h * 0.4, { tl: 14, tr: 14, bl: 4, br: 4 });

            // Border
            gfx.lineStyle(2, style.strokeColor, 0.8);
            gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 16);
        };

        drawButton(style.fillColor);

        // Button text
        var text = this.add.text(x, y, label, {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: style.fontSize || '28px',
            fontStyle: 'bold',
            color: style.textColor || '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 3,
                fill: true
            }
        }).setOrigin(0.5, 0.5).setDepth((style.depth || 100) + 1);

        // Interactive hit zone
        var hitZone = this.add.zone(x, y, w, h)
            .setInteractive({ useHandCursor: true })
            .setDepth((style.depth || 100) + 2);

        // Hover / touch effects
        hitZone.on('pointerover', function () {
            drawButton(style.fillColorHover);
            self.tweens.add({
                targets: [text],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100,
                ease: 'Quad.easeOut'
            });
        });

        hitZone.on('pointerout', function () {
            drawButton(style.fillColor);
            self.tweens.add({
                targets: [text],
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 100,
                ease: 'Quad.easeOut'
            });
        });

        hitZone.on('pointerdown', function () {
            // Press effect: quick scale bounce
            self.tweens.add({
                targets: [text],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 60,
                yoyo: true,
                ease: 'Quad.easeIn'
            });

            // Play click sound
            self._playSfx(Constants.AUDIO_KEYS.SFX_CLICK);

            // Fire callback
            if (callback) callback();
        });

        return { gfx: gfx, text: text, hitZone: hitZone, drawButton: drawButton };
    }

    // ==================================================
    // START GAME
    // ==================================================
    _onStartGame(C) {
        var self = this;
        var tutorialSeen = false;

        try {
            tutorialSeen = localStorage.getItem(C.STORAGE.TUTORIAL_SEEN) === 'true';
        } catch (e) {
            // localStorage may not be available
        }

        this._stopMenuMusic();
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', function () {
            if (!tutorialSeen) {
                self.scene.start(C.SCENES.TUTORIAL);
            } else {
                self.scene.start(C.SCENES.GAME);
            }
        });
    }

    // ==================================================
    // INFO AREA (bottom of screen)
    // ==================================================
    _createInfoArea(W, H, C) {
        var self = this;
        var bottomY = H * 0.88;

        // Read high score and highest level from localStorage
        var highScore = 0;
        var highestLevel = 1;
        var soundEnabled = true;
        var musicEnabled = true;

        try {
            highScore = parseInt(localStorage.getItem(C.STORAGE.HIGH_SCORE), 10) || 0;
            highestLevel = parseInt(localStorage.getItem(C.STORAGE.HIGHEST_LEVEL), 10) || 1;
            soundEnabled = localStorage.getItem(C.STORAGE.SOUND_ENABLED) !== 'false';
            musicEnabled = localStorage.getItem(C.STORAGE.MUSIC_ENABLED) !== 'false';
        } catch (e) {
            // localStorage unavailable
        }

        // Record holder name
        var recordName = '';
        try { recordName = localStorage.getItem('ff_record_name') || ''; } catch (e) {}
        var highScoreDisplay = '최고 점수: ' + highScore.toLocaleString();
        if (recordName && highScore > 0) {
            highScoreDisplay += ' (' + recordName + ')';
        }

        // High score display
        this.add.text(W / 2, bottomY - 20, highScoreDisplay, {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '22px',
            color: '#FFD700',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 4,
                fill: true
            }
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.HUD);

        // Highest level
        this.add.text(W / 2, bottomY + 10, '최고 레벨: ' + highestLevel, {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '18px',
            color: '#aaddff',
            align: 'center',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 3,
                fill: true
            }
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.HUD);

        // --- Bottom icon row ---
        var iconY = bottomY + 45;
        var iconSpacing = 70;
        var iconsStartX = W / 2 - iconSpacing;

        // Sound toggle
        this._soundEnabled = soundEnabled;
        this._soundIcon = this._createToggleIcon(
            iconsStartX, iconY, 24,
            soundEnabled,
            function (gfx, on) { self._drawSpeakerIcon(gfx, 24, on); },
            function (newState) {
                self._soundEnabled = newState;
                try { localStorage.setItem(C.STORAGE.SOUND_ENABLED, newState ? 'true' : 'false'); } catch (e) {}
                // Update sound system
                var ss = self._getSoundSystem();
                if (ss && typeof ss.setSoundEnabled === 'function') {
                    ss.setSoundEnabled(newState);
                }
            },
            C
        );

        // Music toggle
        this._musicEnabled = musicEnabled;
        this._musicIcon = this._createToggleIcon(
            iconsStartX + iconSpacing, iconY, 24,
            musicEnabled,
            function (gfx, on) { self._drawMusicIcon(gfx, 24, on); },
            function (newState) {
                self._musicEnabled = newState;
                try { localStorage.setItem(C.STORAGE.MUSIC_ENABLED, newState ? 'true' : 'false'); } catch (e) {}
                var ss = self._getSoundSystem();
                if (ss && typeof ss.setMusicEnabled === 'function') {
                    ss.setMusicEnabled(newState);
                }
                if (newState) {
                    self._playMenuMusic(C);
                } else {
                    self._stopMenuMusic();
                }
            },
            C
        );

        // Fullscreen button
        this._createToggleIcon(
            iconsStartX + iconSpacing * 2, iconY, 24,
            true,
            function (gfx) { self._drawFullscreenIcon(gfx, 24); },
            function () {
                if (window.requestGameFullscreen) {
                    window.requestGameFullscreen();
                }
            },
            C
        );
    }

    /**
     * Create a small toggle icon button.
     */
    _createToggleIcon(x, y, size, initialState, drawFn, onToggle, C) {
        var gfx = this.add.graphics().setDepth(C.DEPTH.HUD + 5);
        var state = initialState;

        var redraw = function () {
            gfx.clear();
            drawFn(gfx, state);
        };
        redraw();
        gfx.setPosition(x, y);

        // Hit zone
        var zone = this.add.zone(x, y, size * 2.5, size * 2.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(C.DEPTH.HUD + 6);

        zone.on('pointerdown', function () {
            state = !state;
            redraw();
            if (onToggle) onToggle(state);
        });

        zone.on('pointerover', function () {
            gfx.setAlpha(0.7);
        });

        zone.on('pointerout', function () {
            gfx.setAlpha(1.0);
        });

        return { gfx: gfx, zone: zone, getState: function () { return state; } };
    }

    // ==================================================
    // ICON DRAWING HELPERS
    // ==================================================
    _drawSpeakerIcon(gfx, size, on) {
        var s = size;
        var color = on ? 0xffffff : 0x666666;

        // Speaker body
        gfx.fillStyle(color, 1);
        gfx.fillRect(-s * 0.3, -s * 0.2, s * 0.25, s * 0.4);

        // Speaker cone
        gfx.fillTriangle(
            -s * 0.1, -s * 0.4,
            -s * 0.1, s * 0.4,
            s * 0.25, 0
        );

        if (on) {
            // Sound waves
            gfx.lineStyle(2, color, 0.7);
            gfx.beginPath();
            gfx.arc(s * 0.2, 0, s * 0.25, -Math.PI / 4, Math.PI / 4);
            gfx.strokePath();
            gfx.beginPath();
            gfx.arc(s * 0.2, 0, s * 0.4, -Math.PI / 4, Math.PI / 4);
            gfx.strokePath();
        } else {
            // X mark for muted
            gfx.lineStyle(3, 0xff4444, 1);
            gfx.lineBetween(-s * 0.5, -s * 0.5, s * 0.5, s * 0.5);
            gfx.lineBetween(s * 0.5, -s * 0.5, -s * 0.5, s * 0.5);
        }
    }

    _drawMusicIcon(gfx, size, on) {
        var s = size;
        var color = on ? 0xffffff : 0x666666;

        // Note stem
        gfx.lineStyle(3, color, 1);
        gfx.lineBetween(s * 0.15, -s * 0.4, s * 0.15, s * 0.2);

        // Note head
        gfx.fillStyle(color, 1);
        gfx.fillEllipse(0, s * 0.25, s * 0.3, s * 0.2);

        // Flag
        gfx.lineStyle(2, color, 1);
        gfx.beginPath();
        gfx.arc(s * 0.35, -s * 0.2, s * 0.2, -Math.PI / 2, Math.PI / 4);
        gfx.strokePath();

        if (!on) {
            gfx.lineStyle(3, 0xff4444, 1);
            gfx.lineBetween(-s * 0.5, -s * 0.5, s * 0.5, s * 0.5);
            gfx.lineBetween(s * 0.5, -s * 0.5, -s * 0.5, s * 0.5);
        }
    }

    _drawFullscreenIcon(gfx, size) {
        var s = size;
        var color = 0xffffff;
        gfx.lineStyle(2.5, color, 0.9);

        // Top-left corner
        gfx.lineBetween(-s * 0.4, -s * 0.2, -s * 0.4, -s * 0.4);
        gfx.lineBetween(-s * 0.4, -s * 0.4, -s * 0.2, -s * 0.4);

        // Top-right corner
        gfx.lineBetween(s * 0.2, -s * 0.4, s * 0.4, -s * 0.4);
        gfx.lineBetween(s * 0.4, -s * 0.4, s * 0.4, -s * 0.2);

        // Bottom-left corner
        gfx.lineBetween(-s * 0.4, s * 0.2, -s * 0.4, s * 0.4);
        gfx.lineBetween(-s * 0.4, s * 0.4, -s * 0.2, s * 0.4);

        // Bottom-right corner
        gfx.lineBetween(s * 0.2, s * 0.4, s * 0.4, s * 0.4);
        gfx.lineBetween(s * 0.4, s * 0.4, s * 0.4, s * 0.2);
    }

    // ==================================================
    // SETTINGS PANEL (overlay)
    // ==================================================
    _toggleSettings(W, H, C) {
        if (this._settingsOpen) {
            this._closeSettings();
            return;
        }
        this._openSettings(W, H, C);
    }

    _openSettings(W, H, C) {
        var self = this;
        this._settingsOpen = true;

        var panelW = 420;
        var panelH = 340;
        var panelX = (W - panelW) / 2;
        var panelY = (H - panelH) / 2;

        // Container for all settings elements
        this._settingsElements = [];

        // Dimmed backdrop
        var backdrop = this.add.graphics().setDepth(C.DEPTH.OVERLAY - 1);
        backdrop.fillStyle(0x000000, 0.55);
        backdrop.fillRect(0, 0, W, H);
        this._settingsElements.push(backdrop);

        var backdropZone = this.add.zone(W / 2, H / 2, W, H)
            .setInteractive()
            .setDepth(C.DEPTH.OVERLAY - 1);
        this._settingsElements.push(backdropZone);

        // Panel background
        var panel = this.add.graphics().setDepth(C.DEPTH.OVERLAY);
        panel.fillStyle(0x1a3a5c, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
        panel.lineStyle(2, 0x4488aa, 1);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);
        this._settingsElements.push(panel);

        // Title
        var settingsTitle = this.add.text(W / 2, panelY + 40, '설정', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5).setDepth(C.DEPTH.OVERLAY + 1);
        this._settingsElements.push(settingsTitle);

        // Divider line
        var divider = this.add.graphics().setDepth(C.DEPTH.OVERLAY + 1);
        divider.lineStyle(1, 0x4488aa, 0.5);
        divider.lineBetween(panelX + 30, panelY + 65, panelX + panelW - 30, panelY + 65);
        this._settingsElements.push(divider);

        // Read current states
        var soundOn = this._soundEnabled;
        var musicOn = this._musicEnabled;

        // --- Sound toggle row ---
        var rowY1 = panelY + 110;
        var labelX = panelX + 50;
        var toggleX = panelX + panelW - 90;

        var soundLabel = this.add.text(labelX, rowY1, '소리 (Sound)', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '24px',
            color: '#ccddee',
            align: 'left'
        }).setOrigin(0, 0.5).setDepth(C.DEPTH.OVERLAY + 1);
        this._settingsElements.push(soundLabel);

        var soundToggle = this._createSettingsToggle(toggleX, rowY1, soundOn, function (newState) {
            self._soundEnabled = newState;
            try { localStorage.setItem(C.STORAGE.SOUND_ENABLED, newState ? 'true' : 'false'); } catch (e) {}
            var ss = self._getSoundSystem();
            if (ss && typeof ss.setSoundEnabled === 'function') ss.setSoundEnabled(newState);
        }, C);
        this._settingsElements.push(soundToggle.bg);
        this._settingsElements.push(soundToggle.knob);
        this._settingsElements.push(soundToggle.zone);

        // --- Music toggle row ---
        var rowY2 = panelY + 170;
        var musicLabel = this.add.text(labelX, rowY2, '음악 (Music)', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '24px',
            color: '#ccddee',
            align: 'left'
        }).setOrigin(0, 0.5).setDepth(C.DEPTH.OVERLAY + 1);
        this._settingsElements.push(musicLabel);

        var musicToggle = this._createSettingsToggle(toggleX, rowY2, musicOn, function (newState) {
            self._musicEnabled = newState;
            try { localStorage.setItem(C.STORAGE.MUSIC_ENABLED, newState ? 'true' : 'false'); } catch (e) {}
            var ss = self._getSoundSystem();
            if (ss && typeof ss.setMusicEnabled === 'function') ss.setMusicEnabled(newState);
            if (newState) {
                self._playMenuMusic(C);
            } else {
                self._stopMenuMusic();
            }
        }, C);
        this._settingsElements.push(musicToggle.bg);
        this._settingsElements.push(musicToggle.knob);
        this._settingsElements.push(musicToggle.zone);

        // --- Fullscreen button ---
        var fsBtn = this._createButton(W / 2, panelY + 235, 200, 50, '전체화면', {
            fontSize: '22px',
            fillColor: 0x37474F,
            fillColorHover: 0x546E7A,
            strokeColor: 0x263238,
            textColor: '#ffffff',
            depth: C.DEPTH.OVERLAY + 1
        }, function () {
            if (window.requestGameFullscreen) window.requestGameFullscreen();
        });
        this._settingsElements.push(fsBtn.gfx);
        this._settingsElements.push(fsBtn.text);
        this._settingsElements.push(fsBtn.hitZone);

        // --- Close button ---
        var closeBtn = this._createButton(W / 2, panelY + panelH - 45, 160, 45, '닫기', {
            fontSize: '22px',
            fillColor: 0x8B0000,
            fillColorHover: 0xB71C1C,
            strokeColor: 0x5C0000,
            textColor: '#ffffff',
            depth: C.DEPTH.OVERLAY + 1
        }, function () {
            self._closeSettings();
        });
        this._settingsElements.push(closeBtn.gfx);
        this._settingsElements.push(closeBtn.text);
        this._settingsElements.push(closeBtn.hitZone);
    }

    /**
     * Create a slide toggle for settings panel.
     */
    _createSettingsToggle(x, y, initialState, onChange, C) {
        var state = initialState;
        var trackW = 60;
        var trackH = 28;
        var knobR = 11;

        var bg = this.add.graphics().setDepth(C.DEPTH.OVERLAY + 2);
        var knob = this.add.graphics().setDepth(C.DEPTH.OVERLAY + 3);

        var drawToggle = function () {
            bg.clear();
            knob.clear();

            // Track
            var trackColor = state ? 0x43A047 : 0x555555;
            bg.fillStyle(trackColor, 1);
            bg.fillRoundedRect(x - trackW / 2, y - trackH / 2, trackW, trackH, trackH / 2);
            bg.lineStyle(1.5, state ? 0x2E7D32 : 0x333333, 1);
            bg.strokeRoundedRect(x - trackW / 2, y - trackH / 2, trackW, trackH, trackH / 2);

            // Knob
            var knobX = state ? x + trackW / 2 - knobR - 3 : x - trackW / 2 + knobR + 3;
            knob.fillStyle(0xffffff, 1);
            knob.fillCircle(knobX, y, knobR);
            knob.lineStyle(1, 0xcccccc, 0.5);
            knob.strokeCircle(knobX, y, knobR);
        };

        drawToggle();

        var zone = this.add.zone(x, y, trackW + 10, trackH + 10)
            .setInteractive({ useHandCursor: true })
            .setDepth(C.DEPTH.OVERLAY + 4);

        zone.on('pointerdown', function () {
            state = !state;
            drawToggle();
            if (onChange) onChange(state);
        });

        return { bg: bg, knob: knob, zone: zone };
    }

    _closeSettings() {
        this._settingsOpen = false;
        if (this._settingsElements) {
            for (var i = 0; i < this._settingsElements.length; i++) {
                var el = this._settingsElements[i];
                if (el && typeof el.destroy === 'function') {
                    el.destroy();
                }
            }
            this._settingsElements = [];
        }
    }

    // ==================================================
    // SOUND / MUSIC
    // ==================================================
    _getSoundSystem() {
        // Try registry first, then window
        var ss = this.game.registry.get('soundSystem');
        if (!ss) ss = window.soundSystem;
        // Fallback: create if missing
        if (!ss && window.SoundSystem) {
            ss = new window.SoundSystem(this);
            this.game.registry.set('soundSystem', ss);
        }
        return ss || null;
    }

    _playSfx(key) {
        var ss = this._getSoundSystem();
        if (ss && typeof ss.play === 'function' && this._soundEnabled) {
            try { ss.play(key); } catch (e) {}
        }
    }

    _playMenuMusic(C) {
        if (!this._musicEnabled) return;

        var ss = this._getSoundSystem();
        if (ss && typeof ss.playBGM === 'function') {
            try {
                ss.playBGM(C.AUDIO_KEYS.BGM_MENU);
            } catch (e) {
                // SoundSystem may not be ready yet
            }
        }
    }

    _stopMenuMusic() {
        var ss = this._getSoundSystem();
        if (ss && typeof ss.stopBGM === 'function') {
            try { ss.stopBGM(); } catch (e) {}
        }
    }

    // ==================================================
    // CLEANUP
    // ==================================================
    shutdown() {
        this._closeSettings();
        this._stopMenuMusic();
    }
};
