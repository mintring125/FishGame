/**
 * AssetGenerator.js - Procedural HD Sprite Generator
 * Feeding Frenzy - Fish Feeding Game
 *
 * Generates ALL game textures at boot time using offscreen Canvas rendering.
 * No external image files needed - everything is drawn procedurally.
 */

window.AssetGenerator = (function () {
    'use strict';

    var C = window.Constants;

    // ========================================
    // HELPER UTILITIES
    // ========================================

    /**
     * Convert a 0xRRGGBB integer to '#RRGGBB' string.
     */
    function hexIntToStr(hex) {
        return '#' + ('000000' + hex.toString(16)).slice(-6);
    }

    /**
     * Parse hex int into { r, g, b } components.
     */
    function hexToRGB(hex) {
        return {
            r: (hex >> 16) & 0xFF,
            g: (hex >> 8) & 0xFF,
            b: hex & 0xFF
        };
    }

    /**
     * Lighten a hex int color by a factor (0-1).
     */
    function lighten(hex, factor) {
        var c = hexToRGB(hex);
        c.r = Math.min(255, Math.floor(c.r + (255 - c.r) * factor));
        c.g = Math.min(255, Math.floor(c.g + (255 - c.g) * factor));
        c.b = Math.min(255, Math.floor(c.b + (255 - c.b) * factor));
        return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    }

    /**
     * Darken a hex int color by a factor (0-1).
     */
    function darken(hex, factor) {
        var c = hexToRGB(hex);
        c.r = Math.floor(c.r * (1 - factor));
        c.g = Math.floor(c.g * (1 - factor));
        c.b = Math.floor(c.b * (1 - factor));
        return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    }

    /**
     * Create rgba string from hex int and alpha.
     */
    function hexAlpha(hex, alpha) {
        var c = hexToRGB(hex);
        return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
    }

    /**
     * Create a Phaser CanvasTexture, draw on it, refresh, and return the canvas context.
     * Returns { canvas, ctx, texture } for chaining.
     */
    function createTex(scene, key, w, h) {
        var canvasTex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
        var canvas = canvasTex.getCanvas();
        var ctx = canvas.getContext('2d');
        return { canvas: canvas, ctx: ctx, texture: canvasTex };
    }

    /**
     * Finalize a texture after drawing.
     */
    function finalize(texObj) {
        texObj.texture.refresh();
    }

    // ========================================
    // FISH DRAWING ENGINE
    // ========================================

    /**
     * Draw a complete fish onto a canvas context.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} w - canvas width
     * @param {number} h - canvas height
     * @param {object} colors - { body, belly, fin, outline } as hex ints
     * @param {boolean} isPlayer - whether this is the player fish (extra detail)
     */
    function drawFish(ctx, w, h, colors, isPlayer) {
        var cx = w * 0.48;
        var cy = h * 0.5;
        var bodyW = w * 0.52;
        var bodyH = h * 0.38;

        var bodyStr = hexIntToStr(colors.body);
        var bellyStr = hexIntToStr(colors.belly);
        var finStr = hexIntToStr(colors.fin);
        var outlineStr = hexIntToStr(colors.outline);

        ctx.save();

        // ---- TAIL FIN (behind body) ----
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(cx - bodyW * 0.75, cy);
        ctx.bezierCurveTo(
            cx - bodyW * 1.05, cy - bodyH * 0.9,
            cx - bodyW * 1.35, cy - bodyH * 0.7,
            cx - bodyW * 1.25, cy - bodyH * 0.05
        );
        ctx.bezierCurveTo(
            cx - bodyW * 1.15, cy + bodyH * 0.15,
            cx - bodyW * 1.0, cy,
            cx - bodyW * 0.75, cy
        );
        ctx.closePath();

        var tailGrad = ctx.createLinearGradient(cx - bodyW * 1.35, cy, cx - bodyW * 0.75, cy);
        tailGrad.addColorStop(0, hexAlpha(colors.fin, 0.5));
        tailGrad.addColorStop(1, finStr);
        ctx.fillStyle = tailGrad;
        ctx.fill();

        // Lower tail lobe
        ctx.beginPath();
        ctx.moveTo(cx - bodyW * 0.75, cy);
        ctx.bezierCurveTo(
            cx - bodyW * 1.05, cy + bodyH * 0.9,
            cx - bodyW * 1.35, cy + bodyH * 0.7,
            cx - bodyW * 1.25, cy + bodyH * 0.05
        );
        ctx.bezierCurveTo(
            cx - bodyW * 1.15, cy - bodyH * 0.15,
            cx - bodyW * 1.0, cy,
            cx - bodyW * 0.75, cy
        );
        ctx.closePath();
        ctx.fillStyle = tailGrad;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // ---- DORSAL FIN (on top, behind body slightly) ----
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.moveTo(cx - bodyW * 0.1, cy - bodyH * 0.85);
        ctx.bezierCurveTo(
            cx + bodyW * 0.05, cy - bodyH * 1.45,
            cx - bodyW * 0.45, cy - bodyH * 1.4,
            cx - bodyW * 0.55, cy - bodyH * 0.7
        );
        ctx.bezierCurveTo(
            cx - bodyW * 0.4, cy - bodyH * 0.8,
            cx - bodyW * 0.15, cy - bodyH * 0.85,
            cx - bodyW * 0.1, cy - bodyH * 0.85
        );
        ctx.closePath();

        var dorsalGrad = ctx.createLinearGradient(cx, cy - bodyH * 1.5, cx, cy - bodyH * 0.7);
        dorsalGrad.addColorStop(0, hexAlpha(colors.fin, 0.3));
        dorsalGrad.addColorStop(1, finStr);
        ctx.fillStyle = dorsalGrad;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // ---- VENTRAL FIN (bottom small fin) ----
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx + bodyW * 0.05, cy + bodyH * 0.8);
        ctx.bezierCurveTo(
            cx + bodyW * 0.1, cy + bodyH * 1.25,
            cx - bodyW * 0.15, cy + bodyH * 1.2,
            cx - bodyW * 0.15, cy + bodyH * 0.75
        );
        ctx.closePath();
        ctx.fillStyle = finStr;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // ---- PECTORAL FIN (side fin) ----
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(cx + bodyW * 0.15, cy + bodyH * 0.15);
        ctx.bezierCurveTo(
            cx + bodyW * 0.25, cy + bodyH * 0.75,
            cx - bodyW * 0.1, cy + bodyH * 0.85,
            cx - bodyW * 0.05, cy + bodyH * 0.35
        );
        ctx.closePath();
        ctx.fillStyle = finStr;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // ---- BODY (main elliptical shape with gradient) ----
        ctx.save();
        ctx.shadowColor = hexAlpha(colors.body, 0.3);
        ctx.shadowBlur = bodyW * 0.15;

        ctx.beginPath();
        // Right side (mouth area) - slightly pointed
        ctx.moveTo(cx + bodyW * 0.9, cy);
        // Top curve
        ctx.bezierCurveTo(
            cx + bodyW * 0.85, cy - bodyH * 0.55,
            cx + bodyW * 0.35, cy - bodyH * 1.0,
            cx - bodyW * 0.1, cy - bodyH * 0.95
        );
        // Back top
        ctx.bezierCurveTo(
            cx - bodyW * 0.5, cy - bodyH * 0.85,
            cx - bodyW * 0.8, cy - bodyH * 0.55,
            cx - bodyW * 0.85, cy
        );
        // Back bottom
        ctx.bezierCurveTo(
            cx - bodyW * 0.8, cy + bodyH * 0.55,
            cx - bodyW * 0.5, cy + bodyH * 0.85,
            cx - bodyW * 0.1, cy + bodyH * 0.95
        );
        // Bottom curve
        ctx.bezierCurveTo(
            cx + bodyW * 0.35, cy + bodyH * 1.0,
            cx + bodyW * 0.85, cy + bodyH * 0.55,
            cx + bodyW * 0.9, cy
        );
        ctx.closePath();

        // Body gradient (top to bottom)
        var bodyGrad = ctx.createLinearGradient(cx, cy - bodyH, cx, cy + bodyH);
        bodyGrad.addColorStop(0, lighten(colors.body, 0.3));
        bodyGrad.addColorStop(0.35, bodyStr);
        bodyGrad.addColorStop(0.65, bodyStr);
        bodyGrad.addColorStop(1, darken(colors.body, 0.2));
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        ctx.shadowBlur = 0;

        // ---- OUTLINE ----
        ctx.strokeStyle = outlineStr;
        ctx.lineWidth = Math.max(1.5, bodyW * 0.03);
        ctx.stroke();
        ctx.restore();

        // ---- BELLY HIGHLIGHT ----
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx + bodyW * 0.7, cy + bodyH * 0.1);
        ctx.bezierCurveTo(
            cx + bodyW * 0.55, cy + bodyH * 0.65,
            cx - bodyW * 0.2, cy + bodyH * 0.7,
            cx - bodyW * 0.55, cy + bodyH * 0.3
        );
        ctx.bezierCurveTo(
            cx - bodyW * 0.3, cy + bodyH * 0.15,
            cx + bodyW * 0.2, cy - bodyH * 0.05,
            cx + bodyW * 0.7, cy + bodyH * 0.1
        );
        ctx.closePath();

        var bellyGrad = ctx.createRadialGradient(
            cx + bodyW * 0.1, cy + bodyH * 0.35, bodyH * 0.05,
            cx + bodyW * 0.1, cy + bodyH * 0.35, bodyH * 0.8
        );
        bellyGrad.addColorStop(0, hexAlpha(colors.belly, 0.8));
        bellyGrad.addColorStop(0.6, hexAlpha(colors.belly, 0.3));
        bellyGrad.addColorStop(1, hexAlpha(colors.belly, 0.0));
        ctx.fillStyle = bellyGrad;
        ctx.fill();
        ctx.restore();

        // ---- SCALE PATTERN OVERLAY ----
        ctx.save();
        ctx.globalAlpha = 0.08;
        var scaleSize = bodyW * 0.12;
        var rows = Math.ceil(bodyH * 2 / (scaleSize * 0.8));
        var cols = Math.ceil(bodyW * 1.6 / scaleSize);

        // Clip to body shape
        ctx.beginPath();
        ctx.moveTo(cx + bodyW * 0.85, cy);
        ctx.bezierCurveTo(cx + bodyW * 0.8, cy - bodyH * 0.5, cx + bodyW * 0.3, cy - bodyH * 0.95, cx - bodyW * 0.1, cy - bodyH * 0.9);
        ctx.bezierCurveTo(cx - bodyW * 0.5, cy - bodyH * 0.8, cx - bodyW * 0.75, cy - bodyH * 0.5, cx - bodyW * 0.8, cy);
        ctx.bezierCurveTo(cx - bodyW * 0.75, cy + bodyH * 0.5, cx - bodyW * 0.5, cy + bodyH * 0.8, cx - bodyW * 0.1, cy + bodyH * 0.9);
        ctx.bezierCurveTo(cx + bodyW * 0.3, cy + bodyH * 0.95, cx + bodyW * 0.8, cy + bodyH * 0.5, cx + bodyW * 0.85, cy);
        ctx.closePath();
        ctx.clip();

        ctx.strokeStyle = lighten(colors.body, 0.5);
        ctx.lineWidth = 0.8;
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var sx = cx - bodyW * 0.7 + col * scaleSize + (row % 2 === 0 ? scaleSize * 0.5 : 0);
                var sy = cy - bodyH * 0.9 + row * scaleSize * 0.75;
                ctx.beginPath();
                ctx.arc(sx, sy, scaleSize * 0.45, 0, Math.PI, false);
                ctx.stroke();
            }
        }
        ctx.restore();

        // ---- MOUTH ----
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx + bodyW * 0.88, cy);
        ctx.quadraticCurveTo(cx + bodyW * 0.82, cy + bodyH * 0.12, cx + bodyW * 0.72, cy + bodyH * 0.08);
        ctx.strokeStyle = outlineStr;
        ctx.lineWidth = Math.max(1, bodyW * 0.025);
        ctx.stroke();
        ctx.restore();

        // ---- EYE ----
        var eyeX = cx + bodyW * 0.5;
        var eyeY = cy - bodyH * 0.15;
        var eyeR = bodyH * 0.22;

        if (isPlayer) {
            eyeR = bodyH * 0.26;
        }

        // Eye white (sclera)
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
        var eyeGrad = ctx.createRadialGradient(eyeX - eyeR * 0.2, eyeY - eyeR * 0.2, 0, eyeX, eyeY, eyeR);
        eyeGrad.addColorStop(0, '#FFFFFF');
        eyeGrad.addColorStop(1, '#E8E8E8');
        ctx.fillStyle = eyeGrad;
        ctx.fill();
        ctx.strokeStyle = outlineStr;
        ctx.lineWidth = Math.max(1, eyeR * 0.12);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Iris
        var irisR = eyeR * 0.6;
        ctx.save();
        ctx.beginPath();
        ctx.arc(eyeX + eyeR * 0.12, eyeY, irisR, 0, Math.PI * 2);
        if (isPlayer) {
            var irisGrad = ctx.createRadialGradient(eyeX + eyeR * 0.12, eyeY, 0, eyeX + eyeR * 0.12, eyeY, irisR);
            irisGrad.addColorStop(0, '#1565C0');
            irisGrad.addColorStop(0.7, '#0D47A1');
            irisGrad.addColorStop(1, '#1A237E');
            ctx.fillStyle = irisGrad;
        } else {
            ctx.fillStyle = '#1A1A2E';
        }
        ctx.fill();
        ctx.restore();

        // Pupil
        var pupilR = eyeR * 0.32;
        ctx.save();
        ctx.beginPath();
        ctx.arc(eyeX + eyeR * 0.15, eyeY, pupilR, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.restore();

        // Eye highlight (specular)
        ctx.save();
        ctx.beginPath();
        ctx.arc(eyeX + eyeR * 0.0, eyeY - eyeR * 0.2, eyeR * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
        ctx.restore();

        // Second smaller highlight
        ctx.save();
        ctx.beginPath();
        ctx.arc(eyeX + eyeR * 0.25, eyeY + eyeR * 0.15, eyeR * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
        ctx.restore();

        // ---- PLAYER EXTRA DETAILS ----
        if (isPlayer) {
            // Cheek blush
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.arc(cx + bodyW * 0.55, cy + bodyH * 0.25, bodyH * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = '#FF6B6B';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Extra body shine
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.beginPath();
            ctx.ellipse(cx + bodyW * 0.15, cy - bodyH * 0.45, bodyW * 0.35, bodyH * 0.2, -0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // ---- TOP BODY SHINE ----
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.ellipse(cx, cy - bodyH * 0.5, bodyW * 0.45, bodyH * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    // ========================================
    // TEXTURE GENERATION FUNCTIONS
    // ========================================

    /**
     * Generate all fish textures (8 colors x 5 sizes = 40 textures).
     */
    function generateFishTextures(scene) {
        var BASE_SIZE = 60;
        var fishColors = C.FISH_COLORS;
        var scales = C.FISH_SIZE_SCALES;

        for (var ci = 0; ci < fishColors.length; ci++) {
            for (var si = 0; si < scales.length; si++) {
                var scale = scales[si];
                var fw = Math.ceil(BASE_SIZE * scale * 2.6);
                var fh = Math.ceil(BASE_SIZE * scale * 1.8);
                var key = 'fish_' + ci + '_' + si;

                var t = createTex(scene, key, fw, fh);
                drawFish(t.ctx, fw, fh, fishColors[ci], false);
                finalize(t);
            }
        }
    }

    /**
     * Generate player fish textures (5 size tiers).
     */
    function generatePlayerTextures(scene) {
        var BASE_SIZE = 60;
        var scales = C.FISH_SIZE_SCALES;

        var playerColors = {
            body:    0xFFD700,
            belly:   0xFFFDE7,
            fin:     0xFF6D00,
            outline: 0xE65100
        };

        for (var si = 0; si < scales.length; si++) {
            var scale = scales[si];
            var fw = Math.ceil(BASE_SIZE * scale * 2.6);
            var fh = Math.ceil(BASE_SIZE * scale * 1.8);
            var key = 'player_' + si;

            var t = createTex(scene, key, fw, fh);

            // Player has a subtle golden glow underlayer
            t.ctx.save();
            t.ctx.shadowColor = 'rgba(255,215,0,0.4)';
            t.ctx.shadowBlur = fw * 0.08;
            t.ctx.restore();

            drawFish(t.ctx, fw, fh, playerColors, true);

            // Additional gold shimmer overlay for player
            t.ctx.save();
            t.ctx.globalAlpha = 0.06;
            var shimmer = t.ctx.createLinearGradient(0, 0, fw, fh);
            shimmer.addColorStop(0, '#FFFFFF');
            shimmer.addColorStop(0.3, '#FFD700');
            shimmer.addColorStop(0.5, '#FFFFFF');
            shimmer.addColorStop(0.7, '#FFD700');
            shimmer.addColorStop(1, '#FFFFFF');
            t.ctx.fillStyle = shimmer;
            t.ctx.fillRect(0, 0, fw, fh);
            t.ctx.globalAlpha = 1.0;
            t.ctx.restore();

            finalize(t);
        }
    }

    /**
     * Generate power-up textures (4 types).
     */
    function generatePowerUpTextures(scene) {
        var SIZE = 44;
        var R = SIZE * 0.44;
        var cx = SIZE / 2;
        var cy = SIZE / 2;

        var types = [
            {
                key: 'powerup_SPEED',
                color: C.POWER_UP_COLORS.SPEED,
                draw: function (ctx) {
                    // Lightning bolt
                    ctx.beginPath();
                    ctx.moveTo(cx + 2, cy - R * 0.7);
                    ctx.lineTo(cx - 4, cy + 1);
                    ctx.lineTo(cx + 1, cy + 1);
                    ctx.lineTo(cx - 2, cy + R * 0.7);
                    ctx.lineTo(cx + 5, cy - 2);
                    ctx.lineTo(cx + 0, cy - 2);
                    ctx.closePath();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fill();
                }
            },
            {
                key: 'powerup_SHIELD',
                color: C.POWER_UP_COLORS.SHIELD,
                draw: function (ctx) {
                    // Hexagonal shield
                    var sr = R * 0.55;
                    ctx.beginPath();
                    for (var i = 0; i < 6; i++) {
                        var angle = (Math.PI / 3) * i - Math.PI / 2;
                        var px = cx + sr * Math.cos(angle);
                        var py = cy + sr * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    // Inner hex
                    ctx.beginPath();
                    for (var j = 0; j < 6; j++) {
                        var a2 = (Math.PI / 3) * j - Math.PI / 2;
                        var px2 = cx + sr * 0.55 * Math.cos(a2);
                        var py2 = cy + sr * 0.55 * Math.sin(a2);
                        if (j === 0) ctx.moveTo(px2, py2);
                        else ctx.lineTo(px2, py2);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }
            },
            {
                key: 'powerup_MAGNET',
                color: C.POWER_UP_COLORS.MAGNET,
                draw: function (ctx) {
                    // U-magnet shape
                    ctx.beginPath();
                    ctx.arc(cx, cy - 1, R * 0.4, Math.PI, 0, false);
                    ctx.lineTo(cx + R * 0.4, cy + R * 0.45);
                    ctx.lineTo(cx + R * 0.2, cy + R * 0.45);
                    ctx.lineTo(cx + R * 0.2, cy + 1);
                    ctx.arc(cx, cy - 1, R * 0.2, 0, Math.PI, true);
                    ctx.lineTo(cx - R * 0.2, cy + R * 0.45);
                    ctx.lineTo(cx - R * 0.4, cy + R * 0.45);
                    ctx.closePath();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fill();
                    // Red tip on left
                    ctx.fillStyle = '#FF4444';
                    ctx.fillRect(cx - R * 0.4, cy + R * 0.25, R * 0.2, R * 0.2);
                    // Blue tip on right
                    ctx.fillStyle = '#4444FF';
                    ctx.fillRect(cx + R * 0.2, cy + R * 0.25, R * 0.2, R * 0.2);
                }
            },
            {
                key: 'powerup_GROW',
                color: C.POWER_UP_COLORS.GROW,
                draw: function (ctx) {
                    // Double up arrows
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2.2;
                    ctx.lineCap = 'round';
                    // Left arrow
                    ctx.beginPath();
                    ctx.moveTo(cx - 4, cy + R * 0.3);
                    ctx.lineTo(cx - 4, cy - R * 0.4);
                    ctx.moveTo(cx - 8, cy - R * 0.1);
                    ctx.lineTo(cx - 4, cy - R * 0.4);
                    ctx.lineTo(cx, cy - R * 0.1);
                    ctx.stroke();
                    // Right arrow
                    ctx.beginPath();
                    ctx.moveTo(cx + 4, cy + R * 0.15);
                    ctx.lineTo(cx + 4, cy - R * 0.55);
                    ctx.moveTo(cx, cy - R * 0.25);
                    ctx.lineTo(cx + 4, cy - R * 0.55);
                    ctx.lineTo(cx + 8, cy - R * 0.25);
                    ctx.stroke();
                }
            }
        ];

        for (var i = 0; i < types.length; i++) {
            var pu = types[i];
            var t = createTex(scene, pu.key, SIZE, SIZE);
            var ctx = t.ctx;
            var colorStr = hexIntToStr(pu.color);

            // Outer glow
            ctx.save();
            ctx.shadowColor = colorStr;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            var orbGrad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx, cy, R);
            orbGrad.addColorStop(0, lighten(pu.color, 0.6));
            orbGrad.addColorStop(0.5, colorStr);
            orbGrad.addColorStop(1, darken(pu.color, 0.3));
            ctx.fillStyle = orbGrad;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();

            // Highlight arc
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.arc(cx - R * 0.15, cy - R * 0.15, R * 0.7, Math.PI * 1.1, Math.PI * 1.8);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Draw icon
            ctx.save();
            pu.draw(ctx);
            ctx.restore();

            finalize(t);
        }
    }

    /**
     * Generate hazard textures.
     */
    function generateHazardTextures(scene) {
        // ---- JELLYFISH ----
        (function () {
            var w = 60, h = 80;
            var t = createTex(scene, 'hazard_JELLYFISH', w, h);
            var ctx = t.ctx;
            var cx = w / 2;

            // Dome (bell)
            ctx.save();
            ctx.shadowColor = 'rgba(200,100,255,0.4)';
            ctx.shadowBlur = 8;

            var domeGrad = ctx.createRadialGradient(cx, 22, 2, cx, 25, 24);
            domeGrad.addColorStop(0, 'rgba(255,180,255,0.85)');
            domeGrad.addColorStop(0.5, 'rgba(200,100,220,0.7)');
            domeGrad.addColorStop(1, 'rgba(150,50,180,0.5)');

            ctx.beginPath();
            ctx.moveTo(cx - 22, 32);
            ctx.bezierCurveTo(cx - 24, 15, cx - 18, 4, cx, 3);
            ctx.bezierCurveTo(cx + 18, 4, cx + 24, 15, cx + 22, 32);
            // Wavy bottom edge of dome
            for (var i = 0; i <= 6; i++) {
                var wx = cx + 22 - (i * 44 / 6);
                var wy = 32 + (i % 2 === 0 ? 3 : -2);
                ctx.lineTo(wx, wy);
            }
            ctx.closePath();
            ctx.fillStyle = domeGrad;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();

            // Inner dome pattern
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.ellipse(cx, 18, 12, 10, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Tentacles
            ctx.save();
            ctx.lineCap = 'round';
            var tentacleColors = [
                'rgba(200,100,255,0.6)',
                'rgba(180,80,220,0.5)',
                'rgba(220,120,255,0.55)',
                'rgba(190,90,240,0.5)',
                'rgba(210,110,250,0.45)'
            ];

            for (var ti = 0; ti < 5; ti++) {
                var tx = cx - 14 + ti * 7;
                ctx.beginPath();
                ctx.moveTo(tx, 34);
                var tentLen = 30 + (ti % 3) * 8;
                // Wavy tentacle
                for (var seg = 0; seg < 4; seg++) {
                    var segY = 34 + (seg + 1) * (tentLen / 4);
                    var cpx = tx + (seg % 2 === 0 ? 5 : -5);
                    ctx.quadraticCurveTo(cpx, segY - tentLen / 8, tx + (seg % 2 === 0 ? 1 : -1), segY);
                }
                ctx.strokeStyle = tentacleColors[ti];
                ctx.lineWidth = 1.5 - ti * 0.1;
                ctx.stroke();
            }
            ctx.restore();

            // Eyes (small, cute)
            ctx.save();
            // Left eye
            ctx.beginPath();
            ctx.arc(cx - 6, 19, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx - 5.5, 19, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#2A0845';
            ctx.fill();
            // Right eye
            ctx.beginPath();
            ctx.arc(cx + 6, 19, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 6.5, 19, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#2A0845';
            ctx.fill();
            ctx.restore();

            finalize(t);
        })();

        // ---- PUFFERFISH (normal) ----
        (function () {
            var sz = 56;
            var t = createTex(scene, 'hazard_PUFFERFISH', sz, sz);
            var ctx = t.ctx;
            var cx = sz / 2, cy = sz / 2;
            var br = sz * 0.35;

            // Body
            ctx.save();
            var pbGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, br);
            pbGrad.addColorStop(0, '#FFF59D');
            pbGrad.addColorStop(0.6, '#FBC02D');
            pbGrad.addColorStop(1, '#F57F17');
            ctx.beginPath();
            ctx.arc(cx, cy, br, 0, Math.PI * 2);
            ctx.fillStyle = pbGrad;
            ctx.fill();
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

            // Small spines (retracted)
            ctx.save();
            ctx.strokeStyle = '#BF360C';
            ctx.lineWidth = 1;
            for (var s = 0; s < 10; s++) {
                var sa = (Math.PI * 2 / 10) * s;
                var sx1 = cx + Math.cos(sa) * br;
                var sy1 = cy + Math.sin(sa) * br;
                var sx2 = cx + Math.cos(sa) * (br + 3);
                var sy2 = cy + Math.sin(sa) * (br + 3);
                ctx.beginPath();
                ctx.moveTo(sx1, sy1);
                ctx.lineTo(sx2, sy2);
                ctx.stroke();
            }
            ctx.restore();

            // Spots
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#795548';
            var spots = [[cx - 5, cy - 6, 2.5], [cx + 6, cy - 3, 2], [cx - 3, cy + 5, 2.2], [cx + 4, cy + 6, 1.8]];
            for (var sp = 0; sp < spots.length; sp++) {
                ctx.beginPath();
                ctx.arc(spots[sp][0], spots[sp][1], spots[sp][2], 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Tail fin
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(cx - br + 2, cy);
            ctx.lineTo(cx - br - 8, cy - 6);
            ctx.lineTo(cx - br - 7, cy);
            ctx.lineTo(cx - br - 8, cy + 6);
            ctx.closePath();
            ctx.fillStyle = '#FF8F00';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Eyes
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx + 7, cy - 5, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + 8, cy - 5, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#1B0000';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 7.2, cy - 6, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fill();
            ctx.restore();

            // Mouth
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx + br * 0.7, cy + 2, 2, 0, Math.PI);
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            finalize(t);
        })();

        // ---- PUFFERFISH (inflated) ----
        (function () {
            var sz = 80;
            var t = createTex(scene, 'hazard_PUFFERFISH_inflated', sz, sz);
            var ctx = t.ctx;
            var cx = sz / 2, cy = sz / 2;
            var br = sz * 0.38;

            // Inflated body
            ctx.save();
            var pbGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, br);
            pbGrad.addColorStop(0, '#FFFDE7');
            pbGrad.addColorStop(0.5, '#FFF176');
            pbGrad.addColorStop(1, '#FFB300');
            ctx.beginPath();
            ctx.arc(cx, cy, br, 0, Math.PI * 2);
            ctx.fillStyle = pbGrad;
            ctx.fill();
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.restore();

            // Large spines (extended)
            ctx.save();
            ctx.strokeStyle = '#BF360C';
            ctx.fillStyle = '#D84315';
            ctx.lineWidth = 1.5;
            for (var s = 0; s < 16; s++) {
                var sa = (Math.PI * 2 / 16) * s;
                var sx1 = cx + Math.cos(sa) * br;
                var sy1 = cy + Math.sin(sa) * br;
                var sx2 = cx + Math.cos(sa) * (br + 10);
                var sy2 = cy + Math.sin(sa) * (br + 10);
                var perpX = -Math.sin(sa) * 2;
                var perpY = Math.cos(sa) * 2;
                ctx.beginPath();
                ctx.moveTo(sx1 - perpX, sy1 - perpY);
                ctx.lineTo(sx2, sy2);
                ctx.lineTo(sx1 + perpX, sy1 + perpY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();

            // Spots
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#795548';
            var spInflated = [[cx - 8, cy - 8, 3.5], [cx + 8, cy - 4, 3], [cx - 5, cy + 8, 3], [cx + 7, cy + 8, 2.5], [cx, cy - 10, 2]];
            for (var sp = 0; sp < spInflated.length; sp++) {
                ctx.beginPath();
                ctx.arc(spInflated[sp][0], spInflated[sp][1], spInflated[sp][2], 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Tail fin
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(cx - br + 3, cy);
            ctx.lineTo(cx - br - 10, cy - 8);
            ctx.lineTo(cx - br - 8, cy);
            ctx.lineTo(cx - br - 10, cy + 8);
            ctx.closePath();
            ctx.fillStyle = '#FF8F00';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Eyes (surprised / wider)
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx + 9, cy - 7, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Dilated pupils
            ctx.beginPath();
            ctx.arc(cx + 10, cy - 7, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#1B0000';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 9, cy - 8.5, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fill();
            ctx.restore();

            // Mouth (open O shape)
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx + br * 0.65, cy + 3, 3.5, 0, Math.PI * 2);
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();

            finalize(t);
        })();
    }

    /**
     * Generate background layer textures.
     */
    function generateBackgroundTextures(scene) {
        var W = C.GAME_WIDTH;
        var H = C.GAME_HEIGHT;

        // ---- BG LAYER 0: Far background (deep gradient + caustics) ----
        (function () {
            var t = createTex(scene, 'bg_layer_0', W, H);
            var ctx = t.ctx;

            // Ocean depth gradient
            var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, hexIntToStr(C.OCEAN_COLORS.SURFACE));
            bgGrad.addColorStop(0.35, hexIntToStr(C.OCEAN_COLORS.MID));
            bgGrad.addColorStop(0.7, hexIntToStr(C.OCEAN_COLORS.DEEP));
            bgGrad.addColorStop(1, hexIntToStr(C.OCEAN_COLORS.ABYSS));
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Subtle caustic light pattern
            ctx.save();
            ctx.globalAlpha = 0.04;
            ctx.strokeStyle = '#88CCFF';
            ctx.lineWidth = 2;
            // Pseudo-random caustic lines using deterministic seed approach
            for (var ci = 0; ci < 40; ci++) {
                var csx = (ci * 137.5) % W;
                var csy = (ci * 89.3) % (H * 0.5);
                ctx.beginPath();
                ctx.moveTo(csx, csy);
                ctx.bezierCurveTo(
                    csx + 30 + (ci % 7) * 8, csy + 15 + (ci % 5) * 6,
                    csx + 50 + (ci % 9) * 5, csy + 40 + (ci % 3) * 10,
                    csx + 20 + (ci % 11) * 7, csy + 60 + (ci % 4) * 8
                );
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Subtle vignette at edges
            ctx.save();
            var vigGrad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
            vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
            vigGrad.addColorStop(1, 'rgba(0,10,30,0.3)');
            ctx.fillStyle = vigGrad;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();

            finalize(t);
        })();

        // ---- BG LAYER 1: Mid layer (coral silhouettes in distance) ----
        (function () {
            var t = createTex(scene, 'bg_layer_1', W, H);
            var ctx = t.ctx;

            // Transparent base
            ctx.clearRect(0, 0, W, H);

            // Distant coral silhouettes at bottom
            ctx.save();
            ctx.globalAlpha = 0.12;

            var coralPositions = [
                { x: 80, w: 50, h: 120 },
                { x: 220, w: 35, h: 85 },
                { x: 400, w: 60, h: 140 },
                { x: 550, w: 40, h: 95 },
                { x: 700, w: 55, h: 110 },
                { x: 870, w: 45, h: 130 },
                { x: 1020, w: 50, h: 100 },
                { x: 1150, w: 65, h: 150 },
                { x: 1300, w: 40, h: 90 }
            ];

            for (var i = 0; i < coralPositions.length; i++) {
                var cp = coralPositions[i];
                drawCoralSilhouette(ctx, cp.x, H, cp.w, cp.h);
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Faint floating particles
            ctx.save();
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = '#AADDFF';
            for (var p = 0; p < 30; p++) {
                var px = (p * 173.7) % W;
                var py = (p * 97.3) % H;
                var pr = 1 + (p % 3);
                ctx.beginPath();
                ctx.arc(px, py, pr, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            ctx.restore();

            finalize(t);
        })();

        // ---- BG LAYER 2: Near layer (seaweed, rocks, coral decorations) ----
        (function () {
            var t = createTex(scene, 'bg_layer_2', W, H);
            var ctx = t.ctx;

            ctx.clearRect(0, 0, W, H);

            // Seaweed strands
            ctx.save();
            var seaweedPositions = [50, 180, 330, 500, 650, 810, 960, 1100, 1250, 1370];
            for (var si = 0; si < seaweedPositions.length; si++) {
                drawSeaweed(ctx, seaweedPositions[si], H, 60 + (si % 4) * 30, si);
            }
            ctx.restore();

            // Rocks at bottom
            ctx.save();
            ctx.globalAlpha = 0.25;
            drawRocks(ctx, W, H);
            ctx.globalAlpha = 1.0;
            ctx.restore();

            // Foreground coral pieces
            ctx.save();
            ctx.globalAlpha = 0.2;
            drawDecorativeCoral(ctx, 130, H - 15, 30, 45);
            drawDecorativeCoral(ctx, 580, H - 10, 25, 35);
            drawDecorativeCoral(ctx, 920, H - 12, 35, 50);
            drawDecorativeCoral(ctx, 1280, H - 8, 28, 40);
            ctx.globalAlpha = 1.0;
            ctx.restore();

            finalize(t);
        })();

        // ---- BUBBLE ----
        (function () {
            var sz = C.BUBBLE_MAX_SIZE * 2 + 4;
            var t = createTex(scene, 'bubble', sz, sz);
            var ctx = t.ctx;
            var bcx = sz / 2, bcy = sz / 2;
            var br = sz * 0.4;

            // Bubble body
            var bubGrad = ctx.createRadialGradient(bcx - br * 0.3, bcy - br * 0.3, 0, bcx, bcy, br);
            bubGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
            bubGrad.addColorStop(0.4, 'rgba(200,230,255,0.3)');
            bubGrad.addColorStop(0.8, 'rgba(150,200,255,0.15)');
            bubGrad.addColorStop(1, 'rgba(100,180,255,0.05)');
            ctx.beginPath();
            ctx.arc(bcx, bcy, br, 0, Math.PI * 2);
            ctx.fillStyle = bubGrad;
            ctx.fill();

            // Rim
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Highlight
            ctx.beginPath();
            ctx.arc(bcx - br * 0.25, bcy - br * 0.25, br * 0.22, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fill();

            finalize(t);
        })();

        // ---- LIGHT RAY ----
        (function () {
            var rw = 120;
            var rh = H * 0.7;
            var t = createTex(scene, 'light_ray', rw, Math.ceil(rh));
            var ctx = t.ctx;

            // Wedge shape tapering downward
            ctx.beginPath();
            ctx.moveTo(rw * 0.3, 0);
            ctx.lineTo(rw * 0.7, 0);
            ctx.lineTo(rw * 0.6, rh);
            ctx.lineTo(rw * 0.4, rh);
            ctx.closePath();

            var rayGrad = ctx.createLinearGradient(0, 0, 0, rh);
            rayGrad.addColorStop(0, 'rgba(255,255,240,0.12)');
            rayGrad.addColorStop(0.3, 'rgba(255,255,220,0.06)');
            rayGrad.addColorStop(0.7, 'rgba(255,255,200,0.02)');
            rayGrad.addColorStop(1, 'rgba(255,255,200,0.0)');
            ctx.fillStyle = rayGrad;
            ctx.fill();

            finalize(t);
        })();
    }

    /**
     * Draw a coral silhouette at given position.
     */
    function drawCoralSilhouette(ctx, x, groundY, width, height) {
        ctx.fillStyle = '#1A3A5C';

        // Main trunk
        ctx.beginPath();
        ctx.moveTo(x - width * 0.15, groundY);
        ctx.lineTo(x + width * 0.15, groundY);
        ctx.lineTo(x + width * 0.1, groundY - height * 0.5);
        ctx.bezierCurveTo(
            x + width * 0.3, groundY - height * 0.6,
            x + width * 0.5, groundY - height * 0.75,
            x + width * 0.35, groundY - height * 0.9
        );
        ctx.bezierCurveTo(
            x + width * 0.2, groundY - height,
            x - width * 0.1, groundY - height * 0.95,
            x - width * 0.2, groundY - height * 0.8
        );
        ctx.bezierCurveTo(
            x - width * 0.4, groundY - height * 0.7,
            x - width * 0.3, groundY - height * 0.55,
            x - width * 0.1, groundY - height * 0.5
        );
        ctx.closePath();
        ctx.fill();

        // Side branch
        ctx.beginPath();
        ctx.moveTo(x + width * 0.05, groundY - height * 0.4);
        ctx.bezierCurveTo(
            x + width * 0.4, groundY - height * 0.5,
            x + width * 0.55, groundY - height * 0.6,
            x + width * 0.4, groundY - height * 0.7
        );
        ctx.bezierCurveTo(
            x + width * 0.3, groundY - height * 0.65,
            x + width * 0.2, groundY - height * 0.5,
            x + width * 0.05, groundY - height * 0.4
        );
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw seaweed strand.
     */
    function drawSeaweed(ctx, x, groundY, height, seed) {
        var baseGreen = seed % 2 === 0 ? '#1B5E20' : '#2E7D32';
        ctx.save();
        ctx.globalAlpha = 0.18 + (seed % 3) * 0.04;
        ctx.strokeStyle = baseGreen;
        ctx.lineWidth = 3 + (seed % 2);
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x, groundY);

        var segments = 5;
        var segH = height / segments;
        for (var s = 0; s < segments; s++) {
            var sy = groundY - (s + 1) * segH;
            var sway = 8 * Math.sin(seed * 0.7 + s * 1.2) * (s + 1) * 0.3;
            ctx.quadraticCurveTo(x + sway * 1.5, sy + segH * 0.5, x + sway, sy);
        }
        ctx.stroke();

        // Leaf shapes along the stalk
        ctx.fillStyle = baseGreen;
        ctx.globalAlpha = 0.12 + (seed % 3) * 0.03;
        for (var l = 1; l < segments; l++) {
            var ly = groundY - l * segH;
            var lx = x + 6 * Math.sin(seed * 0.7 + l * 1.2) * l * 0.3;
            var side = l % 2 === 0 ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.quadraticCurveTo(lx + side * 14, ly - 8, lx + side * 6, ly - 18);
            ctx.quadraticCurveTo(lx + side * 2, ly - 10, lx, ly);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    /**
     * Draw scattered rocks at ground level.
     */
    function drawRocks(ctx, W, H) {
        var rockData = [
            { x: 60, w: 80, h: 25 },
            { x: 250, w: 50, h: 18 },
            { x: 450, w: 100, h: 30 },
            { x: 680, w: 65, h: 22 },
            { x: 850, w: 90, h: 28 },
            { x: 1050, w: 70, h: 20 },
            { x: 1200, w: 85, h: 26 },
            { x: 1350, w: 55, h: 19 }
        ];

        for (var i = 0; i < rockData.length; i++) {
            var r = rockData[i];
            ctx.beginPath();
            ctx.moveTo(r.x - r.w / 2, H);
            ctx.bezierCurveTo(
                r.x - r.w / 2, H - r.h,
                r.x - r.w * 0.2, H - r.h * 1.2,
                r.x, H - r.h
            );
            ctx.bezierCurveTo(
                r.x + r.w * 0.2, H - r.h * 1.1,
                r.x + r.w / 2, H - r.h * 0.6,
                r.x + r.w / 2, H
            );
            ctx.closePath();

            var rockGrad = ctx.createLinearGradient(r.x, H - r.h, r.x, H);
            rockGrad.addColorStop(0, '#3E2723');
            rockGrad.addColorStop(1, '#1A1009');
            ctx.fillStyle = rockGrad;
            ctx.fill();
        }
    }

    /**
     * Draw decorative foreground coral.
     */
    function drawDecorativeCoral(ctx, x, groundY, width, height) {
        // Branch coral
        var branches = [
            { angle: -0.3, len: height },
            { angle: 0.4, len: height * 0.8 },
            { angle: -0.8, len: height * 0.6 }
        ];

        for (var b = 0; b < branches.length; b++) {
            var br = branches[b];
            ctx.save();
            ctx.translate(x, groundY);
            ctx.rotate(br.angle);
            ctx.beginPath();
            ctx.moveTo(-width * 0.08, 0);
            ctx.lineTo(width * 0.08, 0);
            ctx.lineTo(width * 0.04, -br.len);
            ctx.lineTo(-width * 0.04, -br.len);
            ctx.closePath();

            var coralGrad = ctx.createLinearGradient(0, 0, 0, -br.len);
            coralGrad.addColorStop(0, '#D84315');
            coralGrad.addColorStop(1, '#FF7043');
            ctx.fillStyle = coralGrad;
            ctx.fill();

            // Round tip
            ctx.beginPath();
            ctx.arc(0, -br.len, width * 0.06, 0, Math.PI * 2);
            ctx.fillStyle = '#FF8A65';
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Generate UI element textures.
     */
    function generateUITextures(scene) {
        // ---- HEART FULL ----
        (function () {
            var sz = 32;
            var t = createTex(scene, 'heart_full', sz, sz);
            var ctx = t.ctx;
            var hcx = sz / 2, hcy = sz / 2 + 2;

            ctx.save();
            ctx.shadowColor = 'rgba(255,0,0,0.4)';
            ctx.shadowBlur = 4;

            ctx.beginPath();
            ctx.moveTo(hcx, hcy + 8);
            ctx.bezierCurveTo(hcx - 14, hcy + 2, hcx - 14, hcy - 8, hcx - 7, hcy - 8);
            ctx.bezierCurveTo(hcx - 3, hcy - 8, hcx, hcy - 5, hcx, hcy - 3);
            ctx.bezierCurveTo(hcx, hcy - 5, hcx + 3, hcy - 8, hcx + 7, hcy - 8);
            ctx.bezierCurveTo(hcx + 14, hcy - 8, hcx + 14, hcy + 2, hcx, hcy + 8);
            ctx.closePath();

            var heartGrad = ctx.createLinearGradient(hcx, hcy - 10, hcx, hcy + 10);
            heartGrad.addColorStop(0, '#FF5252');
            heartGrad.addColorStop(0.4, '#F44336');
            heartGrad.addColorStop(1, '#B71C1C');
            ctx.fillStyle = heartGrad;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();

            // Shine
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.ellipse(hcx - 4, hcy - 5, 3.5, 2.2, -0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();

            finalize(t);
        })();

        // ---- HEART EMPTY ----
        (function () {
            var sz = 32;
            var t = createTex(scene, 'heart_empty', sz, sz);
            var ctx = t.ctx;
            var hcx = sz / 2, hcy = sz / 2 + 2;

            ctx.beginPath();
            ctx.moveTo(hcx, hcy + 8);
            ctx.bezierCurveTo(hcx - 14, hcy + 2, hcx - 14, hcy - 8, hcx - 7, hcy - 8);
            ctx.bezierCurveTo(hcx - 3, hcy - 8, hcx, hcy - 5, hcx, hcy - 3);
            ctx.bezierCurveTo(hcx, hcy - 5, hcx + 3, hcy - 8, hcx + 7, hcy - 8);
            ctx.bezierCurveTo(hcx + 14, hcy - 8, hcx + 14, hcy + 2, hcx, hcy + 8);
            ctx.closePath();

            ctx.fillStyle = 'rgba(80,80,80,0.4)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(150,150,150,0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            finalize(t);
        })();

        // ---- BUTTON BACKGROUND ----
        (function () {
            var bw = 220, bh = 56;
            var t = createTex(scene, 'btn_bg', bw, bh);
            var ctx = t.ctx;
            var radius = 14;

            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(bw - radius, 0);
            ctx.quadraticCurveTo(bw, 0, bw, radius);
            ctx.lineTo(bw, bh - radius);
            ctx.quadraticCurveTo(bw, bh, bw - radius, bh);
            ctx.lineTo(radius, bh);
            ctx.quadraticCurveTo(0, bh, 0, bh - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();

            var btnGrad = ctx.createLinearGradient(0, 0, 0, bh);
            btnGrad.addColorStop(0, 'rgba(60,120,200,0.7)');
            btnGrad.addColorStop(0.5, 'rgba(40,90,170,0.65)');
            btnGrad.addColorStop(1, 'rgba(20,60,140,0.7)');
            ctx.fillStyle = btnGrad;
            ctx.fill();

            // Border
            ctx.strokeStyle = 'rgba(100,180,255,0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Top highlight
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.moveTo(radius + 4, 2);
            ctx.lineTo(bw - radius - 4, 2);
            ctx.quadraticCurveTo(bw - 4, 2, bw - 4, radius);
            ctx.lineTo(bw - 4, bh * 0.35);
            ctx.lineTo(4, bh * 0.35);
            ctx.lineTo(4, radius);
            ctx.quadraticCurveTo(4, 2, radius + 4, 2);
            ctx.closePath();
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();

            finalize(t);
        })();

        // ---- FRENZY BAR BACKGROUND ----
        (function () {
            var fw = 200, fh = 18;
            var t = createTex(scene, 'frenzy_bar_bg', fw, fh);
            var ctx = t.ctx;
            var r = fh / 2;

            roundedRect(ctx, 0, 0, fw, fh, r);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            finalize(t);
        })();

        // ---- FRENZY BAR FILL ----
        (function () {
            var fw = 200, fh = 18;
            var t = createTex(scene, 'frenzy_bar_fill', fw, fh);
            var ctx = t.ctx;
            var r = fh / 2;

            roundedRect(ctx, 0, 0, fw, fh, r);
            var fillGrad = ctx.createLinearGradient(0, 0, fw, 0);
            fillGrad.addColorStop(0, '#FFD700');
            fillGrad.addColorStop(0.5, '#FF8C00');
            fillGrad.addColorStop(1, '#FF4500');
            ctx.fillStyle = fillGrad;
            ctx.fill();

            // Shine
            ctx.save();
            ctx.globalAlpha = 0.2;
            roundedRect(ctx, 2, 1, fw - 4, fh * 0.4, r - 1);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();

            finalize(t);
        })();

        // ---- PARTICLE CIRCLE ----
        (function () {
            var sz = 8;
            var t = createTex(scene, 'particle_circle', sz, sz);
            var ctx = t.ctx;

            var pcGrad = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
            pcGrad.addColorStop(0, 'rgba(255,255,255,1)');
            pcGrad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
            pcGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(sz / 2, sz / 2, sz / 2, 0, Math.PI * 2);
            ctx.fillStyle = pcGrad;
            ctx.fill();

            finalize(t);
        })();

        // ---- PARTICLE STAR ----
        (function () {
            var sz = 12;
            var t = createTex(scene, 'particle_star', sz, sz);
            var ctx = t.ctx;
            var scx = sz / 2, scy = sz / 2;

            ctx.save();
            ctx.shadowColor = 'rgba(255,255,200,0.5)';
            ctx.shadowBlur = 3;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            for (var i = 0; i < 5; i++) {
                var outerAngle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                var innerAngle = outerAngle + Math.PI / 5;
                var outerR = sz * 0.42;
                var innerR = sz * 0.18;
                ctx.lineTo(scx + Math.cos(outerAngle) * outerR, scy + Math.sin(outerAngle) * outerR);
                ctx.lineTo(scx + Math.cos(innerAngle) * innerR, scy + Math.sin(innerAngle) * innerR);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();

            finalize(t);
        })();
    }

    /**
     * Draw a rounded rectangle path.
     */
    function roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /**
     * Generate menu textures.
     */
    function generateMenuTextures(scene) {
        // ---- LOGO TEXT: "피딩 프렌지" ----
        (function () {
            var text = '피딩 프렌지';
            var fontSize = 72;
            var padding = 30;

            // Measure text first using a temp canvas
            var measure = document.createElement('canvas').getContext('2d');
            measure.font = 'bold ' + fontSize + 'px "Noto Sans KR", sans-serif';
            var metrics = measure.measureText(text);
            var tw = Math.ceil(metrics.width) + padding * 2;
            var th = fontSize + padding * 2;

            var t = createTex(scene, 'logo_text', tw, th);
            var ctx = t.ctx;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold ' + fontSize + 'px "Noto Sans KR", sans-serif';

            var tcx = tw / 2;
            var tcy = th / 2;

            // Text shadow / glow
            ctx.save();
            ctx.shadowColor = 'rgba(0,150,255,0.6)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3;

            // Gradient fill for the text
            var textGrad = ctx.createLinearGradient(0, tcy - fontSize / 2, 0, tcy + fontSize / 2);
            textGrad.addColorStop(0, '#FFFFFF');
            textGrad.addColorStop(0.3, '#FFD700');
            textGrad.addColorStop(0.7, '#FF8C00');
            textGrad.addColorStop(1, '#FF6B35');
            ctx.fillStyle = textGrad;
            ctx.fillText(text, tcx, tcy);

            ctx.shadowBlur = 0;
            ctx.restore();

            // Outline
            ctx.save();
            ctx.strokeStyle = 'rgba(0,50,100,0.7)';
            ctx.lineWidth = 2;
            ctx.strokeText(text, tcx, tcy);
            ctx.restore();

            // Top highlight pass
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, tw, th / 2);
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();

            finalize(t);
        })();

        // ---- MENU FISH (decorative, medium-large, colorful) ----
        (function () {
            var fw = 120, fh = 80;
            var t = createTex(scene, 'menu_fish', fw, fh);
            var menuColors = {
                body:    0xFF6B35,
                belly:   0xFFE0B2,
                fin:     0xE65100,
                outline: 0xBF360C
            };
            drawFish(t.ctx, fw, fh, menuColors, false);
            finalize(t);
        })();
    }

    // ========================================
    // PUBLIC API
    // ========================================

    return {
        /**
         * Generate all game textures and register them with the Phaser scene's texture manager.
         * Call this once during BootScene.create() or preload().
         *
         * @param {Phaser.Scene} scene - The Phaser scene to register textures with.
         */
        generateAll: function (scene) {
            // Fish sprites: 8 colors x 5 sizes = 40 textures
            generateFishTextures(scene);

            // Player fish: 5 size variants
            generatePlayerTextures(scene);

            // Power-ups: 4 types
            generatePowerUpTextures(scene);

            // Hazards: JELLYFISH, PUFFERFISH, PUFFERFISH_inflated
            generateHazardTextures(scene);

            // Backgrounds: 3 layers + bubble + light_ray
            generateBackgroundTextures(scene);

            // UI: hearts, buttons, bars, particles
            generateUITextures(scene);

            // Menu: logo text, decorative fish
            generateMenuTextures(scene);
        }
    };

})();
