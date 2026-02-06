/**
 * VirtualJoystick.js - Virtual Joystick Controller
 * Feeding Frenzy - Fish Feeding Game
 *
 * A circular dial pad joystick for controlling the player fish.
 * Renders a semi-transparent base circle with a movable thumb knob.
 * Provides direction vector and force for smooth directional movement.
 * Supports both mouse and multi-touch input.
 * 
 * FIXED POSITION MODE: The joystick base remains stationary.
 */

window.VirtualJoystick = class VirtualJoystick {

    /**
     * @param {Phaser.Scene} scene - The scene this joystick belongs to
     * @param {number} x - Center x position
     * @param {number} y - Center y position
     * @param {object} options - Configuration options
     * @param {number} options.baseRadius - Radius of the outer base circle
     * @param {number} options.thumbRadius - Radius of the inner thumb knob
     * @param {number} options.baseAlpha - Alpha of the base when idle
     * @param {number} options.thumbAlpha - Alpha of the thumb when idle
     */
    constructor(scene, x, y, options) {
        options = options || {};

        this.scene = scene;

        // Fixed position
        this.centerX = x;
        this.centerY = y;

        this.baseRadius = options.baseRadius || 60; // Slightly larger default for better precision
        this.thumbRadius = options.thumbRadius || 25;
        this._baseAlphaIdle = options.baseAlpha || 0.3;
        this._thumbAlphaIdle = options.thumbAlpha || 0.5;
        this._baseAlphaActive = Math.min(this._baseAlphaIdle + 0.15, 0.6);
        this._thumbAlphaActive = Math.min(this._thumbAlphaIdle + 0.2, 0.8);

        // Output state
        this.direction = { x: 0, y: 0 };
        this.force = 0;
        this.isActive = false;

        // Track which pointer is controlling the joystick
        this._activePointerId = null;

        // Create graphics
        this._createVisuals();

        // Setup input
        this._setupInput();
    }

    /**
     * Draw the joystick base and thumb using Phaser Graphics.
     */
    _createVisuals() {
        var depth = window.Constants.DEPTH.HUD - 1;

        // Outer glow ring
        this._glowGraphics = this.scene.add.graphics();
        this._glowGraphics.setDepth(depth - 0.1);
        this._glowGraphics.setScrollFactor(0);

        // Base circle
        this._baseGraphics = this.scene.add.graphics();
        this._baseGraphics.setDepth(depth);
        this._baseGraphics.setScrollFactor(0);

        // Thumb circle
        this._thumbGraphics = this.scene.add.graphics();
        this._thumbGraphics.setDepth(depth + 0.1);
        this._thumbGraphics.setScrollFactor(0);

        this._drawBase(false);
        this._drawThumb(this.centerX, this.centerY, false);
    }

    /**
     * Draw the base circle with border and glow.
     * @param {boolean} active - Whether the joystick is being touched
     */
    _drawBase(active) {
        var alpha = active ? this._baseAlphaActive : this._baseAlphaIdle;

        // Glow ring
        this._glowGraphics.clear();
        this._glowGraphics.lineStyle(3, 0x00BFFF, alpha * 0.6);
        this._glowGraphics.strokeCircle(this.centerX, this.centerY, this.baseRadius + 4);

        // Base fill
        this._baseGraphics.clear();
        this._baseGraphics.fillStyle(0x000000, alpha);
        this._baseGraphics.fillCircle(this.centerX, this.centerY, this.baseRadius);

        // Base border
        this._baseGraphics.lineStyle(2, 0xFFFFFF, alpha + 0.1);
        this._baseGraphics.strokeCircle(this.centerX, this.centerY, this.baseRadius);
    }

    /**
     * Draw the thumb knob at a given position.
     * @param {number} x - Thumb center x
     * @param {number} y - Thumb center y
     * @param {boolean} active - Whether the joystick is being touched
     */
    _drawThumb(x, y, active) {
        var alpha = active ? this._thumbAlphaActive : this._thumbAlphaIdle;

        this._thumbGraphics.clear();

        // Thumb fill - lighter color
        this._thumbGraphics.fillStyle(0xCCCCCC, alpha);
        this._thumbGraphics.fillCircle(x, y, this.thumbRadius);

        // Thumb border
        this._thumbGraphics.lineStyle(2, 0xFFFFFF, alpha + 0.15);
        this._thumbGraphics.strokeCircle(x, y, this.thumbRadius);

        // Inner highlight for 3D effect
        this._thumbGraphics.fillStyle(0xFFFFFF, alpha * 0.3);
        this._thumbGraphics.fillCircle(x - this.thumbRadius * 0.2, y - this.thumbRadius * 0.2, this.thumbRadius * 0.4);
    }

    /**
     * Setup pointer event listeners for joystick interaction.
     */
    _setupInput() {
        var self = this;

        this._onPointerDown = function (pointer) {
            // If already active, ignore other pointers
            if (self._activePointerId !== null) return;

            // Check distance from FIXED center
            var dx = pointer.x - self.centerX;
            var dy = pointer.y - self.centerY;
            var dist = Math.sqrt(dx * dx + dy * dy);

            // Hit test: allow touching slightly outside the visual base for usability
            // (Base Radius + 30px padding)
            if (dist <= self.baseRadius + 30) {
                self._activePointerId = pointer.id;
                self.isActive = true;

                // Immediately update position
                self._updateThumbPosition(pointer.x, pointer.y);
                self._drawBase(true);
            }
        };

        this._onPointerMove = function (pointer) {
            if (self._activePointerId === null || pointer.id !== self._activePointerId) return;

            self._updateThumbPosition(pointer.x, pointer.y);
        };

        this._onPointerUp = function (pointer) {
            if (self._activePointerId === null || pointer.id !== self._activePointerId) return;

            // Release logic
            self._activePointerId = null;
            self.isActive = false;

            // Output reset
            self.direction.x = 0;
            self.direction.y = 0;
            self.force = 0;

            // Visual reset to center
            self._drawBase(false);
            self._drawThumb(self.centerX, self.centerY, false);
        };

        this.scene.input.on('pointerdown', this._onPointerDown);
        this.scene.input.on('pointermove', this._onPointerMove);
        this.scene.input.on('pointerup', this._onPointerUp);
    }

    /**
     * Update the thumb position and calculate direction/force.
     * STRICTLY keeps the base fixed.
     */
    _updateThumbPosition(pointerX, pointerY) {
        var dx = pointerX - this.centerX;
        var dy = pointerY - this.centerY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        // Clamp thumb within base radius
        if (dist > this.baseRadius) {
            var scale = this.baseRadius / dist;
            dx *= scale;
            dy *= scale;
            dist = this.baseRadius;
        }

        // Calculate normalized direction
        if (dist > 3) { // Deadzone of 3px
            var rawForce = dist / this.baseRadius;

            // Normalize direction
            this.direction.x = dx / dist;
            this.direction.y = dy / dist;

            // Force: 0 to 1
            this.force = Phaser.Math.Clamp(rawForce, 0, 1);
        } else {
            this.direction.x = 0;
            this.direction.y = 0;
            this.force = 0;
        }

        // Redraw thumb at calculated clamped position
        this._drawThumb(this.centerX + dx, this.centerY + dy, true);
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.scene && this.scene.input) {
            this.scene.input.off('pointerdown', this._onPointerDown);
            this.scene.input.off('pointermove', this._onPointerMove);
            this.scene.input.off('pointerup', this._onPointerUp);
        }

        if (this._glowGraphics) this._glowGraphics.destroy();
        if (this._baseGraphics) this._baseGraphics.destroy();
        if (this._thumbGraphics) this._thumbGraphics.destroy();

        this.scene = null;
    }
};
