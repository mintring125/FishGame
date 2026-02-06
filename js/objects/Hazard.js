/**
 * Hazard.js - Environmental Hazards
 * Feeding Frenzy - Fish Feeding Game
 *
 * Hazards are obstacles the player must avoid. Two types:
 *
 * JELLYFISH - Drifts slowly upward with horizontal sway. Translucent
 *   pulsing animation. Stuns the player on contact.
 *
 * PUFFERFISH - Swims horizontally. Inflates when the player comes
 *   within range, becoming dangerous. Deflates after a timeout.
 *   Damages the player only while inflated.
 *
 * Designed for object-pool reuse via activate()/deactivate().
 */

window.Hazard = class Hazard extends Phaser.Physics.Arcade.Sprite {

    /**
     * @param {Phaser.Scene} scene - The scene this hazard belongs to
     * @param {number} x - Spawn x position
     * @param {number} y - Spawn y position
     * @param {string} type - One of Constants.HAZARD_TYPES values
     */
    constructor(scene, x, y, type) {
        var textureKey = 'hazard_' + type;
        super(scene, x, y, textureKey);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        var C = window.Constants;

        // ---- Core Properties ----
        this.hazardType = type;
        this.isActive = true;

        // ---- Type-Specific State ----
        // Jellyfish
        this._swayTime = Math.random() * Math.PI * 2;
        this._swaySpeed = 1.0 + Math.random() * 0.5;
        this._swayAmount = 30 + Math.random() * 20;
        this._pulseTime = Math.random() * Math.PI * 2;

        // Pufferfish
        this._isInflated = false;
        this._inflateTimer = null;
        this._deflateTimer = null;
        this._baseScale = 1.0;
        this._direction = Math.random() < 0.5 ? -1 : 1;

        // ---- Visual Setup ----
        this.setDepth(C.DEPTH.HAZARDS);
        this.setScale(0.9);
        this._baseScale = 0.9;

        // Hitbox
        this.body.setSize(this.width * 0.7, this.height * 0.7);
        this.body.setOffset(this.width * 0.15, this.height * 0.15);

        // ---- Initialize Type ----
        this._initType(type);
    }

    /**
     * Set up type-specific visual properties.
     * @param {string} type - Hazard type
     */
    _initType(type) {
        var C = window.Constants;

        if (type === C.HAZARD_TYPES.JELLYFISH) {
            // Jellyfish: translucent appearance
            this.setAlpha(0.7);
        } else if (type === C.HAZARD_TYPES.PUFFERFISH) {
            // Pufferfish: normal appearance, flip based on direction
            this.flipX = this._direction < 0;
            this.setAlpha(1.0);
        }
    }

    /**
     * Called every frame by the scene.
     * @param {number} time - Total elapsed time in ms
     * @param {number} delta - Time since last frame in ms
     * @param {Phaser.Physics.Arcade.Sprite} [player] - Player reference for pufferfish proximity check
     */
    update(time, delta, player) {
        if (!this.active) return;

        var C = window.Constants;
        var deltaSeconds = delta / 1000;

        if (this.hazardType === C.HAZARD_TYPES.JELLYFISH) {
            this._updateJellyfish(time, deltaSeconds);
        } else if (this.hazardType === C.HAZARD_TYPES.PUFFERFISH) {
            this._updatePufferfish(time, deltaSeconds, player);
        }

        // Offscreen check
        if (this._isOffScreen()) {
            this.deactivate();
        }
    }

    // ================================================
    // JELLYFISH BEHAVIOR
    // ================================================

    /**
     * Jellyfish: slow upward drift with horizontal sine sway and pulsing glow.
     * @param {number} time - Total elapsed time
     * @param {number} deltaSeconds - Frame delta in seconds
     */
    _updateJellyfish(time, deltaSeconds) {
        var C = window.Constants;

        // Slow upward drift
        this.y -= C.HAZARD_JELLYFISH_SPEED * deltaSeconds;

        // Horizontal sway
        this._swayTime += this._swaySpeed * deltaSeconds;
        this.x += Math.sin(this._swayTime) * this._swayAmount * deltaSeconds;

        // Pulsing translucent animation
        this._pulseTime += 2.0 * deltaSeconds;
        var pulseAlpha = 0.5 + Math.sin(this._pulseTime) * 0.2;
        this.setAlpha(pulseAlpha);

        // Subtle scale pulse to simulate jellyfish propulsion
        var pulsePropulsion = 1.0 + Math.sin(this._pulseTime * 1.5) * 0.06;
        this.setScale(this._baseScale * pulsePropulsion, this._baseScale * (2.0 - pulsePropulsion));
    }

    /**
     * Handle jellyfish contact with the player.
     * Emits stun event.
     */
    onPlayerContact() {
        var C = window.Constants;

        if (this.hazardType === C.HAZARD_TYPES.JELLYFISH) {
            this.scene.events.emit('playerStunned', C.HAZARD_JELLYFISH_STUN_TIME);

            // Flash effect on the jellyfish
            this.setTint(0xFFFFFF);
            this.scene.time.delayedCall(200, function () {
                if (this.active) this.clearTint();
            }, [], this);
        } else if (this.hazardType === C.HAZARD_TYPES.PUFFERFISH) {
            if (this._isInflated) {
                // Inflated pufferfish deals damage
                this.scene.events.emit('playerHit');
            }
        }
    }

    // ================================================
    // PUFFERFISH BEHAVIOR
    // ================================================

    /**
     * Pufferfish: horizontal movement, inflate when player is nearby.
     * @param {number} time - Total elapsed time
     * @param {number} deltaSeconds - Frame delta in seconds
     * @param {Phaser.Physics.Arcade.Sprite} [player] - Player reference
     */
    _updatePufferfish(time, deltaSeconds, player) {
        var C = window.Constants;

        // Horizontal movement
        this.x += this._direction * C.HAZARD_PUFFERFISH_SPEED * deltaSeconds;

        // Slight vertical bob
        this._swayTime += 1.5 * deltaSeconds;
        this.y += Math.sin(this._swayTime) * 8 * deltaSeconds;

        // Proximity check for inflation
        if (player && player.active && !this._isInflated) {
            var dx = player.x - this.x;
            var dy = player.y - this.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < C.HAZARD_PUFFERFISH_INFLATE_RANGE) {
                this._inflate();
            }
        }
    }

    /**
     * Inflate the pufferfish: scale up, become dangerous.
     */
    _inflate() {
        if (this._isInflated) return;

        var C = window.Constants;
        this._isInflated = true;

        // Switch to inflated texture
        this.setTexture('hazard_PUFFERFISH_inflated');

        // Inflate animation
        this.scene.tweens.add({
            targets: this,
            scaleX: this._baseScale * 1.5 * (this.flipX ? -1 : 1),
            scaleY: this._baseScale * 1.5,
            duration: 300,
            ease: 'Back.easeOut'
        });

        // Expand hitbox for inflated size
        this.body.setSize(this.width * 0.85, this.height * 0.85);
        this.body.setOffset(this.width * 0.075, this.height * 0.075);

        // Warning tint
        this.setTint(0xFF6666);

        // Deflate after 2 seconds
        if (this._deflateTimer) {
            this._deflateTimer.remove(false);
        }
        this._deflateTimer = this.scene.time.delayedCall(2000, function () {
            this._deflate();
        }, [], this);
    }

    /**
     * Deflate the pufferfish: return to normal size.
     */
    _deflate() {
        if (!this._isInflated) return;

        this._isInflated = false;

        // Switch back to normal texture
        this.setTexture('hazard_PUFFERFISH');

        // Deflate animation
        this.scene.tweens.add({
            targets: this,
            scaleX: this._baseScale * (this.flipX ? -1 : 1),
            scaleY: this._baseScale,
            duration: 400,
            ease: 'Quad.easeOut'
        });

        // Reset hitbox
        this.body.setSize(this.width * 0.7, this.height * 0.7);
        this.body.setOffset(this.width * 0.15, this.height * 0.15);

        // Clear warning tint
        this.clearTint();
    }

    /**
     * Check if this hazard is dangerous to the player right now.
     * Jellyfish are always dangerous; pufferfish only when inflated.
     * @returns {boolean}
     */
    isDangerous() {
        var C = window.Constants;

        if (this.hazardType === C.HAZARD_TYPES.JELLYFISH) {
            return true; // Always stuns on contact
        }
        if (this.hazardType === C.HAZARD_TYPES.PUFFERFISH) {
            return this._isInflated;
        }
        return false;
    }

    /**
     * Check if past screen boundaries.
     * @returns {boolean}
     */
    _isOffScreen() {
        var C = window.Constants;
        var margin = 100;

        return (this.x < -margin || this.x > C.GAME_WIDTH + margin ||
                this.y < -margin || this.y > C.GAME_HEIGHT + margin);
    }

    /**
     * Activate this hazard for pool reuse.
     * @param {number} x - New x position
     * @param {number} y - New y position
     * @param {string} type - Hazard type
     * @param {number} [direction] - Movement direction for pufferfish (1 or -1)
     */
    activate(x, y, type, direction) {
        var C = window.Constants;

        this.hazardType = type;
        this.isActive = true;
        this._isInflated = false;

        // Update texture
        this.setTexture('hazard_' + type);

        // Reset position
        this.setPosition(x, y);

        // Reset timers
        if (this._deflateTimer) {
            this._deflateTimer.remove(false);
            this._deflateTimer = null;
        }

        // Reset animation state
        this._swayTime = Math.random() * Math.PI * 2;
        this._swaySpeed = 1.0 + Math.random() * 0.5;
        this._swayAmount = 30 + Math.random() * 20;
        this._pulseTime = Math.random() * Math.PI * 2;

        // Reset scale
        this._baseScale = 0.9;
        this.setScale(this._baseScale);

        // Direction for pufferfish
        this._direction = direction || (Math.random() < 0.5 ? -1 : 1);

        // Type-specific setup
        this._initType(type);

        // Reset hitbox
        this.body.setSize(this.width * 0.7, this.height * 0.7);
        this.body.setOffset(this.width * 0.15, this.height * 0.15);
        this.body.enable = true;

        // Reset visuals
        this.setAngle(0);
        this.clearTint();
        this.setDepth(C.DEPTH.HAZARDS);

        // Make active and visible
        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Deactivate for object pool reuse.
     */
    deactivate() {
        this.isActive = false;
        this._isInflated = false;

        if (this._deflateTimer) {
            this._deflateTimer.remove(false);
            this._deflateTimer = null;
        }

        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }

    /**
     * Clean up on destroy.
     */
    destroy(fromScene) {
        if (this._deflateTimer) {
            this._deflateTimer.remove(false);
            this._deflateTimer = null;
        }
        super.destroy(fromScene);
    }
};
