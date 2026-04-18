// Arm detection for the "67" arm pump movement
// Velocity-based peak detection with strict thresholds
// Each hand independently: detect down→up cycle via direction changes
// ONLY counts when wrist is clearly visible in frame

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface PerArmState {
  smoothedY: number;
  direction: number; // -1 = going up, 1 = going down, 0 = unknown
  bottomY: number | null;
  cooldown: number;
  totalPumps: number;
  initialized: boolean;
  wasVisible: boolean;
}

interface ArmTracker {
  left: PerArmState;
  right: PerArmState;
  totalPumps: number;
  onPump: (arm: 'left' | 'right') => void;
}

// Minimum vertical displacement (fraction of torso height) for a valid pump
const MIN_PUMP_HEIGHT = 0.20;
// Exponential smoothing (lower = smoother, filters more noise)
const SMOOTH = 0.2;
// Minimum velocity to register direction change
const DIRECTION_THRESHOLD = 0.0012;
// Cooldown frames after a counted pump
const COOLDOWN = 8;
// Minimum wrist visibility to track
const VIS_THRESHOLD = 0.7;

export function createArmTracker(cb: { onPump: (arm: 'left' | 'right') => void }): ArmTracker {
  return {
    left: { smoothedY: 0, direction: 0, bottomY: null, cooldown: 0, totalPumps: 0, initialized: false, wasVisible: false },
    right: { smoothedY: 0, direction: 0, bottomY: null, cooldown: 0, totalPumps: 0, initialized: false, wasVisible: false },
    totalPumps: 0,
    onPump: cb.onPump,
  };
}

function resetArm(arm: PerArmState) {
  arm.direction = 0;
  arm.bottomY = null;
  arm.cooldown = 0;
  arm.initialized = false;
  arm.wasVisible = false;
}

/**
 * Process one frame of pose landmarks.
 *
 * Detection uses velocity-based peak detection:
 * 1. Check wrist visibility — if not visible, reset tracking state
 * 2. Smooth wrist Y with exponential moving average
 * 3. Track direction of movement (up or down)
 * 4. direction down→up = bottom of pump (record position)
 * 5. direction up→down = top of pump
 * 6. If displacement >= MIN_PUMP_HEIGHT → count 1 pump
 */
export function processLandmarks(landmarks: Landmark[], tracker: ArmTracker): { total: number; leftHit: boolean; rightHit: boolean } {
  const result = { total: tracker.totalPumps, leftHit: false, rightHit: false };

  if (!landmarks || landmarks.length < 25) return result;

  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  const lHip = landmarks[23];
  const rHip = landmarks[24];

  // Check shoulder visibility for torso measurement
  const lShoulderVis = lShoulder.visibility ?? 0;
  const rShoulderVis = rShoulder.visibility ?? 0;
  if (lShoulderVis < VIS_THRESHOLD || rShoulderVis < VIS_THRESHOLD) {
    // Shoulders not visible — reset both arms to prevent phantom counting
    resetArm(tracker.left);
    resetArm(tracker.right);
    return result;
  }

  // Torso height for normalization
  const torsoH = Math.abs(((lHip.y + rHip.y) / 2) - ((lShoulder.y + rShoulder.y) / 2));
  if (torsoH < 0.05) return result;

  // Check WRIST visibility — only count if wrist is clearly visible
  const lWristVis = lWrist.visibility ?? 0;
  const rWristVis = rWrist.visibility ?? 0;

  result.leftHit = trackArm(lWrist.y, lWristVis, tracker.left, torsoH, tracker, 'left');
  result.rightHit = trackArm(rWrist.y, rWristVis, tracker.right, torsoH, tracker, 'right');
  result.total = tracker.totalPumps;

  return result;
}

function trackArm(
  rawY: number,
  visibility: number,
  arm: PerArmState,
  torsoH: number,
  tracker: ArmTracker,
  side: 'left' | 'right',
): boolean {
  // If wrist not visible, reset state and don't count
  if (visibility < VIS_THRESHOLD) {
    if (arm.wasVisible) {
      arm.direction = 0;
      arm.bottomY = null;
      arm.initialized = false;
      arm.wasVisible = false;
    }
    return false;
  }

  arm.wasVisible = true;

  if (arm.cooldown > 0) {
    arm.cooldown--;
    return false;
  }

  // Exponential smoothing
  if (!arm.initialized) {
    arm.smoothedY = rawY;
    arm.initialized = true;
    return false;
  }

  const prevSmoothed = arm.smoothedY;
  arm.smoothedY = prevSmoothed * (1 - SMOOTH) + rawY * SMOOTH;

  // Velocity (positive = moving down in screen coords, negative = moving up)
  const velocity = arm.smoothedY - prevSmoothed;

  // Determine current direction
  let newDirection = arm.direction;
  if (velocity < -DIRECTION_THRESHOLD) newDirection = -1; // going up
  else if (velocity > DIRECTION_THRESHOLD) newDirection = 1; // going down

  let hit = false;

  // Direction change: down → up = we just passed a local minimum (bottom of pump)
  if (arm.direction === 1 && newDirection === -1) {
    arm.bottomY = arm.smoothedY;
  }

  // Direction change: up → down = we just passed a local maximum (top of pump)
  if (arm.direction === -1 && newDirection === 1 && arm.bottomY !== null) {
    // How far wrist went up from bottom (up = lower Y in screen coords)
    const displacement = arm.bottomY - arm.smoothedY;
    const normalizedDisp = displacement / torsoH;

    if (normalizedDisp >= MIN_PUMP_HEIGHT) {
      arm.totalPumps++;
      tracker.totalPumps++;
      arm.cooldown = COOLDOWN;
      hit = true;
      arm.bottomY = null;
      tracker.onPump(side);
    }
    arm.bottomY = null;
  }

  arm.direction = newDirection;
  return hit;
}

/**
 * Check if both wrists are visible (for ready phase).
 */
export function areHandsVisible(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 25) return false;
  return (
    (landmarks[15].visibility ?? 0) > 0.5 &&
    (landmarks[16].visibility ?? 0) > 0.5 &&
    (landmarks[11].visibility ?? 0) > 0.5 &&
    (landmarks[12].visibility ?? 0) > 0.5
  );
}

/* ── Drawing helpers ── */

/**
 * Draw prominent wrist tracker circles on landmarks 15 and 16.
 */
export function drawWristTrackers(
  ctx: CanvasRenderingContext2D,
  lm: Landmark[],
  w: number,
  h: number,
  hitLeft: boolean,
  hitRight: boolean,
) {
  const main = '#22c55e';
  const glow = 'rgba(34,197,94,0.5)';
  const ring = 'rgba(34,197,94,0.2)';

  const wrists: { idx: number; hit: boolean }[] = [
    { idx: 15, hit: hitLeft },
    { idx: 16, hit: hitRight },
  ];

  for (const { idx, hit } of wrists) {
    const p = lm[idx];
    if (!p || (p.visibility ?? 0) < 0.4) continue;

    const x = p.x * w;
    const y = p.y * h;
    const baseR = 10;
    const r = hit ? baseR + 6 : baseR;

    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, Math.PI * 2);
    ctx.fillStyle = ring;
    ctx.fill();

    ctx.shadowColor = glow;
    ctx.shadowBlur = hit ? 25 : 15;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = hit ? '#f97316' : main;
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    if (hit) {
      ctx.beginPath();
      ctx.arc(x, y, r + 14, 0, Math.PI * 2);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
