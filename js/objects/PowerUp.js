/**
 * PowerUp.js - Collectible Power-Up Items
 * Feeding Frenzy - Fish Feeding Game
 *
 * Power-ups float through the scene with a bobbing animation and
 * subtle glow pulse. When collected, they play a satisfying scale-up
 * and fade-out animation before deactivating for pool reuse.
 * Types: SPEED, SHIELD, MAGNET, GROW
 */

window.PowerUp = class PowerUp extends Phaser.Physics.Arcade.Sprite {

    /**
     * @param {Phaser.Scene} scene - The scene this power-up belongs to
     * @param {number} x - Spawn x position
     * @param {number} y - Spawn y position
     * @param {string} type - One of Constants.POWER_UP_TYPES values
     */
    constructor(scene, x, y, type) {
        var textureKey = 'powerup_' + type;
        super(scene, x, y, textureKey);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        var C = window.Constants;

        // ---- Properties ----
        this.powerUpType = type;
        this.collected = false;

        // ---- Bob Animation State ----
        this.bobOffset = Math.random() * Math.PI * 2; // Random start phase
        this._baseY = y;
        this._bobTime = this.bobOffset;

        // ---- Drift Movement ----
        this._driftSpeed = 25 + Math.random() * 20;   // Slow horizontal drift
        this._driftDirection = Math.random() < 0.5 ? -1 : 1;

        // ---- Visual Setup ----
        this.setDepth(C.DEPTH.POWER_UPS);
        this.setScale(0.8);

        // Body setup
        this.body.setSize(this.width * 0.8, this.height * 0.8);
        this.body.setOffset(this.width * 0.1, this.height * 0.1);

        // ---- Glow Pulse Tween ----
        this._glowTween = scene.tweens.add({
            targets: this,
            alpha: { from: 0.75, to: 1.0 },
            scaleX: { from: 0.75, to: 0.85 },
            scaleY: { from: 0.75, to: 0.85 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Apply a color tint matching the power-up type
        if (C.POWER_UP_COLORS[type]) {
            this.setTint(C.POWER_UP_COLORS[type]);
        }
    }

    /**
     * Called every frame.
     * @param {number} time - Total elapsed time in ms
     * @param {number} delta - Time since last frame in ms
     */
    update(time, delta) {
        if (!this.active || this.collected) return;

        var C = window.Constants;
        var deltaSeconds = delta / 1000;

        // ---- Bob Animation ----
        this._bobTime += C.POWER_UP_BOB_SPEED * deltaSeconds;
        this.y = this._baseY + Math.sin(this._bobTime) * C.POWER_UP_BOB_AMOUNT;

        // ---- Slow Rotation ----
        this.angle += 15 * deltaSeconds; // ~15 degrees per second

        // ---- Horizontal Drift ----
        this.x += this._driftDirection * this._driftSpeed * deltaSeconds;

        // ---- Offscreen Check ----
        if (this._isOffScreen()) {
            this.deactivate();
        }
    }

    /**
     * Check if drifted offscreen.
     * @returns {boolean}
     */
    _isOffScreen() {
        var C = window.Constants;
        var margin = 80;
        return (this.x < -margin || this.x > C.GAME_WIDTH + margin ||
                this.y < -margin || this.y > C.GAME_HEIGHT + margin);
    }

    /**
     * Play collection animation and deactivate.
     * @param {function} [onComplete] - Optional callback when animation finishes
     */
    collect(onComplete) {
        if (this.collected) return;

        var C = window.Constants;
        this.collected = true;

        // Stop physics so no further overlaps
        this.body.enable = false;

        // Stop glow tween
        if (this._glowTween) {
            this._glowTween.stop();
        }

        // Collection animation: scale up + fade out + sparkle burst
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            angle: this.angle + 180,
            duration: 400,
            ease: 'Power2',
            onComplete: function () {
                this.deactivate();
                if (onComplete) onComplete();
            }.bind(this)
        });

        // Emit sparkle particles if the scene has a particle system
        if (this.scene.events) {
            this.scene.events.emit('powerUpCollected', this.powerUpType, this.x, this.y);
        }
    }

    /**
     * Activate this power-up for pool reuse.
     * @param {number} x - New x position
     * @param {number} y - New y position
     * @param {string} type - Power-up type
     */
    activate(x, y, type) {
        var C = window.Constants;

        this.powerUpType = type;
        this.collected = false;

        // Update texture
        this.setTexture('powerup_' + type);

        // Reset position
        this.setPosition(x, y);
        this._baseY = y;
        this._bobTime = Math.random() * Math.PI * 2;

        // Reset drift
        this._driftSpeed = 25 + Math.random() * 20;
        this._driftDirection = Math.random() < 0.5 ? -1 : 1;

        // Reset visuals
        this.setScale(0.8);
        this.setAlpha(1);
        this.setAngle(0);
        this.setDepth(C.DEPTH.POWER_UPS);

        // Apply tint
        if (C.POWER_UP_COLORS[type]) {
            this.setTint(C.POWER_UP_COLORS[type]);
        } else {
            this.clearTint();
        }

        // Reset hitbox
        this.body.setSize(this.width * 0.8, this.height * 0.8);
        this.body.setOffset(this.width * 0.1, this.height * 0.1);
        this.body.enable = true;

        // Restart glow pulse
        if (this._glowTween) {
            this._glowTween.stop();
        }
        this._glowTween = this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.75, to: 1.0 },
            scaleX: { from: 0.75, to: 0.85 },
            scaleY: { from: 0.75, to: 0.85 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Make active and visible
        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Deactivate for object pool reuse.
     */
    deactivate() {
        if (this._glowTween) {
            this._glowTween.stop();
            this._glowTween = null;
        }

        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.collected = false;
    }

    /**
     * Clean up on destroy.
     */
    destroy(fromScene) {
        if (this._glowTween) {
            this._glowTween.stop();
            this._glowTween = null;
        }
        super.destroy(fromScene);
    }
};
