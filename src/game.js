
/* 
Made with Phaser 3

The game is a tweaked version of the lecture demo. 
Changes: 

faster pace
at the start always spawn on top of at least 1 platform,
some platforms move
added a more rare blue star
added wall jump
move with arrow keys
shoot enemies(ships) with mouse, if you get hit you start over
added music and sounds for star pick ups and lasers

Code sources:

Lecture demo week 7
Getting started with Phaser3: https://phaser.io/tutorials/getting-started-phaser3/index
Phaser labs examples: https://labs.phaser.io/
  -> Shooting logic from: https://github.com/photonstorm/phaser3-examples/blob/master/public/src/physics/arcade/topdown%20shooter%20combat%20mechanics.js 
  -> Move to object logic from: https://github.com/photonstorm/phaser3-examples/blob/master/public/src/physics/arcade/move%20to%20pointer.js


Assets: 

Lecture demo week 7
Getting started with Phaser3: https://phaser.io/tutorials/getting-started-phaser3/index
CanonInD.mp3 https://incompetech.com/music/royalty-free/index.html?isrc=usuan1100301
PickUp.mp3 and Laser.mp3 from pixabay.com
Ship2.png can't find source anymore
AirBach.mp3 cant find source anymore
*/

let game;

const gameOptions = {
  dudeGravity: 800,
  dudeSpeed: 300
};

window.onload = function () {
  let gameConfig = {
    type: Phaser.AUTO,
    backgroundColor: "#000c1f",

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 1000
    },

    pixelArt: true,

    physics: {
      default: "arcade",
      arcade: {
        gravity: {
          y: 0
        }
      }
    },
    scene: [PlayGame]
  };

  game = new Phaser.Game(gameConfig);
  window.focus();
};

class PlayGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
    this.score = 0;
    this.score2 = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  preload() {
    this.load.setPath('src/assets/');
    this.load.image("ground2", "platform.png");
    this.load.image("ground", "platform2.png");
    this.load.image("star", "star.png");
    this.load.image("star2", "star2.png");
    this.load.image("ship", "Ship2.png");
    this.load.image("bullet", "Laser.png");

    this.load.spritesheet("dude", "dude.png", {

      frameWidth: 32,
      frameHeight: 48  
    });

    this.load.audio("Air", 'AirBach.mp3');
    this.load.audio("Canon", 'CanonInD.mp3');
    this.load.audio("PickUp", 'PickUp.mp3');
  }

  create() {
    this.pickUp = this.sound.add('PickUp', {volume: 0.5});
    this.music = this.sound.add('Air', {volume: 0.3, loop: true});
    if (!this.music.isPlaying) {
      this.music.play();
    }
    
    

    this.groundGroup = this.physics.add.group({
      immovable: true,
      allowGravity: false
    });
    this.groundGroup.create(
      game.config.width / 2,
      game.config.height * (2 / 3),
      "ground"
    );
    for (let i = 0; i < 15; i++) {
      let xCoordinate = Phaser.Math.Between(0, game.config.width);
      let ground = this.groundGroup.create(
        Phaser.Math.Between(0, xCoordinate),
        Phaser.Math.Between(0, game.config.height),
        "ground"
      );
      if (Phaser.Math.Between(0, 1) === 1) {
        if (xCoordinate > game.config.width / 2) {
          ground.setVelocityX(gameOptions.dudeSpeed / -10);
        } else {
          ground.setVelocityX(gameOptions.dudeSpeed / 10);
        }
      }
    }

    this.dude = this.physics.add.sprite(
      game.config.width / 2,
      game.config.height / 2,
      "dude"
    );
    this.dude.body.gravity.y = gameOptions.dudeGravity;
    this.physics.add.collider(this.dude, this.groundGroup);

    this.starsGroup = this.physics.add.group({});
    this.physics.add.collider(this.starsGroup, this.groundGroup);
    
    this.shipGroup = this.physics.add.group({allowGravity: false});
    
    ;

    this.physics.add.overlap(
      this.dude,
      this.starsGroup,
      this.collectStar,
      null,
      this
    );
    this.physics.add.overlap(this.dude, this.shipGroup, this.shipHit, null, this);
    
    this.playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.physics.add.overlap(this.shipGroup, this.playerBullets, this.shootShip, null, this);

    // Fires bullet from player on left click of mouse
    this.input.on('pointerdown', (pointer, time) =>
    {
      console.log("shoot")
        if (this.dude.active === false) { return; }

        // Get bullet from bullets group
        const bullet = this.playerBullets.get().setActive(true).setVisible(true);

        if (bullet)
        {
            this.targetX = pointer.x;
            this.targetY = pointer.y;
            bullet.fire(this.dude, this.targetX, this.targetY);
            
        }
    });

    this.add.image(16, 16, "star");
    this.scoreText = this.add.text(32, 3, "0", {
      fontSize: "30px",
      fill: "#ffffff"
    });

    this.add.image(80, 16, "star2");
    this.scoreText2 = this.add.text(96, 3, "0", {
      fontSize: "30px",
      fill: "#ffffff"
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 10
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.triggerElements = this.time.addEvent({
      callback: this.addElements,
      callbackScope: this,
      delay: 1000,
      loop: true
    });
  }

  
  addElements() {
    
    let xCoordinate = Phaser.Math.Between(0, game.config.width);
    let ground = this.groundGroup.create(xCoordinate, 0, "ground");
    this.groundGroup.setVelocityY(gameOptions.dudeSpeed / 4);

    if (Phaser.Math.Between(0, 2) === 2) {
      if (xCoordinate > 400) {
        ground.setVelocityX(gameOptions.dudeSpeed / -10);
      } else {
        ground.setVelocityX(gameOptions.dudeSpeed / 10);
      }

      if (Phaser.Math.Between(0, 1)) {
        this.starsGroup.create(
          Phaser.Math.Between(0, game.config.width),
          0,
          "star"
        ).setData('star2', false);
        this.starsGroup.setVelocityY(gameOptions.dudeSpeed);
      }
      if (Phaser.Math.Between(0, 5) === 5) {
        this.starsGroup.create(
          Phaser.Math.Between(0, game.config.width),
          0,
          "star2"
        ).setData('star2', true);
        this.starsGroup.setVelocityY(gameOptions.dudeSpeed);
      }
      if (Phaser.Math.Between(0, 1)) {
        let enemy = this.shipGroup.create(
          Phaser.Math.Between(0, game.config.width),
          0,
          "ship"
        );
        this.physics.moveToObject(enemy, this.dude, 200);
        enemy.rotation = 1.57079633 + Phaser.Math.Angle.Between(enemy.x, enemy.y, this.dude.x, this.dude.y); // angle ship to dude
        
      }
      
    }
  }


  collectStar(dude, star) {
    star.disableBody(true, true);
    this.pickUp.play()
    if (star.getData('star2')) {
      this.score2 += 1;  
    this.scoreText2.setText(this.score2);
    } else {
    this.score += 1;  
    this.scoreText.setText(this.score);
    }
    
  }
  shipHit(dude, ship){
    this.restartGame();
  }

  shootShip(ship, bullet){
    ship.disableBody(true,true);
    //bullet.disableBody(true,true);
  }

  update() {
  
    if (this.cursors.left.isDown) {
      this.dude.body.velocity.x = -gameOptions.dudeSpeed;
      this.dude.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.dude.body.velocity.x = gameOptions.dudeSpeed;
      this.dude.anims.play("right", true);
    } else {
      this.dude.body.velocity.x = 0;
      this.dude.anims.play("turn", true);
    }

    if (
      this.cursors.up.isDown &&
      (this.dude.body.touching.down ||
        this.dude.body.touching.left ||
        this.dude.body.touching.right)
    ) {
      this.dude.body.velocity.y = -gameOptions.dudeGravity / 1.6;
    }

    if (this.dude.y > game.config.height || this.dude.y < 0) {
      this.restartGame();
    }
  }
  restartGame() {
    this.scene.start("PlayGame");
    this.score = 0;
    this.score2 = 0;
    this.music.stop()
  }
}

class Bullet extends Phaser.GameObjects.Image
{
    constructor (scene)
    {
        super(scene, 0, 0, 'bullet');
        this.speed = 1;
        this.born = 0;
        this.direction = 0;
        this.xSpeed = 0;
        this.ySpeed = 0;
        
    }

    fire (shooter, targetX, targetY)
    {
      console.log("bullet")
        this.setPosition(shooter.x, shooter.y); // Initial position
        this.direction = Math.atan((targetX - this.x) / (targetY - this.y));

        // Calculate X and y velocity of bullet to moves it from shooter to target
        if (targetY >= this.y)
        {
            this.xSpeed = this.speed * Math.sin(this.direction);
            this.ySpeed = this.speed * Math.cos(this.direction);
        }
        else
        {
            this.xSpeed = -this.speed * Math.sin(this.direction);
            this.ySpeed = -this.speed * Math.cos(this.direction);
        }

        this.rotation =  1.57079633 + Phaser.Math.Angle.Between(shooter.x, shooter.y, targetX, targetY); // angle bullet with shooters rotation
        console.log(this.rotation)
        this.born = 0; // Time since new bullet spawned
        
    }

    update (time, delta)
    {
        this.x += this.xSpeed * delta;
        this.y += this.ySpeed * delta;
        this.born += delta;
        if (this.born > 1800)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}

