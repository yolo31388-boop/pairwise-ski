const { Rotation } = require('../tricks/rotation.js');
const { Scoring } = require('../tricks/scoring.js');

class Skier {
  constructor() {
    this.rotation = new Rotation();
    this.scoring = new Scoring();
    this.airborne = false;
    this.airTime = 0;
    this.y = 0;
    this.vy = 0;
    this.gravity = 20;
    this.jumpVelocity = 10;
    this.grabType = null;
    this.terrain = 'kicker';
    this.lastResult = null;
  }

  jump(terrain = 'kicker') {
    if (this.airborne) return false;
    this.airborne = true;
    this.airTime = 0;
    this.y = 0;
    this.vy = this.jumpVelocity;
    this.grabType = null;
    this.terrain = terrain;
    this.rotation = new Rotation();
    return true;
  }

  grab(type) {
    if (!this.airborne) return false;
    this.grabType = type;
    return true;
  }

  contactTimeWithin(dt) {
    const b = this.vy;
    const c = this.y;
    const disc = b * b + 2 * this.gravity * c;
    if (disc < 0) return null;
    const t1 = (b - Math.sqrt(disc)) / this.gravity;
    const t2 = (b + Math.sqrt(disc)) / this.gravity;
    for (const t of [t1, t2]) {
      if (t > 1e-12 && t <= dt) return t;
    }
    return null;
  }

  advance(t) {
    if (t <= 0) return;
    this.rotation.update(t);
    this.airTime += t;
    this.y += this.vy * t - 0.5 * this.gravity * t * t;
    this.vy -= this.gravity * t;
  }

  land() {
    const result = this.scoring.land(this.rotation, this.airTime, {
      terrain: this.terrain,
      grab: this.grabType,
    });
    this.airborne = false;
    this.y = 0;
    this.vy = 0;
    this.grabType = null;
    this.lastResult = result;
    return result;
  }

  update(dt = 0) {
    if (!this.airborne) return null;

    const remaining = dt;
    const tContact = this.contactTimeWithin(remaining);

    if (tContact !== null) {
      this.advance(tContact);
      return this.land();
    }

    this.advance(remaining);
    return null;
  }
}

module.exports = { Skier };
