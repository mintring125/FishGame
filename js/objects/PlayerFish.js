/**
 * PlayerFish.js - Player-Controlled Fish
 * Feeding Frenzy - Fish Feeding Game
 *
 * The main player character. Follows pointer/touch input with smooth
 * lerp interpolation. Grows through size tiers by eating smaller fish.
 * Supports power-ups, invincibility frames, and tail animation.
 */

window.PlayerFish = class PlayerFish extends Phaser.Physics.Arcade.Sprite {

    /**
     * @param {Phaser.Scene} scene - The scene this fish belongs to
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    constructor(scene, x, y) {
        var C = window.Constants;

        super(scene, x, y, 'player_0');

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ---- Core State ----
        this.currentSize = C.PLAYER_START_SIZE;
        this.fishEaten = 0;
        this.speed = C.PLAYER_SPEEDS[this.currentSize];

        // ---- Invincibility ----
        this.isInvincible = false;
        this._invincibilityTimer = null;
        this._invincibilityFlashEvent = null;

        // ---- Power-Ups ----
        // Map of active power-up type -> { timer: Phaser.Time.TimerEvent }
        this.activePowerUps = new Map();

        // ---- Animation State ----
        this._tailTime = 0;
        this._baseScaleX = C.FISH_SIZE_SCALES[this.currentSize];
        this._baseScaleY = C.FISH_SIZE_SCALES[this.currentSize];
        this._isGrowing = false;

        // ---- Movement ----
        this._lerpFactor = 0.08;
        this._targetX = x;
        this._targetY = y;
        this._lastDirection = 1; // 1 = right, -1 = left

        // ---- Setup ----
        this.setScale(this._baseScaleX, this._baseScaleY);
        this.setDepth(C.DEPTH.PLAYER);

        // Hitbox: reduced size for forgiving collisions
        this.body.setSize(
            this.width * C.PLAYER_HITBOX_SCALE,
            this.height * C.PLAYER_HITBOX_SCALE
        );
        this.body.setOffset(
            this.width * (1 - C.PLAYER_HITBOX_SCALE) / 2,
            this.height * (1 - C.PLAYER_HITBOX_SCALE) / 2
        );

        // Prevent the player from leaving game bounds
        this.body.setCollideWorldBounds(true);
    }

    /**
     * Called every frame by the scene's update loop.
     * @param {number} time - Total elapsed time in ms
     * @param {number} delta - Time since last frame in ms
     */
    update(time, delta) {
        if (!this.active) return;

        var C = window.Constants;
        var deltaSeconds = delta / 1000;

        // ---- Pointer Tracking ----
        this._updateMovement(deltaSeconds);

        // ---- Tail Animation ----
        this._updateTailAnimation(time);

        // ---- Power-Up Timers (managed by Phaser TimerEvents, nothing extra needed here) ----
    }

    /**
     * Smooth movement toward pointer/touch position.
     * Uses lerp for fluid, non-jerky motion.
     * @param {number} deltaSeconds - Frame delta in seconds
     */
    _updateMovement(deltaSeconds) {
        var C = window.Constants;
        var joystick = this.scene.joystick;

        if (joystick && joystick.isActive && joystick.force > 0.1) {
            // ---- Joystick-based movement ----
            var effectiveSpeed = this.speed;
            if (this.activePowerUps.has(C.POWER_UP_TYPES.SPEED)) {
                effectiveSpeed *= C.POWER_UP_SPEED_BOOST;
            }

            // [FIX 1] Reduce joystick sensitivity/speed slightly for better control
            // 80% of max speed feels more controllable with a virtual joystick
            var joystickSpeed = effectiveSpeed * 0.8;

            var moveX = joystick.direction.x * joystick.force * joystickSpeed * deltaSeconds;
            var moveY = joystick.direction.y * joystick.force * joystickSpeed * deltaSeconds;

            this.x += moveX;
            this.y += moveY;

            // [FIX 2] Sync target position to current position
            // This prevents the fish from snapping back to an old pointer position when joystick is released
            this._targetX = this.x;
            this._targetY = this.y;

            // Face direction of movement
            if (Math.abs(joystick.direction.x) > 0.1) {
                this._lastDirection = joystick.direction.x > 0 ? 1 : -1;
                this.flipX = this._lastDirection < 0;
            }
        }

        // Clamp to game bounds
        this.x = Phaser.Math.Clamp(this.x, this.displayWidth / 2, C.GAME_WIDTH - this.displayWidth / 2);
        this.y = Phaser.Math.Clamp(this.y, this.displayHeight / 2, C.GAME_HEIGHT - this.displayHeight / 2);
    }

    /**
     * Subtle tail wag using sine wave scale oscillation.
     * @param {number} time - Total elapsed time in ms
     */
    _updateTailAnimation(time) {
        if (this._isGrowing) return; // Don't interfere with growth tween

        var C = window.Constants;
        this._tailTime += C.FISH_TAIL_SPEED * (1 / 60); // normalize for consistent speed
        var wag = Math.sin(this._tailTime) * C.FISH_TAIL_AMOUNT;

        // Apply tail wag as slight horizontal scale oscillation
        var scaleSign = this.flipX ? -1 : 1;
        this.setScale(
            this._baseScaleX + wag * 0.1 * scaleSign,
            this._baseScaleY
        );
    }

    /**
     * Called when this fish successfully eats an enemy fish.
     * Increments eat counter and checks for growth thresholds.
     * @returns {boolean} True if eating triggered a growth event
     */
    eat() {
        var C = window.Constants;
        this.fishEaten++;

        // Chomp animation: brief scale pulse
        if (!this._isGrowing) {
            this.scene.tweens.add({
                targets: this,
                scaleX: this._baseScaleX * (this.flipX ? -1.15 : 1.15),
                scaleY: this._baseScaleY * 0.9,
                duration: C.EAT_ANIMATION_DURATION / 2,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
        }

        // Check growth threshold
        if (this.currentSize < C.FISH_SIZE.MEGA &&
            this.fishEaten >= C.GROWTH_THRESHOLDS[this.currentSize]) {
            this.grow();
            return true;
        }

        return false;
    }

    /**
     * Advance to the next size tier with animation.
     */
    grow() {
        var C = window.Constants;

        if (this.currentSize >= C.FISH_SIZE.MEGA) return;

        this._isGrowing = true;
        this.currentSize++;
        this.speed = C.PLAYER_SPEEDS[this.currentSize];

        // Update texture
        this.setTexture('player_' + this.currentSize);

        // Recalculate hitbox for new texture
        this.body.setSize(
            this.width * C.PLAYER_HITBOX_SCALE,
            this.height * C.PLAYER_HITBOX_SCALE
        );
        this.body.setOffset(
            this.width * (1 - C.PLAYER_HITBOX_SCALE) / 2,
            this.height * (1 - C.PLAYER_HITBOX_SCALE) / 2
        );

        var newScaleX = C.FISH_SIZE_SCALES[this.currentSize];
        var newScaleY = C.FISH_SIZE_SCALES[this.currentSize];

        // Growth animation: flash white, scale up with overshoot
        this.scene.tweens.add({
            targets: this,
            scaleX: { from: this._baseScaleX * (this.flipX ? -1 : 1), to: newScaleX * 1.2 * (this.flipX ? -1 : 1) },
            scaleY: { from: this._baseScaleY, to: newScaleY * 1.2 },
            duration: C.GROW_ANIMATION_DURATION * 0.6,
            ease: 'Back.easeOut',
            onStart: function () {
                this.setTint(0xFFFFFF);
            }.bind(this),
            onComplete: function () {
                // Settle to final scale
                this.scene.tweens.add({
                    targets: this,
                    scaleX: newScaleX * (this.flipX ? -1 : 1),
                    scaleY: newScaleY,
                    duration: C.GROW_ANIMATION_DURATION * 0.4,
                    ease: 'Bounce.easeOut',
                    onComplete: function () {
                        this._baseScaleX = newScaleX;
                        this._baseScaleY = newScaleY;
                        this._isGrowing = false;
                        this.clearTint();
                    }.bind(this)
                });
            }.bind(this)
        });

        // Brief invincibility after growing
        this.setInvincible(C.GROWTH_INVINCIBILITY);

        // Emit growth event for scene/HUD to react
        this.scene.events.emit('playerGrew', this.currentSize);
    }

    /**
     * Handle taking damage from a larger fish or hazard.
     * Respects invincibility and shield power-up.
     * @returns {boolean} True if damage was actually applied
     */
    takeDamage() {
        var C = window.Constants;

        if (this.isInvincible) return false;

        // Shield absorbs one hit
        if (this.activePowerUps.has(C.POWER_UP_TYPES.SHIELD)) {
            this.removePowerUp(C.POWER_UP_TYPES.SHIELD);
            this.setInvincible(C.INVINCIBILITY_TIME / 2);
            // Flash shield break effect
            this.setTint(0x76FF03);
            this.scene.time.delayedCall(200, function () {
                if (this.active) this.clearTint();
            }, [], this);
            return false;
        }

        // Emit damage event for the scene to handle (lives, game over, etc.)
        this.scene.events.emit('playerHit');

        // Start invincibility frames
        this.setInvincible(C.INVINCIBILITY_TIME);

        return true;
    }

    /**
     * Make the player invincible for a duration, with blinking alpha effect.
     * @param {number} duration - Invincibility duration in ms
     */
    setInvincible(duration) {
        this.isInvincible = true;

        // Clear any existing invincibility timer/flash
        if (this._invincibilityTimer) {
            this._invincibilityTimer.remove(false);
        }
        if (this._invincibilityFlashEvent) {
            this._invincibilityFlashEvent.remove(false);
        }

        // Blinking alpha effect
        var flashToggle = true;
        this._invincibilityFlashEvent = this.scene.time.addEvent({
            delay: 80,
            loop: true,
            callback: function () {
                if (!this.active) return;
                flashToggle = !flashToggle;
                this.setAlpha(flashToggle ? 1.0 : 0.3);
            },
            callbackScope: this
        });

        // End invincibility after duration
        this._invincibilityTimer = this.scene.time.delayedCall(duration, function () {
            this.isInvincible = false;
            this.setAlpha(1.0);
            if (this._invincibilityFlashEvent) {
                this._invincibilityFlashEvent.remove(false);
                this._invincibilityFlashEvent = null;
            }
        }, [], this);
    }

    /**
     * Apply a power-up effect.
     * @param {string} type - One of Constants.POWER_UP_TYPES values
     */
    applyPowerUp(type) {
        var C = window.Constants;

        // If already active, remove old one first (reset timer)
        if (this.activePowerUps.has(type)) {
            this.removePowerUp(type);
        }

        var duration = C.POWER_UP_DURATIONS[type] || 5000;

        // Create timer to auto-remove
        var timer = this.scene.time.delayedCall(duration, function () {
            this.removePowerUp(type);
        }, [], this);

        this.activePowerUps.set(type, { timer: timer });

        // Apply type-specific effects
        switch (type) {
            case C.POWER_UP_TYPES.SPEED:
                // Speed boost is applied dynamically in _updateMovement
                this.setTint(C.POWER_UP_COLORS.SPEED);
                break;

            case C.POWER_UP_TYPES.SHIELD:
                // Shield absorbs one hit (checked in takeDamage)
                this.setTint(C.POWER_UP_COLORS.SHIELD);
                break;

            case C.POWER_UP_TYPES.MAGNET:
                // Magnet attraction is handled by the GameScene overlap check
                this.setTint(C.POWER_UP_COLORS.MAGNET);
                break;

            case C.POWER_UP_TYPES.GROW:
                // Instant grow effect
                this.clearTint();
                this.grow();
                // Remove immediately since it's an instant effect
                this.activePowerUps.get(type).timer.remove(false);
                this.activePowerUps.delete(type);
                return;
        }

        // Emit event for HUD to display active power-up indicator
        this.scene.events.emit('powerUpActivated', type, duration);
    }

    /**
     * Remove an active power-up effect.
     * @param {string} type - One of Constants.POWER_UP_TYPES values
     */
    removePowerUp(type) {
        var entry = this.activePowerUps.get(type);
        if (!entry) return;

        // Remove the timer
        if (entry.timer) {
            entry.timer.remove(false);
        }

        this.activePowerUps.delete(type);

        // Clear tint if no more power-ups active
        if (this.activePowerUps.size === 0) {
            this.clearTint();
        } else {
            // Re-apply tint from remaining power-up
            var C = window.Constants;
            var remaining = this.activePowerUps.keys().next().value;
            if (remaining && C.POWER_UP_COLORS[remaining]) {
                this.setTint(C.POWER_UP_COLORS[remaining]);
            }
        }

        // Emit event for HUD
        this.scene.events.emit('powerUpExpired', type);
    }

    /**
     * Returns the maximum size of fish this player can currently eat.
     * Player can eat fish of equal or smaller size.
     * @returns {number} Size tier index
     */
    getEatableMaxSize() {
        return this.currentSize;
    }

    /**
     * Check if the magnet power-up is active and return range.
     * @returns {number} Magnet range in pixels, or 0 if inactive
     */
    getMagnetRange() {
        var C = window.Constants;
        return this.activePowerUps.has(C.POWER_UP_TYPES.MAGNET) ? C.POWER_UP_MAGNET_RANGE : 0;
    }

    /**
     * Reset the player to initial state for a new game or level.
     */
    reset() {
        var C = window.Constants;

        // Clear power-ups
        this.activePowerUps.forEach(function (entry) {
            if (entry.timer) entry.timer.remove(false);
        });
        this.activePowerUps.clear();

        // Clear invincibility
        this.isInvincible = false;
        if (this._invincibilityTimer) {
            this._invincibilityTimer.remove(false);
            this._invincibilityTimer = null;
        }
        if (this._invincibilityFlashEvent) {
            this._invincibilityFlashEvent.remove(false);
            this._invincibilityFlashEvent = null;
        }

        // Reset size and state
        this.currentSize = C.PLAYER_START_SIZE;
        this.fishEaten = 0;
        this.speed = C.PLAYER_SPEEDS[this.currentSize];
        this._isGrowing = false;

        // Reset visuals
        this.setTexture('player_' + this.currentSize);
        this._baseScaleX = C.FISH_SIZE_SCALES[this.currentSize];
        this._baseScaleY = C.FISH_SIZE_SCALES[this.currentSize];
        this.setScale(this._baseScaleX, this._baseScaleY);
        this.setAlpha(1.0);
        this.clearTint();
        this.flipX = false;
        this._lastDirection = 1;
        this._tailTime = 0;

        // Reset hitbox
        this.body.setSize(
            this.width * C.PLAYER_HITBOX_SCALE,
            this.height * C.PLAYER_HITBOX_SCALE
        );
        this.body.setOffset(
            this.width * (1 - C.PLAYER_HITBOX_SCALE) / 2,
            this.height * (1 - C.PLAYER_HITBOX_SCALE) / 2
        );

        // Center on screen
        this.setPosition(C.GAME_WIDTH / 2, C.GAME_HEIGHT / 2);
        this._targetX = this.x;
        this._targetY = this.y;

        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Clean up timers and references when destroyed.
     */
    destroy(fromScene) {
        // Clean up all timers
        if (this._invincibilityTimer) {
            this._invincibilityTimer.remove(false);
        }
        if (this._invincibilityFlashEvent) {
            this._invincibilityFlashEvent.remove(false);
        }
        this.activePowerUps.forEach(function (entry) {
            if (entry.timer) entry.timer.remove(false);
        });
        this.activePowerUps.clear();

        super.destroy(fromScene);
    }
};
