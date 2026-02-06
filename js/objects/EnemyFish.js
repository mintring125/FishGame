/**
 * EnemyFish.js - AI-Controlled Enemy Fish
 * Feeding Frenzy - Fish Feeding Game
 *
 * Enemy fish swim horizontally across the screen with a sine-wave
 * vertical wobble. Smaller fish move faster. Color-coded edibility
 * indicators help the player judge threats vs. prey.
 * Designed for object-pool reuse via activate()/deactivate().
 */

window.EnemyFish = class EnemyFish extends Phaser.Physics.Arcade.Sprite {

    /**
     * @param {Phaser.Scene} scene - The scene this fish belongs to
     * @param {number} x - Spawn x position
     * @param {number} y - Spawn y position
     * @param {number} colorIndex - Index into Constants.FISH_COLORS (0-7)
     * @param {number} sizeIndex - Size tier (Constants.FISH_SIZE value)
     */
    constructor(scene, x, y, colorIndex, sizeIndex) {
        var textureKey = 'fish_' + colorIndex + '_' + sizeIndex;
        super(scene, x, y, textureKey);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ---- Identity ----
        this.colorIndex = colorIndex;
        this.sizeIndex = sizeIndex;

        // ---- Movement ----
        // Smaller fish are faster; larger fish are slower
        this._baseSpeed = this._calculateSpeed(sizeIndex);
        this.speed = this._baseSpeed;
        this.direction = 1; // 1 = moving right, -1 = moving left

        // ---- Wobble (vertical sine wave) ----
        this._wobbleTime = Math.random() * Math.PI * 2; // random phase offset
        this._wobbleSpeed = 1.5 + Math.random() * 1.0;  // variation per fish
        this._wobbleAmount = 15 + Math.random() * 20;    // px amplitude variation

        // ---- Tail Animation ----
        this._tailTime = Math.random() * Math.PI * 2; // offset so fish don't sync

        // ---- Visual Setup ----
        var C = window.Constants;
        var scale = C.FISH_SIZE_SCALES[sizeIndex];
        this.setScale(scale);
        this.setDepth(C.DEPTH.ENEMY_FISH);

        // Hitbox slightly smaller than visual for fair gameplay
        this.body.setSize(this.width * 0.75, this.height * 0.7);
        this.body.setOffset(this.width * 0.125, this.height * 0.15);

        // Flip sprite based on direction
        this.flipX = this.direction < 0;

        // Spawn y position storage for wobble baseline
        this._baseY = y;
    }

    /**
     * Calculate swim speed based on size tier.
     * Tiny fish are fast, mega fish are slow.
     * @param {number} sizeIndex - Size tier
     * @returns {number} Speed in px/sec
     */
    _calculateSpeed(sizeIndex) {
        // Inverse relationship: smaller = faster
        var speeds = [180, 140, 110, 85, 65];
        return speeds[sizeIndex] || 120;
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

        // ---- Horizontal movement ----
        this.x += this.direction * this.speed * deltaSeconds;

        // ---- Vertical wobble (sine wave) ----
        this._wobbleTime += this._wobbleSpeed * deltaSeconds;
        this.y = this._baseY + Math.sin(this._wobbleTime) * this._wobbleAmount;

        // ---- Tail animation ----
        this._updateTailAnimation(time);

        // ---- Offscreen check ----
        if (this.isOffScreen()) {
            this.deactivate();
        }
    }

    /**
     * Tail wag animation using sine-based scale oscillation.
     * @param {number} time - Elapsed time in ms
     */
    _updateTailAnimation(time) {
        var C = window.Constants;
        this._tailTime += C.FISH_TAIL_SPEED * (1 / 60);
        var wag = Math.sin(this._tailTime) * C.FISH_TAIL_AMOUNT;

        var baseScale = C.FISH_SIZE_SCALES[this.sizeIndex];
        var xSign = this.flipX ? -1 : 1;
        this.setScale(
            (baseScale + wag * 0.08) * xSign,
            baseScale
        );
    }

    /**
     * Update the tint to indicate whether this fish is edible by the player.
     * Green = safe to eat, Red = dangerous, No tint = same size.
     * @param {number} playerSize - The player's current size tier
     */
    setEdibleIndicator(playerSize) {
        if (this.sizeIndex < playerSize) {
            // Smaller than player: edible - subtle green tint
            this.setTint(0x88FF88);
        } else if (this.sizeIndex > playerSize) {
            // Larger than player: dangerous - subtle red tint
            this.setTint(0xFF8888);
        } else {
            // Same size: edible but neutral indicator
            this.clearTint();
        }
    }

    /**
     * Play the eaten/death animation, then deactivate for pool reuse.
     * @param {function} [onComplete] - Optional callback when animation finishes
     */
    onEaten(onComplete) {
        var C = window.Constants;

        // Disable physics immediately so no further collisions
        this.body.enable = false;

        // Death animation: shrink + spin + fade
        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            scaleY: 0,
            angle: this.direction * 360,
            alpha: 0,
            duration: C.DEATH_ANIMATION_DURATION,
            ease: 'Power2',
            onComplete: function () {
                this.deactivate();
                if (onComplete) onComplete();
            }.bind(this)
        });
    }

    /**
     * Check if this fish has moved far enough offscreen to be despawned.
     * @returns {boolean} True if past the despawn margin
     */
    isOffScreen() {
        var C = window.Constants;
        var margin = C.FISH_DESPAWN_MARGIN;

        if (this.direction > 0 && this.x > C.GAME_WIDTH + margin) {
            return true;
        }
        if (this.direction < 0 && this.x < -margin) {
            return true;
        }
        // Also check vertical (in case wobble pushes far off)
        if (this.y < -margin * 2 || this.y > C.GAME_HEIGHT + margin * 2) {
            return true;
        }

        return false;
    }

    /**
     * Activate this fish for pool reuse. Resets all properties.
     * @param {number} x - New x position
     * @param {number} y - New y position
     * @param {number} colorIndex - Color palette index (0-7)
     * @param {number} sizeIndex - Size tier
     * @param {number} direction - Movement direction (1 = right, -1 = left)
     * @param {number} [speedMultiplier=1] - Level-based speed multiplier
     */
    activate(x, y, colorIndex, sizeIndex, direction, speedMultiplier) {
        var C = window.Constants;

        this.colorIndex = colorIndex;
        this.sizeIndex = sizeIndex;
        this.direction = direction;

        // Update texture
        var textureKey = 'fish_' + colorIndex + '_' + sizeIndex;
        this.setTexture(textureKey);

        // Reset position
        this.setPosition(x, y);
        this._baseY = y;

        // Reset movement
        this._baseSpeed = this._calculateSpeed(sizeIndex);
        this.speed = this._baseSpeed * (speedMultiplier || 1);

        // Reset wobble with new random offset
        this._wobbleTime = Math.random() * Math.PI * 2;
        this._wobbleSpeed = 1.5 + Math.random() * 1.0;
        this._wobbleAmount = 15 + Math.random() * 20;
        this._tailTime = Math.random() * Math.PI * 2;

        // Reset visuals
        var scale = C.FISH_SIZE_SCALES[sizeIndex];
        this.setScale(scale);
        this.flipX = direction < 0;
        this.setAlpha(1);
        this.setAngle(0);
        this.clearTint();
        this.setDepth(C.DEPTH.ENEMY_FISH);

        // Reset hitbox
        this.body.setSize(this.width * 0.75, this.height * 0.7);
        this.body.setOffset(this.width * 0.125, this.height * 0.15);
        this.body.enable = true;

        // Make active and visible
        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Deactivate for object pool reuse.
     */
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }
};
