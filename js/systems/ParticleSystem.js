/**
 * ParticleSystem.js - Visual Particle Effects
 * Feeding Frenzy - Fish Feeding Game
 *
 * Provides burst and continuous particle effects for all game events:
 * eating, growing, frenzy, death, power-ups, level clear, and ambient bubbles.
 * Uses Phaser 3's built-in particle system with 'particle_circle' and
 * 'particle_star' textures generated in BootScene.
 */

window.ParticleSystem = class ParticleSystem {

    /**
     * @param {Phaser.Scene} scene - The game scene that owns this system.
     */
    constructor(scene) {
        this.scene = scene;

        // ---- Emitter references for cleanup ----
        this.emitters         = [];
        this.frenzyEmitter    = null;
        this.frenzyBgEmitter  = null;

        // ---- Ensure fallback textures exist ----
        this._ensureTextures();
    }

    // ------------------------------------------------------------------
    // PUBLIC API - BURST EFFECTS
    // ------------------------------------------------------------------

    /**
     * Small burst of coloured particles at the eat position.
     * @param {number} x     - World X.
     * @param {number} y     - World Y.
     * @param {number} color - Tint colour (hex integer, e.g. 0xFF6B35).
     */
    emitEatParticles(x, y, color) {
        var emitter = this._createEmitter('particle_circle', {
            x: x,
            y: y,
            speed:     { min: 60, max: 160 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.5, end: 0 },
            alpha:     { start: 1, end: 0 },
            lifespan:  350,
            gravityY:  80,
            tint:      color || 0xFFFFFF,
            quantity:  Phaser.Math.Between(8, 12),
            emitting:  false
        });

        if (emitter) {
            emitter.explode(Phaser.Math.Between(8, 12), x, y);
            this._autoDestroy(emitter, 500);
        }
    }

    /**
     * Larger burst with stars for eating a bigger fish.
     * @param {number} x - World X.
     * @param {number} y - World Y.
     */
    emitBigEatParticles(x, y) {
        // Circle burst
        var circleEmitter = this._createEmitter('particle_circle', {
            x: x,
            y: y,
            speed:     { min: 100, max: 250 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.7, end: 0 },
            alpha:     { start: 1, end: 0 },
            lifespan:  500,
            gravityY:  60,
            tint:      0xFFD700,
            quantity:  16,
            emitting:  false
        });
        if (circleEmitter) {
            circleEmitter.explode(16, x, y);
            this._autoDestroy(circleEmitter, 650);
        }

        // Star sparkles
        var starEmitter = this._createEmitter('particle_star', {
            x: x,
            y: y,
            speed:     { min: 40, max: 140 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.6, end: 0 },
            alpha:     { start: 1, end: 0 },
            rotate:    { min: 0, max: 360 },
            lifespan:  600,
            gravityY:  30,
            tint:      0xFFF176,
            quantity:  8,
            emitting:  false
        });
        if (starEmitter) {
            starEmitter.explode(8, x, y);
            this._autoDestroy(starEmitter, 750);
        }
    }

    /**
     * Golden ring expanding outward + upward sparkle trail when the player grows.
     * @param {number} x - World X.
     * @param {number} y - World Y.
     */
    emitGrowParticles(x, y) {
        // Expanding ring
        var ringEmitter = this._createEmitter('particle_circle', {
            x: x,
            y: y,
            speed:     { min: 80, max: 200 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.6, end: 0.1 },
            alpha:     { start: 1, end: 0 },
            lifespan:  600,
            gravityY:  -20,
            tint:      0xFFD700,
            quantity:  20,
            emitting:  false
        });
        if (ringEmitter) {
            ringEmitter.explode(20, x, y);
            this._autoDestroy(ringEmitter, 800);
        }

        // Upward sparkle trail
        var sparkleEmitter = this._createEmitter('particle_star', {
            x: x,
            y: y,
            speed:     { min: 60, max: 150 },
            angle:     { min: 240, max: 300 },
            scale:     { start: 0.5, end: 0 },
            alpha:     { start: 1, end: 0 },
            rotate:    { min: 0, max: 360 },
            lifespan:  700,
            gravityY:  -40,
            tint:      [0xFFD700, 0xFFF176, 0xFFAB00],
            quantity:  12,
            emitting:  false
        });
        if (sparkleEmitter) {
            sparkleEmitter.explode(12, x, y);
            this._autoDestroy(sparkleEmitter, 900);
        }
    }

    /**
     * Continuous sparkle around the player during frenzy.
     * Intensity and colour scale with the tier.
     * @param {number} x    - World X (updated every frame externally).
     * @param {number} y    - World Y.
     * @param {number} tier - Frenzy tier (1-4).
     */
    emitFrenzyParticles(x, y, tier) {
        // Stop any previous frenzy emitter
        this.stopFrenzyParticles();

        var count  = 2 + tier * 2;   // 4 / 6 / 8 / 10 particles per emit
        var colors = [0xFFD700, 0xFF8C00, 0xFF4500, 0xFF0000];
        var color  = colors[Math.min(tier - 1, colors.length - 1)];

        this.frenzyEmitter = this._createEmitter('particle_star', {
            x: x,
            y: y,
            speed:     { min: 20, max: 80 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.4, end: 0 },
            alpha:     { start: 0.8, end: 0 },
            rotate:    { min: 0, max: 360 },
            lifespan:  400,
            gravityY:  -10,
            tint:      color,
            frequency: 80,
            quantity:  count
        });
    }

    /**
     * Update the frenzy emitter position to follow the player.
     * @param {number} x - Player world X.
     * @param {number} y - Player world Y.
     */
    updateFrenzyPosition(x, y) {
        if (this.frenzyEmitter) {
            this.frenzyEmitter.setPosition(x, y);
        }
    }

    /**
     * Stop the per-player frenzy emitter.
     */
    stopFrenzyParticles() {
        if (this.frenzyEmitter) {
            this.frenzyEmitter.stop();
            var em = this.frenzyEmitter;
            this.scene.time.delayedCall(500, function () {
                em.destroy();
            });
            this.frenzyEmitter = null;
        }
    }

    /**
     * Small sad poof when the player is hit or dies.
     * @param {number} x - World X.
     * @param {number} y - World Y.
     */
    emitDeathParticles(x, y) {
        var emitter = this._createEmitter('particle_circle', {
            x: x,
            y: y,
            speed:     { min: 30, max: 90 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.35, end: 0 },
            alpha:     { start: 0.7, end: 0 },
            lifespan:  450,
            gravityY:  100,
            tint:      0xCCCCCC,
            quantity:  10,
            emitting:  false
        });
        if (emitter) {
            emitter.explode(10, x, y);
            this._autoDestroy(emitter, 600);
        }
    }

    /**
     * Spiral / ray pattern in the power-up's colour.
     * @param {number} x     - World X.
     * @param {number} y     - World Y.
     * @param {number} color - Tint colour (hex integer).
     */
    emitPowerUpParticles(x, y, color) {
        // Radial ray burst
        var rayEmitter = this._createEmitter('particle_star', {
            x: x,
            y: y,
            speed:     { min: 80, max: 220 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.6, end: 0 },
            alpha:     { start: 1, end: 0 },
            rotate:    { min: -180, max: 180 },
            lifespan:  500,
            gravityY:  0,
            tint:      color || 0x00E5FF,
            quantity:  14,
            emitting:  false
        });
        if (rayEmitter) {
            rayEmitter.explode(14, x, y);
            this._autoDestroy(rayEmitter, 650);
        }

        // Inner circle
        var innerEmitter = this._createEmitter('particle_circle', {
            x: x,
            y: y,
            speed:     { min: 20, max: 60 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.4, end: 0.1 },
            alpha:     { start: 0.9, end: 0 },
            lifespan:  400,
            gravityY:  0,
            tint:      0xFFFFFF,
            quantity:  6,
            emitting:  false
        });
        if (innerEmitter) {
            innerEmitter.explode(6, x, y);
            this._autoDestroy(innerEmitter, 550);
        }
    }

    /**
     * Full-screen celebration when a level is cleared.
     * Confetti-like coloured particles falling from the top.
     */
    emitLevelClearParticles() {
        var C = window.Constants;
        var confettiColors = [0xFF6B35, 0x2196F3, 0xE91E63, 0x4CAF50, 0xFFC107, 0x9C27B0];

        var emitter = this._createEmitter('particle_circle', {
            x:         { min: 0, max: C.GAME_WIDTH },
            y:         -20,
            speed:     { min: 40, max: 120 },
            angle:     { min: 75, max: 105 },
            scale:     { start: 0.5, end: 0.2 },
            alpha:     { start: 1, end: 0.3 },
            rotate:    { min: -180, max: 180 },
            lifespan:  2500,
            gravityY:  80,
            tint:      confettiColors,
            frequency: 30,
            quantity:  4
        });

        // Star confetti too
        var starEmitter = this._createEmitter('particle_star', {
            x:         { min: 0, max: C.GAME_WIDTH },
            y:         -20,
            speed:     { min: 30, max: 100 },
            angle:     { min: 75, max: 105 },
            scale:     { start: 0.5, end: 0.15 },
            alpha:     { start: 1, end: 0.2 },
            rotate:    { min: -180, max: 180 },
            lifespan:  2800,
            gravityY:  60,
            tint:      [0xFFD700, 0xFFF176],
            frequency: 60,
            quantity:  2
        });

        // Auto-stop after 3 seconds
        var self = this;
        this.scene.time.delayedCall(3000, function () {
            if (emitter) {
                emitter.stop();
                self._autoDestroy(emitter, 3000);
            }
            if (starEmitter) {
                starEmitter.stop();
                self._autoDestroy(starEmitter, 3000);
            }
        });
    }

    /**
     * Small bubble particles trailing behind the moving player.
     * @param {number} x - World X (behind the fish).
     * @param {number} y - World Y.
     */
    emitBubbleTrail(x, y) {
        var emitter = this._createEmitter('particle_circle', {
            x: x,
            y: y,
            speed:     { min: 10, max: 40 },
            angle:     { min: 250, max: 290 },
            scale:     { start: 0.25, end: 0.05 },
            alpha:     { start: 0.5, end: 0 },
            lifespan:  500,
            gravityY:  -30,
            tint:      0xBBDEFB,
            quantity:  Phaser.Math.Between(1, 3),
            emitting:  false
        });
        if (emitter) {
            emitter.explode(Phaser.Math.Between(1, 3), x, y);
            this._autoDestroy(emitter, 600);
        }
    }

    // ------------------------------------------------------------------
    // PUBLIC API - AMBIENT / CONTINUOUS
    // ------------------------------------------------------------------

    /**
     * Start ambient screen-wide sparkle during frenzy.
     * Intensity increases with tier.
     * @param {number} tier - Frenzy tier (1-4).
     */
    startFrenzyBackground(tier) {
        this.stopFrenzyBackground();

        var C = window.Constants;
        var colors = [0xFFD700, 0xFF8C00, 0xFF4500, 0xFF0000];
        var color  = colors[Math.min(tier - 1, colors.length - 1)];
        var freq   = Math.max(200 - tier * 40, 60);

        this.frenzyBgEmitter = this._createEmitter('particle_star', {
            x:         { min: 0, max: C.GAME_WIDTH },
            y:         { min: 0, max: C.GAME_HEIGHT },
            speed:     { min: 5, max: 30 },
            angle:     { min: 0, max: 360 },
            scale:     { start: 0.3, end: 0 },
            alpha:     { start: 0.4, end: 0 },
            rotate:    { min: 0, max: 360 },
            lifespan:  800,
            gravityY:  0,
            tint:      color,
            frequency: freq,
            quantity:  1 + tier
        });
    }

    /**
     * Stop the ambient frenzy background sparkle.
     */
    stopFrenzyBackground() {
        if (this.frenzyBgEmitter) {
            this.frenzyBgEmitter.stop();
            var em = this.frenzyBgEmitter;
            this.scene.time.delayedCall(1000, function () {
                em.destroy();
            });
            this.frenzyBgEmitter = null;
        }
    }

    // ------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------

    /**
     * Destroy all tracked emitters and release references.
     */
    destroy() {
        this.stopFrenzyParticles();
        this.stopFrenzyBackground();

        for (var i = 0; i < this.emitters.length; i++) {
            try {
                if (this.emitters[i] && this.emitters[i].destroy) {
                    this.emitters[i].destroy();
                }
            } catch (e) {
                // Emitter may already be destroyed by the scene
            }
        }
        this.emitters = [];
        this.scene = null;
    }

    // ------------------------------------------------------------------
    // PRIVATE HELPERS
    // ------------------------------------------------------------------

    /**
     * Create a particle emitter and track it for cleanup.
     * @private
     * @param {string} texture - Texture key ('particle_circle' or 'particle_star').
     * @param {object} config  - Phaser particle emitter config.
     * @returns {Phaser.GameObjects.Particles.ParticleEmitter|null}
     */
    _createEmitter(texture, config) {
        var C = window.Constants;

        try {
            var emitter = this.scene.add.particles(0, 0, texture, config);
            emitter.setDepth(C.DEPTH.PARTICLES);
            this.emitters.push(emitter);
            return emitter;
        } catch (e) {
            // Texture may not exist yet; fail silently
            return null;
        }
    }

    /**
     * Schedule an emitter for destruction after a delay.
     * @private
     * @param {Phaser.GameObjects.Particles.ParticleEmitter} emitter
     * @param {number} delayMs
     */
    _autoDestroy(emitter, delayMs) {
        var self = this;
        this.scene.time.delayedCall(delayMs, function () {
            var idx = self.emitters.indexOf(emitter);
            if (idx !== -1) {
                self.emitters.splice(idx, 1);
            }
            try {
                emitter.destroy();
            } catch (e) {
                // Already destroyed
            }
        });
    }

    /**
     * Generate fallback particle textures if they don't already exist.
     * These are tiny programmatic textures (circle and star shapes).
     * @private
     */
    _ensureTextures() {
        var scene = this.scene;

        // ---- Circle ----
        if (!scene.textures.exists('particle_circle')) {
            var circleGfx = scene.make.graphics({ add: false });
            circleGfx.fillStyle(0xFFFFFF, 1);
            circleGfx.fillCircle(8, 8, 8);
            circleGfx.generateTexture('particle_circle', 16, 16);
            circleGfx.destroy();
        }

        // ---- Star ----
        if (!scene.textures.exists('particle_star')) {
            var starGfx = scene.make.graphics({ add: false });
            starGfx.fillStyle(0xFFFFFF, 1);
            // Draw a simple 4-point star
            starGfx.beginPath();
            var cx = 10, cy = 10, outerR = 10, innerR = 4;
            var points = 4;
            for (var i = 0; i < points * 2; i++) {
                var radius = (i % 2 === 0) ? outerR : innerR;
                var angle  = (i * Math.PI / points) - Math.PI / 2;
                var px     = cx + Math.cos(angle) * radius;
                var py     = cy + Math.sin(angle) * radius;
                if (i === 0) {
                    starGfx.moveTo(px, py);
                } else {
                    starGfx.lineTo(px, py);
                }
            }
            starGfx.closePath();
            starGfx.fillPath();
            starGfx.generateTexture('particle_star', 20, 20);
            starGfx.destroy();
        }
    }
};
