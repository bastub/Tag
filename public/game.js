const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1200 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);
let cursors;
let player;
let otherPlayer;
let otherPlayers;
let socket;
let isLoup = false;
let direction = "none";
let platforms;
let taggedTime = 0;

function preload() {
  this.load.image("background", "assets/background1.png");
  this.load.image("ground", "assets/ground1.png");
  this.load.image("small_platform", "assets/small_platform.png");
  this.load.image("medium_platform", "assets/medium_platform.png");
  this.load.image("large_platform", "assets/large_platform.png");
  this.load.spritesheet("player1", "assets/orange_taggie1.png", {
    frameWidth: 132.77777,
    frameHeight: 140,
  });
  this.load.spritesheet("player2", "assets/purple_taggie1.png", {
    frameWidth: 132.77777,
    frameHeight: 140,
  });

  // this.load.image("player1", "assets/player1.png");
  // this.load.image("player2", "assets/player2.png");
  this.load.image("selector", "assets/selector.png");
  this.load.image("loup", "assets/loup.png");
}

function create() {
  this.add.image(0, 0, "background").setOrigin(0, 0).setScale(0.5);
  platforms = this.physics.add.staticGroup();
  platforms.create(0, 560, "ground").setOrigin(0, 0).refreshBody();

  platforms.create(800, 500, "large_platform").setOrigin(0, 0).refreshBody();
  platforms.create(700, 400, "medium_platform").setOrigin(0, 0).refreshBody();
  platforms.create(600, 450, "small_platform").setOrigin(0, 0).refreshBody();
  platforms.create(1000, 300, "small_platform").setOrigin(0, 0).refreshBody();
  platforms.create(800, 200, "medium_platform").setOrigin(0, 0).refreshBody();
  platforms.create(400, 350, "large_platform").setOrigin(0, 0).refreshBody();
  platforms.create(150, 100, "small_platform").setOrigin(0, 0).refreshBody();
  platforms.create(50, 200, "small_platform").setOrigin(0, 0).refreshBody();
  platforms.create(100, 300, "small_platform").setOrigin(0, 0).refreshBody();
  platforms.create(50, 400, "small_platform").setOrigin(0, 0).refreshBody();
  platforms.create(400, 100, "large_platform").setOrigin(0, 0).refreshBody();
  platforms.create(300, 500, "small_platform").setOrigin(0, 0).refreshBody();
  platforms.create(800, 200, "small_platform").setOrigin(0, 0).refreshBody();
  platforms.create(300, 250, "medium_platform").setOrigin(0, 0).refreshBody();
  platforms.create(1050, 100, "small_platform").setOrigin(0, 0).refreshBody();

  player = this.physics.add.sprite(-1000, 0, "player1");
  otherPlayer = this.physics.add.sprite(-1000, 0, "player2");
  selector = this.add.image(0, 0, "selector");
  loup = this.add.image(-1000, 0, "loup");
  // player = this.physics.add.image(-1000, 0, "player1");
  // otherPlayer = this.physics.add.image(-1000, 0, "player2");

  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("player1", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "player1", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("player1", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "left2",
    frames: this.anims.generateFrameNumbers("player2", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn2",
    frames: [{ key: "player2", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right2",
    frames: this.anims.generateFrameNumbers("player2", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  otherPlayers = this.physics.add.group();
  this.physics.add.overlap(player, otherPlayers);

  socket = io();

  socket.on("currentPlayers", (players) => {
    Object.keys(players).forEach((id) => {
      if (players[id].id === socket.id) {
        addPlayer(this, players[id]);
        isLoup = players[id].isLoup;
        if (isLoup) this.cameras.main.zoomTo(1, 1000);
      } else {
        addOtherPlayers(this, players[id]);
      }
    });
  });

  socket.on("newPlayer", (playerInfo) => {
    addOtherPlayers(this, playerInfo);
  });

  socket.on("playerDisconnected", (playerId) => {
    otherPlayers.getChildren().forEach((otherPlayer) => {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  socket.on("playerMoved", (playerInfo) => {
    otherPlayers.getChildren().forEach((otherPlayer) => {
      if (playerInfo.id === otherPlayer.playerId) {
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        if (playerInfo.direction === "left") {
          otherPlayer.anims.play("left2", true);
        } else if (playerInfo.direction === "right") {
          otherPlayer.anims.play("right2", true);
        } else {
          otherPlayer.anims.play("turn2");
        }
        if (playerInfo.isLoup) {
          loup.x = otherPlayer.x;
          loup.y = otherPlayer.y - 40;
        }
      }
    });
  });

  socket.on("playerTagged", (tagInfo) => {
    if (tagInfo.tagged === socket.id) {
      isLoup = true;
      taggedTime = tagInfo.lastTaggedTime;
      this.cameras.main.zoomTo(1, 1000);
    }
  });

  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.Z,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.Q,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });
}

function update() {
  if (player) {
    // Si on appuie sur fleche gauche ou sur q
    if (cursors.left.isDown || keys.left.isDown) {
      player.setVelocityX(-300);
      player.anims.play("left", true);
      direction = "left";
    } else if (cursors.right.isDown || keys.right.isDown) {
      player.setVelocityX(300);
      player.anims.play("right", true);
      direction = "right";
    } else {
      player.setVelocityX(0);
      player.anims.play("turn");
      direction = "none";
    }

    if (
      (cursors.up.isDown || keys.up.isDown || cursors.space.isDown) &&
      player.body.touching.down
    ) {
      player.setVelocityY(-550);
    }

    socket.emit("playerMovement", {
      x: player.x,
      y: player.y,
      direction: direction,
    });

    selector.x = player.x;
    selector.y = player.y - 40;

    if (isLoup) {
      loup.x = player.x;
      loup.y = player.y - 40;
      // Si le joueur touche un autre joueur
    }
  }
}

function addPlayer(self, playerInfo) {
  player = self.physics.add.sprite(100, 450, "player1").setScale(0.2);
  // player = self.physics.add.image(100, 450, "player1");
  player.setCollideWorldBounds(true);
  self.cameras.main.startFollow(player, true, 0.05, 0.05);
  self.cameras.main.setZoom(1);
  self.cameras.main.zoomTo(1.5, 1000);

  // self.anims.create({
  //   key: "left",
  //   frames: self.anims.generateFrameNumbers("player1", { start: 0, end: 3 }),
  //   frameRate: 10,
  //   repeat: -1,
  // });

  // self.anims.create({
  //   key: "turn",
  //   frames: [{ key: "player1", frame: 4 }],
  //   frameRate: 20,
  // });

  // self.anims.create({
  //   key: "right",
  //   frames: self.anims.generateFrameNumbers("player1", { start: 5, end: 8 }),
  //   frameRate: 10,
  //   repeat: -1,
  // });

  player.setCollideWorldBounds(true);
  self.physics.add.collider(player, platforms);
  self.physics.add.overlap(player, otherPlayers, (player, otherPlayer) => {
    console.log("overlap");
    if (isLoup && Date.now() - taggedTime > 1000) {
      socket.emit("tag", otherPlayer.playerId);
      console.log("tag");
      console.log(Date.now());
      isLoup = false;
      self.cameras.main.zoomTo(1.5, 1000);
    }
  });
  if (playerInfo.isLoup) {
    isLoup = true;
    self.cameras.main.zoomTo(1, 1000);
  }
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add
    .sprite(playerInfo.x, playerInfo.y, "player2")
    .setScale(0.2);
  // otherPlayer = self.physics.add.image(playerInfo.x, playerInfo.y, "player2");
  otherPlayer.playerId = playerInfo.id;
  otherPlayers.add(otherPlayer);
  self.physics.add.collider(otherPlayers, platforms);
  console.log(playerInfo);
  if (playerInfo.isLoup) {
    loup.x = otherPlayer.x;
    loup.y = otherPlayer.y - 60;
  }
}
