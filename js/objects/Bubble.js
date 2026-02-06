/**
 * Bubble.js - Decorative Background Bubbles
 * Feeding Frenzy - Fish Feeding Game
 *
 * Purely cosmetic background elements. Bubbles float upward with
 * slight horizontal wobble, creating an underwater atmosphere.
 * When they reach the top of the screen, they wrap to the bottom
 * with a new random x position. Uses Phaser.GameObjects.Sprite
 * (no physics body needed for decoration).
 */

window.Bubble = class Bubble extends Phaser.GameObjects.Sprite {

    /**
     * @param {Phaser.Scene} scene - The scene this bubble belongs to
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     * @param {number} [themeTint] - Optional theme-based tint color (hex)
     */
    constructor(scene, x, y, themeTint) {
        super(scene, x, y, 'bubble');

        // Add to scene
        scene.add.existing(this);

        var C = window.Constants;

        // Store theme tint for later use in resets
        this._themeTint = themeTint || null;

        // ---- Random Size ----
        var sizeRange = C.BUBBLE_MAX_SIZE - C.BUBBLE_MIN_SIZE;
        this._bubbleSize = C.BUBBLE_MIN_SIZE + Math.random() * sizeRange;

        // Scale relative to the bubble texture (assume base texture ~16px)
        var pixelScale = this._bubbleSize / 16;
        this.setScale(pixelScale);

        // ---- Float Speed ----
        var speedRange = C.BUBBLE_MAX_SPEED - C.BUBBLE_MIN_SPEED;
        this.floatSpeed = C.BUBBLE_MIN_SPEED + Math.random() * speedRange;

        // ---- Wobble ----
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.8 + Math.random() * 1.2;
        this._wobbleAmount = 10 + Math.random() * 15; // px horizontal sway
        this._wobbleTime = this.wobbleOffset;
        this._baseX = x;

        // ---- Visual Setup ----
        this.setDepth(C.DEPTH.BUBBLES);

        // Alpha with slight per-bubble variation
        var alphaVariation = (Math.random() - 0.5) * 0.15;
        this.setAlpha(Phaser.Math.Clamp(C.BUBBLE_ALPHA + alphaVariation, 0.1, 0.5));

        // Apply theme tint if provided, otherwise use default variations
        if (this._themeTint) {
            this.setTint(this._themeTint);
        } else {
            var tintOptions = [0xFFFFFF, 0xCCEEFF, 0xAADDFF, 0xDDFFFF];
            this.setTint(tintOptions[Math.floor(Math.random() * tintOptions.length)]);
        }
    }

    /**
     * Called every frame.
     * @param {number} time - Total elapsed time in ms
     * @param {number} delta - Time since last frame in ms
     */
    update(time, delta) {
        if (!this.active) return;

        var C = window.Constants;
        var deltaSeconds = delta / 1000;

        // ---- Float Upward ----
        this.y -= this.floatSpeed * deltaSeconds;

        // ---- Horizontal Wobble ----
        this._wobbleTime += this.wobbleSpeed * deltaSeconds;
        this.x = this._baseX + Math.sin(this._wobbleTime) * this._wobbleAmount;

        // ---- Wrap to Bottom ----
        // When bubble reaches past the top of screen, reset to below bottom
        if (this.y < -this._bubbleSize * 2) {
            this._resetToBottom();
        }
    }

    /**
     * Reset bubble to the bottom of the screen with new random properties.
     */
    _resetToBottom() {
        var C = window.Constants;

        // New random x position
        this._baseX = Math.random() * C.GAME_WIDTH;
        this.x = this._baseX;

        // Place just below the visible area
        this.y = C.GAME_HEIGHT + this._bubbleSize + Math.random() * 40;

        // Slightly vary speed on each cycle for natural feel
        var speedRange = C.BUBBLE_MAX_SPEED - C.BUBBLE_MIN_SPEED;
        this.floatSpeed = C.BUBBLE_MIN_SPEED + Math.random() * speedRange;

        // Randomize wobble phase
        this._wobbleTime = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.8 + Math.random() * 1.2;
        this._wobbleAmount = 10 + Math.random() * 15;

        // Slight size variation on respawn
        var sizeRange = C.BUBBLE_MAX_SIZE - C.BUBBLE_MIN_SIZE;
        this._bubbleSize = C.BUBBLE_MIN_SIZE + Math.random() * sizeRange;
        var pixelScale = this._bubbleSize / 16;
        this.setScale(pixelScale);

        // Refresh alpha variation
        var alphaVariation = (Math.random() - 0.5) * 0.15;
        this.setAlpha(Phaser.Math.Clamp(C.BUBBLE_ALPHA + alphaVariation, 0.1, 0.5));
    }
};
