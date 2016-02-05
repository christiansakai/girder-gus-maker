'use strict';

const game = window.game;

const Gus = require('./gus');
const GhostGirderMarker = require('./ghostGirderMarker');
const ParticleBurst = require("../particles/burst");

const COLLISION_GROUPS = require("../consts/collisionGroups");
const EPSILON = require("../consts").EPSILON;
const TAU = require("../consts").TAU;

class GhostGus extends Gus {
  constructor(x, y) {
    super(x, y, false);
    this.sprite.alpha = 0.5;

    this.compressedRecord = [2, 173, 1, 49, 2, 79, 0, 46, 2, 10, 0, 14, 2, 16, 0, 39, 3, 1, 0, 22, 2, 35, 0, 129];

    this.setCollision();
    this.uncompressRecord();

    this.marker = new GhostGirderMarker();
    this.marker.setMaster( this );

    console.log('Ghost Gus (a.k.a girder ghost) created.')
}

  // diff from Gus's doom: doesn't unlock the dolly
  doom() {

    this.sprite.body.clearCollision();
    this.sprite.body.fixedRotation = false;

    this.sprite.body.velocity.x = Math.sin(this.rotation) * 250;
    this.sprite.body.velocity.y = Math.cos(this.rotation) * -250;

    this.sprite.body.angularVelocity = 30;
    //this.sprite.body.rotateRight( 360 );

  }

  setCollision() {
    this.sprite.body.setCollisionGroup(COLLISION_GROUPS.GHOST_PLAYER_SOLID);
    this.sprite.body.setCollisionGroup(COLLISION_GROUPS.GHOST_PLAYER_SENSOR, this.rotationSensor);
    this.sprite.body.collides([COLLISION_GROUPS.GHOST_BLOCK_ROTATE, COLLISION_GROUPS.BLOCK_SOLID, COLLISION_GROUPS.BLOCK_ROTATE, COLLISION_GROUPS.ITEM, COLLISION_GROUPS.SPIKES]);
  }

  uncompressRecord() {
    const compressedRecord = this.compressedRecord;

    const reversedUncompressedRecord = [];

    const compressedRecordStartLength = compressedRecord.length;

    for (let i = 0; i < compressedRecordStartLength; i += 2) {

      let numTimes = compressedRecord.pop();
      let key = compressedRecord.pop();

      for (let j = 0; j < numTimes; j++) reversedUncompressedRecord.push(key);
    }

    this.uncompressedRecord = reversedUncompressedRecord.reverse();
  }

  update() {

    // clear horizontal movement
    const currentMove = this.uncompressedRecord.pop();
    this.marker.update(currentMove);

    if (Math.abs(Math.cos(this.rotation)) > EPSILON) this.sprite.body.velocity.x = 0;
    else this.sprite.body.velocity.y = 0;

    // check to see if we're rotating
    if (this.rotating) {

      // stop all movement
      this.stop();
      this.sprite.body.velocity.y = 0;
      this.sprite.body.velocity.x = 0;

      // create a rotate tween
      if (this.rotateTween === undefined) {
        this.rotateTween = game.add.tween(this.sprite).to({
            rotation: this.targetRotation
          }, 300, Phaser.Easing.Default, true)
          .onComplete.add(function() {
            this.rotation = this.targetRotation % (TAU); // keep angle within 0-2pi
            this.finishRotation();
          }, this);
      }

    } else if (!this.isDead) {

      // do gravity
      this.applyGravity();

      if (this.rotationSensor.needsCollisionData) {
        this.setCollision();
        this.rotationSensor.needsCollisionData = false;
      }

      // check for input
      if (currentMove === 1) {
        this.walk("left");
      } else if (currentMove === 2) {
        this.walk("right");
      } else {
        this.stop();
      }

      if (currentMove === 3) {
        this.marker.placeGirder();
      }

      if (!this.isTouching("down")) {
        this.fallTime += game.time.physicsElapsedMS;

        if (this.fallTime > this.killTime) {
          this.kill();
        }

      } else {
        this.fallTime = 0;
      }

    }

  }
}

module.exports = GhostGus;