

class Skier {
  constructor() { this.rotation = new Rotation(); this.scoring = new Scoring(); this.airborne = false; this.airTime = 0; }
  jump() { this.airborne = true; this.airTime = 0; }
  land() {
    const result = this.scoring.land(this.rotation);
    this.airborne = false;
    return result;
  }
}

module.exports = { Skier };
