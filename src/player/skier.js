
const { Rotation } = require('../tricks/rotation.js');
const { Scoring } = require('../tricks/scoring.js');

const GRAVITY = 10;

// 不同地形的起跳速度不同，因此滞空时间与得分基础也不同。
const LAUNCH_VELOCITY = {
  jump: 10,
  rail: 6,
  halfpipe: 12,
};

class Skier {
  constructor(terrain = 'jump') {
    this.rotation = new Rotation();
    this.scoring = new Scoring();
    this.airborne = false;
    this.airTime = 0;
    this.terrain = terrain;
    this.grabType = null;
    this.y = 0;
    this.vy = 0;
    this.lastResult = null;
  }

  jump() {
    this.rotation.reset();
    this.grabType = null;
    this.lastResult = null;
    this.airTime = 0;
    this.y = 0;
    this.vy = LAUNCH_VELOCITY[this.terrain] ?? LAUNCH_VELOCITY.jump;
    this.airborne = true;
  }

  grab(type) {
    if (!this.airborne) return;
    this.grabType = type;
  }

  update(dt) {
    if (!this.airborne) return;

    const vyEnd = this.vy - GRAVITY * dt;
    const yEnd = this.y + this.vy * dt - 0.5 * GRAVITY * dt * dt;

    if (yEnd > 0) {
      // 本帧内仍在空中：整帧都按空中处理。
      this.rotation.update(dt);
      this.airTime += dt;
      this.y = yEnd;
      this.vy = vyEnd;
      return;
    }

    // 本帧触雪：解 y + vy*t - 0.5*g*t^2 = 0 求接触瞬间的正根，
    // 只对接触前的时间积分，保证判定恰好在接触雪地的瞬间发生，
    // 既不提前（少积分）也不延迟（把触雪后的时间也算进空中）。
    const contactDt = (this.vy + Math.sqrt(this.vy * this.vy + 2 * GRAVITY * this.y)) / GRAVITY;
    const flightTime = Math.min(dt, Math.max(0, contactDt));
    if (flightTime > 0) {
      this.rotation.update(flightTime);
      this.airTime += flightTime;
    }
    this.y = 0;
    this.vy = vyEnd;
    this.land();
  }

  land() {
    if (!this.airborne && this.lastResult) return this.lastResult;
    const result = this.scoring.land(this.rotation, {
      airTime: this.airTime,
      grab: this.grabType,
      terrain: this.terrain,
    });
    this.airborne = false;
    this.y = 0;
    this.vy = 0;
    this.grabType = null;
    this.lastResult = result;
    return result;
  }
}

module.exports = { Skier };
