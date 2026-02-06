class LevelClearScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelClearScene' });
  }

  init(data) {
    this.level = data.level || 1;
    this.score = data.score || 0;
    this.nextLevel = data.nextLevel || this.level + 1;
    this.lives = data.lives || 3;
    this.continuePressed = false;
  }

  create() {
    const GAME_WIDTH = window.Constants.GAME_WIDTH;
    const GAME_HEIGHT = window.Constants.GAME_HEIGHT;
    const DEPTH = window.Constants.DEPTH;

    // Ocean gradient background
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillGradientStyle(0x1a5f7a, 0x1a5f7a, 0x2ba3d0, 0x2ba3d0, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.generateTexture('levelClearBg', GAME_WIDTH, GAME_HEIGHT);
    graphics.destroy();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'levelClearBg').setDepth(0);

    // Add sparkle particles if texture exists
    if (this.textures.exists('particle_star')) {
      const emitter = this.add.particles(0, 0, 'particle_star', {
        x: { min: 100, max: GAME_WIDTH - 100 },
        y: { min: 100, max: GAME_HEIGHT - 100 },
        speed: { min: -100, max: 100 },
        angle: { min: 240, max: 300 },
        scale: { start: 0.5, end: 0 },
        lifespan: 2000,
        frequency: 100,
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT)
        }
      });
      emitter.setDepth(10);
    }

    // Calculate star rating based on score
    const stars = this.calculateStarRating(this.level, this.score);

    // Level clear text - Big celebratory
    const levelClearText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, `레벨 ${this.level} 클리어!`, {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '80px',
        fontStyle: 'bold',
        color: '#FFD700',
        stroke: '#FF8C00',
        strokeThickness: 4,
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.HUD)
      .setScale(0);

    // Bounce-in animation for level clear text
    this.tweens.add({
      targets: levelClearText,
      scale: 1,
      duration: 800,
      ease: 'Elastic.out'
    });

    // Subtitle - Encouraging
    const subtitleText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '잘했어!', {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#FFFFFF',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.HUD)
      .setScale(0);

    this.tweens.add({
      targets: subtitleText,
      scale: 1,
      duration: 600,
      delay: 300,
      ease: 'Elastic.out'
    });

    // Score display
    const scoreText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `점수: ${this.formatNumber(this.score)}`, {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#FFD700',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.HUD)
      .setAlpha(0);

    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      duration: 400,
      delay: 600
    });

    // Next level indicator
    const nextLevelText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, `다음: 레벨 ${this.nextLevel}`, {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '32px',
        color: '#90EE90',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.HUD)
      .setAlpha(0);

    this.tweens.add({
      targets: nextLevelText,
      alpha: 1,
      duration: 400,
      delay: 800
    });

    // Star rating display
    const starY = GAME_HEIGHT / 2 - 240;
    const starSpacing = 80;
    const startX = GAME_WIDTH / 2 - (starSpacing * (stars - 1)) / 2;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * starSpacing;
      const starColor = i < stars ? '#FFD700' : '#444444';
      const starScale = i < stars ? 1 : 0.6;

      const star = this.add
        .text(starX, starY, '★', {
          fontSize: '60px',
          color: starColor
        })
        .setOrigin(0.5, 0.5)
        .setDepth(DEPTH.HUD)
        .setScale(0);

      // Stars appear one by one
      this.tweens.add({
        targets: star,
        scale: starScale,
        duration: 400,
        delay: 1000 + i * 200,
        ease: 'Back.out'
      });
    }

    // Continue prompt text
    const continueText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '터치하여 계속...', {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '24px',
        color: '#FFFFFF',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.HUD)
      .setAlpha(0);

    this.tweens.add({
      targets: continueText,
      alpha: 1,
      duration: 300,
      delay: 1600
    });

    // Pulse animation for continue text
    this.tweens.add({
      targets: continueText,
      scale: 1.1,
      duration: 600,
      delay: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inout'
    });

    // Input handling - tap to continue
    this.input.on('pointerdown', () => {
      if (!this.continuePressed) {
        this.continuePressed = true;
        this.goToNextLevel();
      }
    });

    // Auto-transition after 3 seconds
    this.time.delayedCall(3000, () => {
      if (!this.continuePressed) {
        this.continuePressed = true;
        this.goToNextLevel();
      }
    });
  }

  calculateStarRating(level, score) {
    // Simple star rating based on score
    const baseScore = level * 1000;
    const ratio = score / baseScore;

    if (ratio >= 2) return 3;
    if (ratio >= 1.2) return 2;
    return 1;
  }

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  goToNextLevel() {
    this.scene.start('GameScene', {
      level: this.nextLevel,
      score: this.score,
      lives: this.lives
    });
  }
}

window.LevelClearScene = LevelClearScene;
