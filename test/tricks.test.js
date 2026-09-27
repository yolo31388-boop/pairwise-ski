
const { Rotation } = require('../src/tricks/rotation.js');
const { Scoring } = require('../src/tricks/scoring.js');
const { Skier } = require('../src/player/skier.js');

describe('滑雪特技判定', () => {
  test('累计旋转角度', () => {
    const r = new Rotation();
    r.angularVelocity = 360;
    r.update(0.5);
    r.update(0.5);
    expect(r.getTotalRotation()).toBeCloseTo(360, 0);
  });
  test('角速度积分', () => {
    const r = new Rotation();
    r.angularVelocity = 180;
    r.update(2);
    expect(r.getTotalRotation()).toBeCloseTo(360, 0);
  });
  test('落地瞬间判定', () => {
    const skier = new Skier();
    skier.jump();
    skier.rotation.angularVelocity = 360;
    skier.rotation.update(1);
    const result = skier.land();
    expect(result.success).toBe(true);
  });
  test('基于整数倍计分', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 720;
    expect(s.scoreTrick(r, 1)).toBe(200);
  });
  test('抓板叠加计分', () => {
    const s = new Scoring();
    expect(s.scoreWithGrab(100, 'mute')).toBeGreaterThan(100);
  });
  test('非整数倍摔倒', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 270;
    const result = s.land(r);
    expect(result.success).toBe(false);
  });
  test('空中时间基础分', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 360;
    expect(s.scoreTrick(r, 3)).toBeGreaterThan(s.scoreTrick(r, 1));
  });
  test('连击加成', () => {
    const s = new Scoring();
    s.combo = 2;
    const r = new Rotation();
    r.totalAngle = 360;
    expect(s.scoreTrick(r, 1)).toBeGreaterThan(100);
  });
  test('摔倒重置连击', () => {
    const skier = new Skier();
    skier.scoring.combo = 3;
    skier.jump();
    skier.rotation.totalAngle = 90;
    skier.land();
    expect(skier.scoring.combo).toBe(0);
  });
  test('不同地形规则', () => {
    const s = new Scoring();
    expect(s.getTerrainMultiplier('halfpipe')).toBeGreaterThan(1);
  });
  test('旋转方向区分', () => {
    const r1 = new Rotation();
    r1.totalAngle = 360;
    const r2 = new Rotation();
    r2.totalAngle = -360;
    expect(r1.getTotalRotation()).not.toBe(r2.getTotalRotation());
  });
  test('连续旋转不重置', () => {
    const r = new Rotation();
    r.angularVelocity = 360;
    r.update(0.5);
    r.update(0.5);
    r.update(0.5);
    expect(r.getTotalRotation()).toBeCloseTo(540, 0);
  });

  describe('边界不变量恢复（缺陷回归）', () => {
    test('原始缺陷：转满360不再被判0分', () => {
      const skier = new Skier();
      skier.jump();
      skier.rotation.angularVelocity = 360;
      const result = skier.update(1);
      expect(result.success).toBe(true);
      expect(result.rotation).toBeCloseTo(360, 9);
      expect(result.score).toBe(100);
    });

    test('原始缺陷：540不再被压成360，按比例计150且不四舍五入', () => {
      const skier = new Skier();
      skier.jump();
      skier.rotation.angularVelocity = 540;
      const result = skier.update(1);
      expect(result.rotation).toBeCloseTo(540, 9);
      expect(result.score).toBe(150);
    });

    test('角速度积分累计：0.2步长积分5次恰为360，中途不落地', () => {
      const skier = new Skier();
      skier.jump();
      skier.rotation.angularVelocity = 360;
      for (let i = 0; i < 4; i++) {
        expect(skier.update(0.2)).toBeNull();
        expect(skier.airborne).toBe(true);
      }
      const result = skier.update(0.2);
      expect(result.success).toBe(true);
      expect(result.rotation).toBeCloseTo(360, 9);
    });

    test('落地不提前：空中0.999秒不能判定落地', () => {
      const skier = new Skier();
      skier.jump();
      skier.rotation.angularVelocity = 360;
      expect(skier.update(0.999)).toBeNull();
      expect(skier.airborne).toBe(true);
    });

    test('落地不延迟：跨越接触时刻的大dt在同一帧精确落地', () => {
      const skier = new Skier();
      skier.jump();
      skier.rotation.angularVelocity = 720;
      const result = skier.update(2);
      expect(skier.airborne).toBe(false);
      expect(result.rotation).toBeCloseTo(720, 9);
      expect(result.score).toBe(200);
    });

    test('变角速度积分：方向反转后累计角度保留带符号总和', () => {
      const r = new Rotation();
      r.angularVelocity = 360;
      r.update(0.5);
      r.angularVelocity = -180;
      r.update(1);
      expect(r.getTotalRotation()).toBeCloseTo(0, 9);
      const r2 = new Rotation();
      r2.angularVelocity = 540;
      r2.update(0.5);
      r2.angularVelocity = -360;
      r2.update(0.5);
      expect(r2.getTotalRotation()).toBeCloseTo(90, 9);
    });

    test('旋转方向区分：顺时针为正、逆时针为负，互不相等', () => {
      const cw = new Skier();
      cw.jump();
      cw.rotation.angularVelocity = 360;
      const rcw = cw.update(1);
      const ccw = new Skier();
      ccw.jump();
      ccw.rotation.angularVelocity = -360;
      const rccw = ccw.update(1);
      expect(rcw.rotation).toBeGreaterThan(0);
      expect(rccw.rotation).toBeLessThan(0);
      expect(rcw.rotation).not.toBeCloseTo(rccw.rotation, 9);
      expect(rcw.direction).toBe('cw');
      expect(rccw.direction).toBe('ccw');
    });

    test('非180整数倍摔倒且不强行修正角度', () => {
      const skier = new Skier();
      skier.jump();
      skier.rotation.angularVelocity = 450;
      const result = skier.update(1);
      expect(result.success).toBe(false);
      expect(result.crashed).toBe(true);
      expect(result.rotation).toBeCloseTo(450, 9);
    });

    test('摔倒是因为270/450而不是因为接近360：360与720均成功', () => {
      const s = new Scoring();
      const a = new Rotation(); a.totalAngle = 360;
      const b = new Rotation(); b.totalAngle = 720;
      expect(s.land(a, 1).success).toBe(true);
      expect(s.land(b, 1).success).toBe(true);
      const c = new Rotation(); c.totalAngle = 270;
      expect(s.land(c, 1).success).toBe(false);
    });

    test('摔倒扣除当前特技分数且总分减少', () => {
      const s = new Scoring();
      const r = new Rotation();
      r.totalAngle = 450;
      const result = s.land(r, 1);
      expect(result.success).toBe(false);
      expect(result.score).toBe(-125);
      expect(s.totalScore).toBe(-125);
    });

    test('抓板与旋转叠加计分而非覆盖旋转分', () => {
      const s = new Scoring();
      const r = new Rotation();
      r.totalAngle = 360;
      const spinOnly = s.scoreTrick(r, 1);
      const withGrab = s.scoreTrick(r, 1, { grab: 'mute' });
      expect(withGrab).toBe(spinOnly + 50);
      const r2 = new Rotation();
      r2.totalAngle = 720;
      expect(s.scoreTrick(r2, 1, { grab: 'method' })).toBe(260);
    });

    test('Skier抓板动作计入落地分数，且落地后抓板清空', () => {
      const skier = new Skier();
      skier.jump();
      skier.rotation.angularVelocity = 360;
      expect(skier.grab('mute')).toBe(true);
      const result = skier.update(1);
      expect(result.success).toBe(true);
      expect(result.score).toBe(150);
      expect(skier.grabType).toBeNull();
    });

    test('空中时间越长基础分越高（360：空中3秒高于空中1秒）', () => {
      const s = new Scoring();
      const r = new Rotation();
      r.totalAngle = 360;
      expect(s.scoreTrick(r, 3)).toBe(200);
      expect(s.scoreTrick(r, 2)).toBe(150);
      expect(s.scoreTrick(r, 1)).toBe(100);
    });

    test('连击加成：成功落地后连击数加一，下一特技分更高', () => {
      const s = new Scoring();
      const r1 = new Rotation(); r1.totalAngle = 360;
      const first = s.land(r1, 1);
      expect(first.combo).toBe(1);
      const r2 = new Rotation(); r2.totalAngle = 360;
      const second = s.land(r2, 1);
      expect(second.combo).toBe(2);
      expect(second.score).toBe(125);
      const r3 = new Rotation(); r3.totalAngle = 360;
      expect(s.land(r3, 1).score).toBe(150);
    });

    test('摔倒重置连击，再次成功落地连击从1重新计', () => {
      const s = new Scoring();
      const good = new Rotation(); good.totalAngle = 360;
      s.land(good, 1);
      s.land(new Rotation(), 1);
      expect(s.combo).toBe(2);
      const bad = new Rotation(); bad.totalAngle = 270;
      const crash = s.land(bad, 1);
      expect(crash.combo).toBe(0);
      const again = new Rotation(); again.totalAngle = 360;
      const recover = s.land(again, 1);
      expect(recover.combo).toBe(1);
      expect(recover.score).toBe(100);
    });

    test('地形倍率：跳台1.0、铁杆1.25、半管1.5', () => {
      const s = new Scoring();
      expect(s.getTerrainMultiplier('kicker')).toBe(1);
      expect(s.getTerrainMultiplier('rail')).toBeCloseTo(1.25, 10);
      expect(s.getTerrainMultiplier('halfpipe')).toBe(1.5);
      const r = new Rotation();
      r.totalAngle = 360;
      expect(s.scoreTrick(r, 1, { terrain: 'rail' })).toBe(125);
      expect(s.scoreTrick(r, 1, { terrain: 'halfpipe' })).toBe(150);
    });

    test('地形规则差异：铁杆抓板不加分，半管抓板正常加分', () => {
      const s = new Scoring();
      const r = new Rotation();
      r.totalAngle = 360;
      const railNoGrab = s.scoreTrick(r, 1, { terrain: 'rail' });
      const railGrab = s.scoreTrick(r, 1, { terrain: 'rail', grab: 'mute' });
      expect(railGrab).toBe(railNoGrab);
      const hpNoGrab = s.scoreTrick(r, 1, { terrain: 'halfpipe' });
      const hpGrab = s.scoreTrick(r, 1, { terrain: 'halfpipe', grab: 'mute' });
      expect(hpGrab).toBe(hpNoGrab + 50);
    });

    test('连续旋转不重置：同一次跳跃多次update累计到540', () => {
      const skier = new Skier();
      skier.jump('halfpipe');
      skier.rotation.angularVelocity = 1080;
      skier.update(0.25);
      expect(skier.rotation.getTotalRotation()).toBeCloseTo(270, 9);
      skier.update(0.25);
      expect(skier.rotation.getTotalRotation()).toBeCloseTo(540, 9);
    });

    test('非空中不能抓板；落地后再update不重复计分', () => {
      const skier = new Skier();
      expect(skier.grab('mute')).toBe(false);
      skier.jump();
      skier.rotation.angularVelocity = 360;
      const landed = skier.update(1);
      expect(landed.score).toBe(100);
      expect(skier.update(0.1)).toBeNull();
      expect(skier.scoring.totalScore).toBe(100);
    });
  });
});
