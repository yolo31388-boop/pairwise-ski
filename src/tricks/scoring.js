const SPIN_BASE = 100;
const SPIN_STEP = 180;
const TOLERANCE = 1e-9;

const GRAB_BONUS = {
  mute: 50,
  indy: 40,
  method: 60,
  tail: 35,
  nose: 35,
};

const TERRAIN_RULES = {
  kicker: { multiplier: 1.0, airTimeFactor: 50, grabMultiplier: 1.0 },
  rail: { multiplier: 1.25, airTimeFactor: 25, grabMultiplier: 0 },
  halfpipe: { multiplier: 1.5, airTimeFactor: 75, grabMultiplier: 1.0 },
};

class Scoring {
  constructor() {
    this.combo = 0;
    this.baseScore = SPIN_BASE;
    this.totalScore = 0;
  }

  getTerrainMultiplier(terrain = 'kicker') {
    const rules = TERRAIN_RULES[terrain] || TERRAIN_RULES.kicker;
    return rules.multiplier;
  }

  isLandable(rotation) {
    const angle = Math.abs(rotation.getTotalRotation());
    return Math.abs(angle / SPIN_STEP - Math.round(angle / SPIN_STEP)) <= TOLERANCE;
  }

  getDirection(rotation) {
    return rotation.getDirection();
  }

  getTrickName(rotation) {
    const angle = Math.abs(rotation.getTotalRotation());
    if (angle < TOLERANCE) return 'none';
    const dir = rotation.getDirection() === 'ccw' ? 'counter-' : '';
    return `${dir}${Math.round(angle)}`;
  }

  spinScore(rotation) {
    return (Math.abs(rotation.getTotalRotation()) / 360) * this.baseScore;
  }

  airTimeScore(airTime, terrain = 'kicker') {
    const rules = TERRAIN_RULES[terrain] || TERRAIN_RULES.kicker;
    return Math.max(0, (airTime - 1)) * rules.airTimeFactor;
  }

  grabBonus(grab, terrain = 'kicker') {
    if (!grab) return 0;
    const base = GRAB_BONUS[grab] || 0;
    const rules = TERRAIN_RULES[terrain] || TERRAIN_RULES.kicker;
    return base * rules.grabMultiplier;
  }

  scoreWithGrab(baseScore, grab, terrain = 'kicker') {
    return baseScore + this.grabBonus(grab, terrain);
  }

  trickBase(rotation, airTime, options = {}) {
    const terrain = options.terrain || 'kicker';
    const terrainMultiplier = this.getTerrainMultiplier(terrain);
    const spin = this.spinScore(rotation) * terrainMultiplier;
    const air = this.airTimeScore(airTime, terrain) * terrainMultiplier;
    const grab = this.grabBonus(options.grab, terrain);
    return spin + air + grab;
  }

  scoreTrick(rotation, airTime, options = {}) {
    const base = this.trickBase(rotation, airTime, options);
    const comboMultiplier = 1 + this.combo * 0.25;
    return base * comboMultiplier;
  }

  land(rotation, airTime = 0, options = {}) {
    const terrain = options.terrain || 'kicker';
    if (!this.isLandable(rotation)) {
      const penalty = this.trickBase(rotation, airTime, options);
      this.combo = 0;
      this.totalScore -= penalty;
      return {
        success: false,
        crashed: true,
        score: -penalty,
        combo: this.combo,
        totalScore: this.totalScore,
        rotation: rotation.getTotalRotation(),
        direction: rotation.getDirection(),
        trick: this.getTrickName(rotation),
        terrain,
      };
    }

    const score = this.scoreTrick(rotation, airTime, options);
    this.combo += 1;
    this.totalScore += score;
    return {
      success: true,
      crashed: false,
      score,
      combo: this.combo,
      totalScore: this.totalScore,
      rotation: rotation.getTotalRotation(),
      direction: rotation.getDirection(),
      trick: this.getTrickName(rotation),
      terrain,
    };
  }
}

module.exports = { Scoring, GRAB_BONUS, TERRAIN_RULES, SPIN_STEP };
