/**
 * TutorialScene.js
 * Visual step-by-step tutorial for 8-year-old children
 */

class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
        this.currentPage = 0;
        this.totalPages = 4;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Ocean gradient background
        this.createBackground();

        // Container for tutorial pages
        this.pages = [];
        this.createAllPages();

        // Page indicator dots
        this.createPageIndicators();

        // Skip button
        this.createSkipButton();

        // Show first page
        this.showPage(0);
    }

    createBackground() {
        const { width, height } = this.cameras.main;

        // Ocean gradient (light blue to darker blue)
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x1E90FF, 0x1E90FF, 1);
        gradient.fillRect(0, 0, width, height);
    }

    createAllPages() {
        this.pages.push(this.createPage1()); // Move tutorial
        this.pages.push(this.createPage2()); // Eat smaller fish
        this.pages.push(this.createPage3()); // Avoid bigger fish
        this.pages.push(this.createPage4()); // Collect power-ups
    }

    createPage1() {
        const { width, height } = this.cameras.main;
        const container = this.add.container(0, 0);

        // Title text
        const title = this.add.text(width / 2, 100, '손가락으로 움직여요!', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        container.add(title);

        // Draw player fish (larger)
        const fish = this.add.image(width / 2, height / 2, 'player_0').setScale(2.5);
        container.add(fish);

        // Animated hand icon
        const hand = this.add.text(width / 2 + 150, height / 2 - 100, '👆', {
            fontSize: '80px'
        }).setOrigin(0.5);
        container.add(hand);

        // Animate hand moving
        this.tweens.add({
            targets: hand,
            x: width / 2 - 150,
            y: height / 2 + 100,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Animate fish following hand
        this.tweens.add({
            targets: fish,
            x: width / 2 - 100,
            y: height / 2 + 50,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: 200
        });

        // Next button
        const nextBtn = this.createNextButton(container);
        container.add(nextBtn);

        container.setVisible(false);
        return container;
    }

    createPage2() {
        const { width, height } = this.cameras.main;
        const container = this.add.container(0, 0);

        // Title text
        const title = this.add.text(width / 2, 100, '작은 물고기를 먹어요!', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        container.add(title);

        // Player fish (medium size)
        const player = this.add.image(width / 2 - 150, height / 2, 'player_0').setScale(2);
        container.add(player);

        // Smaller fish with green highlight
        const smallFish = this.add.image(width / 2 + 150, height / 2, 'fish_0_0').setScale(1.5);
        container.add(smallFish);

        // Green circle highlight
        const greenCircle = this.add.circle(width / 2 + 150, height / 2, 60, 0x00ff00, 0.3);
        greenCircle.setStrokeStyle(4, 0x00ff00);
        container.add(greenCircle);

        // Pulsing animation for green circle
        this.tweens.add({
            targets: greenCircle,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Arrow pointing from player to small fish
        const arrow = this.add.text(width / 2, height / 2, '➡️', {
            fontSize: '60px'
        }).setOrigin(0.5);
        container.add(arrow);

        // Eating animation
        this.tweens.add({
            targets: smallFish,
            x: width / 2 - 150,
            scale: 0,
            duration: 1500,
            delay: 1000,
            repeat: -1,
            repeatDelay: 1000,
            onRepeat: () => {
                smallFish.setScale(1.5);
                smallFish.x = width / 2 + 150;
            }
        });

        // Next button
        const nextBtn = this.createNextButton(container);
        container.add(nextBtn);

        container.setVisible(false);
        return container;
    }

    createPage3() {
        const { width, height } = this.cameras.main;
        const container = this.add.container(0, 0);

        // Title text
        const title = this.add.text(width / 2, 100, '큰 물고기는 피해요!', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        container.add(title);

        // Player fish (small)
        const player = this.add.image(width / 2 - 200, height / 2 + 50, 'player_0').setScale(1.5);
        container.add(player);

        // Bigger fish with red highlight
        const bigFish = this.add.image(width / 2 + 150, height / 2, 'fish_2_2').setScale(2.5);
        bigFish.setFlipX(true);
        container.add(bigFish);

        // Red circle highlight
        const redCircle = this.add.circle(width / 2 + 150, height / 2, 90, 0xff0000, 0.3);
        redCircle.setStrokeStyle(4, 0xff0000);
        container.add(redCircle);

        // Pulsing animation for red circle
        this.tweens.add({
            targets: redCircle,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.5,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        // Warning sign
        const warning = this.add.text(width / 2 - 50, height / 2 - 100, '⚠️', {
            fontSize: '80px'
        }).setOrigin(0.5);
        container.add(warning);

        // Shake warning
        this.tweens.add({
            targets: warning,
            angle: -10,
            duration: 200,
            yoyo: true,
            repeat: -1
        });

        // Player escaping animation
        this.tweens.add({
            targets: player,
            x: width / 2 - 300,
            y: height / 2 + 100,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });

        // Next button
        const nextBtn = this.createNextButton(container);
        container.add(nextBtn);

        container.setVisible(false);
        return container;
    }

    createPage4() {
        const { width, height } = this.cameras.main;
        const container = this.add.container(0, 0);

        // Title text
        const title = this.add.text(width / 2, 80, '파워업을 모아요!', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        container.add(title);

        // Power-up examples
        const powerUps = [
            { icon: '⚡', text: '빠른 속도!', y: 220, color: '#ffff00' },
            { icon: '🛡️', text: '보호막!', y: 340, color: '#00ffff' },
            { icon: '⭐', text: '보너스 점수!', y: 460, color: '#ffa500' },
            { icon: '💎', text: '특별한 능력!', y: 580, color: '#ff00ff' }
        ];

        powerUps.forEach((pu, index) => {
            // Icon
            const icon = this.add.text(width / 2 - 200, pu.y, pu.icon, {
                fontSize: '64px'
            }).setOrigin(0.5);
            container.add(icon);

            // Description
            const desc = this.add.text(width / 2 + 50, pu.y, pu.text, {
                fontFamily: 'Noto Sans KR, sans-serif',
                fontSize: '36px',
                color: pu.color,
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            container.add(desc);

            // Floating animation
            this.tweens.add({
                targets: icon,
                y: pu.y - 10,
                duration: 800,
                yoyo: true,
                repeat: -1,
                delay: index * 200
            });
        });

        // Start button (instead of Next)
        const startBtn = this.createStartButton(container);
        container.add(startBtn);

        container.setVisible(false);
        return container;
    }

    createNextButton(container) {
        const { width, height } = this.cameras.main;

        const button = this.add.container(width / 2, height - 100);

        const bg = this.add.rectangle(0, 0, 200, 80, 0x4CAF50);
        bg.setStrokeStyle(4, 0xffffff);

        const text = this.add.text(0, 0, '다음', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        button.add([bg, text]);
        button.setSize(200, 80);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            this.nextPage();
        });

        button.on('pointerover', () => {
            bg.setFillStyle(0x45a049);
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0x4CAF50);
        });

        return button;
    }

    createStartButton(container) {
        const { width, height } = this.cameras.main;

        const button = this.add.container(width / 2, height - 100);

        const bg = this.add.rectangle(0, 0, 250, 90, 0xFF5722);
        bg.setStrokeStyle(4, 0xffffff);

        const text = this.add.text(0, 0, '시작!', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '44px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        button.add([bg, text]);
        button.setSize(250, 90);
        button.setInteractive({ useHandCursor: true });

        // Pulsing animation
        this.tweens.add({
            targets: button,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        button.on('pointerdown', () => {
            this.completeTutorial();
        });

        button.on('pointerover', () => {
            bg.setFillStyle(0xe64a19);
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0xFF5722);
        });

        return button;
    }

    createPageIndicators() {
        const { width, height } = this.cameras.main;
        this.indicators = [];

        const startX = width / 2 - (this.totalPages * 30) / 2;
        const y = height - 40;

        for (let i = 0; i < this.totalPages; i++) {
            const dot = this.add.circle(startX + i * 30, y, 8, 0xffffff, 0.5);
            dot.setDepth(100);
            this.indicators.push(dot);
        }
    }

    createSkipButton() {
        const { width } = this.cameras.main;

        const skipBtn = this.add.text(width - 20, 20, '건너뛰기', {
            fontFamily: 'Noto Sans KR, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#00000066',
            padding: { x: 16, y: 8 }
        }).setOrigin(1, 0);

        skipBtn.setInteractive({ useHandCursor: true });
        skipBtn.setDepth(100);

        skipBtn.on('pointerdown', () => {
            this.completeTutorial();
        });

        skipBtn.on('pointerover', () => {
            skipBtn.setStyle({ backgroundColor: '#000000aa' });
        });

        skipBtn.on('pointerout', () => {
            skipBtn.setStyle({ backgroundColor: '#00000066' });
        });
    }

    showPage(pageIndex) {
        // Hide all pages
        this.pages.forEach(page => page.setVisible(false));

        // Show current page
        if (this.pages[pageIndex]) {
            this.pages[pageIndex].setVisible(true);
        }

        // Update indicators
        this.indicators.forEach((dot, index) => {
            if (index === pageIndex) {
                dot.setAlpha(1);
                dot.setRadius(10);
            } else {
                dot.setAlpha(0.5);
                dot.setRadius(8);
            }
        });
    }

    nextPage() {
        this.currentPage++;
        if (this.currentPage >= this.totalPages) {
            this.currentPage = this.totalPages - 1;
        }
        this.showPage(this.currentPage);
    }

    completeTutorial() {
        // Mark tutorial as seen
        localStorage.setItem('ff_tutorial_seen', 'true');

        // Fade out and start game
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
        });
    }
}

// Attach to window
window.TutorialScene = TutorialScene;
