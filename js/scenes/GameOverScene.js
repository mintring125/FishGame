class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.score = data?.score || 0;
    this.level = data?.level || 1;
    this.highScore = data?.highScore || 0;
    this.gameComplete = data?.gameComplete || false;
    this.isNewRecord = this.score > this.highScore;
  }

  create() {
    const GAME_WIDTH = window.Constants.GAME_WIDTH;
    const GAME_HEIGHT = window.Constants.GAME_HEIGHT;

    // Ocean gradient background
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillGradientStyle(0x1a3a52, 0x1a3a52, 0x0d5a7a, 0x0d5a7a, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.generateTexture('gameOverBg', GAME_WIDTH, GAME_HEIGHT);
    graphics.destroy();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'gameOverBg');

    // Title based on game complete state
    const titleText = this.gameComplete ? '축하합니다!' : '게임 오버';
    const titleColor = this.gameComplete ? '#FFD700' : '#FF6B6B';
    const subtitleText = this.gameComplete ? '모든 레벨 클리어!' : '다시 도전해봐!';

    const title = this.add.text(GAME_WIDTH / 2, 100, titleText, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '72px',
      fontStyle: 'bold',
      fill: titleColor,
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
    title.setAlpha(0);

    const subtitle = this.add.text(GAME_WIDTH / 2, 180, subtitleText, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '36px',
      fill: '#FFFFFF',
      align: 'center',
    });
    subtitle.setOrigin(0.5, 0.5);
    subtitle.setAlpha(0);

    // Fade in animations
    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 600,
      ease: 'Power2.easeOut',
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 200,
      ease: 'Power2.easeOut',
    });

    // Score display section
    const scoreY = 300;

    // Final score
    const scoreLabel = this.add.text(GAME_WIDTH / 2, scoreY, '점수:', {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '32px',
      fill: '#FFFFFF',
      align: 'center',
    });
    scoreLabel.setOrigin(0.5, 0.5);
    scoreLabel.setAlpha(0);

    const scoreValue = this.add.text(GAME_WIDTH / 2, scoreY + 50, '0', {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      fill: '#FFD700',
      align: 'center',
    });
    scoreValue.setOrigin(0.5, 0.5);
    scoreValue.setAlpha(0);

    this.tweens.add({
      targets: scoreLabel,
      alpha: 1,
      duration: 400,
      delay: 400,
      ease: 'Power2.easeOut',
    });

    this.tweens.add({
      targets: scoreValue,
      alpha: 1,
      duration: 400,
      delay: 400,
      ease: 'Power2.easeOut',
    });

    // Count-up animation for score
    const counter = { value: 0 };
    this.tweens.add({
      targets: counter,
      value: this.score,
      duration: 1200,
      delay: 500,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        scoreValue.setText(Math.floor(counter.value).toLocaleString());
      },
    });

    // High score display
    const highScoreY = 420;
    const highScoreLabel = this.add.text(GAME_WIDTH / 2, highScoreY, '최고 점수:', {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '28px',
      fill: '#FFFFFF',
      align: 'center',
    });
    highScoreLabel.setOrigin(0.5, 0.5);
    highScoreLabel.setAlpha(0);

    const displayHighScore = this.highScore.toLocaleString();
    const highScoreValue = this.add.text(GAME_WIDTH / 2, highScoreY + 45, displayHighScore, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '40px',
      fontStyle: 'bold',
      fill: '#FFD700',
      align: 'center',
    });
    highScoreValue.setOrigin(0.5, 0.5);
    highScoreValue.setAlpha(0);

    this.tweens.add({
      targets: highScoreLabel,
      alpha: 1,
      duration: 400,
      delay: 600,
      ease: 'Power2.easeOut',
    });

    this.tweens.add({
      targets: highScoreValue,
      alpha: 1,
      duration: 400,
      delay: 600,
      ease: 'Power2.easeOut',
    });

    // New record badge
    if (this.isNewRecord) {
      const newRecordText = this.add.text(GAME_WIDTH / 2 + 180, highScoreY + 45, '새 기록!', {
        fontFamily: 'Noto Sans KR, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        fill: '#FFD700',
        backgroundColor: '#FF6B6B',
        padding: { x: 12, y: 6 },
      });
      newRecordText.setOrigin(0, 0.5);
      newRecordText.setAlpha(0);

      this.tweens.add({
        targets: newRecordText,
        alpha: 1,
        duration: 400,
        delay: 700,
        ease: 'Power2.easeOut',
      });

      // Pulse animation for new record
      this.tweens.add({
        targets: newRecordText,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 600,
        delay: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Level reached display
    const levelY = 530;
    const levelText = this.add.text(GAME_WIDTH / 2, levelY, `도달 레벨: ${this.level}`, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '28px',
      fill: '#FFFFFF',
      align: 'center',
    });
    levelText.setOrigin(0.5, 0.5);
    levelText.setAlpha(0);

    this.tweens.add({
      targets: levelText,
      alpha: 1,
      duration: 400,
      delay: 700,
      ease: 'Power2.easeOut',
    });

    // Buttons
    const buttonY = 680;
    const buttonWidth = 200;
    const buttonHeight = 70;
    const buttonGap = 50;

    // Play Again button
    const playAgainBtn = this.createButton(
      GAME_WIDTH / 2 - (buttonWidth + buttonGap / 2),
      buttonY,
      buttonWidth,
      buttonHeight,
      '다시 하기',
      '#4CAF50'
    );
    playAgainBtn.setAlpha(0);
    this.tweens.add({
      targets: playAgainBtn,
      alpha: 1,
      duration: 400,
      delay: 900,
      ease: 'Power2.easeOut',
    });

    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.on('pointerdown', () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameScene');
    });

    // Menu button
    const menuBtn = this.createButton(
      GAME_WIDTH / 2 + (buttonWidth + buttonGap / 2),
      buttonY,
      buttonWidth,
      buttonHeight,
      '메뉴로',
      '#2196F3'
    );
    menuBtn.setAlpha(0);
    this.tweens.add({
      targets: menuBtn,
      alpha: 1,
      duration: 400,
      delay: 900,
      ease: 'Power2.easeOut',
    });

    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.scene.stop('HUDScene');
      this.scene.start('MenuScene');
    });

    // Button hover effects
    this.addButtonHover(playAgainBtn);
    this.addButtonHover(menuBtn);
  }

  createButton(x, y, width, height, text, color) {
    const button = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    button.add(bg);

    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(3, 0xFFFFFF, 0.8);
    borderGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    button.add(borderGraphics);

    const txt = this.add.text(0, 0, text, {
      fontFamily: 'Noto Sans KR, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      fill: '#FFFFFF',
      align: 'center',
    });
    txt.setOrigin(0.5, 0.5);
    button.add(txt);

    button.setSize(width, height);
    button.setData('width', width);
    button.setData('height', height);
    button.setData('baseColor', color);

    return button;
  }

  addButtonHover(button) {
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Power2.easeOut',
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2.easeOut',
      });
    });
  }
}

window.GameOverScene = GameOverScene;
