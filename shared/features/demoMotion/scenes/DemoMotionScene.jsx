import React, { useEffect, useMemo, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, ratio) => start + (end - start) * clamp(ratio, 0, 1);

const toPercent = (value, min, max) => {
  if (max <= min) {
    return 50;
  }
  return ((value - min) / (max - min)) * 100;
};

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((x) => `${x}${x}`).join("") : normalized;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
};

const mixHex = (startHex, endHex, ratio) => {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  const t = clamp(ratio, 0, 1);
  const toHex = (channel) => Math.round(channel).toString(16).padStart(2, "0");

  return `#${toHex(start.r + (end.r - start.r) * t)}${toHex(start.g + (end.g - start.g) * t)}${toHex(
    start.b + (end.b - start.b) * t
  )}`;
};

const COOL_COLOR = "#1d4ed8";
const PHASE_ONE_TARGET_COLOR = "#dd6c67";
const PHASE_TWO_TARGET_COLOR = "#ff3b1f";
const PHASE_TWO_PEAK_COLOR = "#ff2a12";
const PHASE_TWO_RED_BOOST_START = 0.78;
const PHASE_TWO_RED_BOOST_GAMMA = 1.9;
const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const toAnchoredColor = (ratio, anchorRatio) => {
  const safeRatio = clamp(ratio, 0, 1);
  const safeAnchorRatio = clamp(anchorRatio, 0.05, 0.95);

  if (safeRatio <= safeAnchorRatio) {
    const t = safeRatio / safeAnchorRatio;
    return mixHex(COOL_COLOR, PHASE_ONE_TARGET_COLOR, smoothstep(t));
  }

  const tRaw = clamp((safeRatio - safeAnchorRatio) / (1 - safeAnchorRatio), 0, 1);
  const t = tRaw ** PHASE_TWO_RED_BOOST_GAMMA;
  const boostT = clamp(
    (tRaw - PHASE_TWO_RED_BOOST_START) / Math.max(0.0001, 1 - PHASE_TWO_RED_BOOST_START),
    0,
    1
  );
  const boostedWarm = mixHex(PHASE_TWO_TARGET_COLOR, PHASE_TWO_PEAK_COLOR, smoothstep(boostT));
  return mixHex(PHASE_ONE_TARGET_COLOR, boostedWarm, t);
};

const TICK_STEP = 2;
const CAMERA_START_SCALE = 1.34;
const CAMERA_MAX_TRACK_X = 460;
const CAMERA_REENGAGE_END_SCALE = 1.18;
const CAMERA_PHASE_THREE_TRACK_LEFT_OFFSET = 2;

export const DemoMotionScene = ({
  minPercent,
  maxPercent,
  majorTickValues,
  handleLeftPercent,
  cameraTrackedHandleLeftPercent,
  cameraReengageProgress,
  phaseOneTargetPercent,
  phaseOneProgress,
  phaseThreeProgress,
  phaseThreeMoveProgress,
  progress,
  onAutoLayoutReady,
}) => {
  const cursorLabelRef = useRef(null);
  const seedanceLabelRef = useRef(null);
  const [seedanceRevealPercent, setSeedanceRevealPercent] = useState(0);

  useEffect(() => {
    onAutoLayoutReady?.();
  }, [onAutoLayoutReady]);

  const ticks = useMemo(() => {
    const result = [];
    for (let value = minPercent; value <= maxPercent; value += TICK_STEP) {
      result.push(value);
    }
    return result;
  }, [maxPercent, minPercent]);

  const majorTickSet = useMemo(
    () => new Set(Array.isArray(majorTickValues) ? majorTickValues : []),
    [majorTickValues]
  );
  const safeMajorTickValues = Array.isArray(majorTickValues) ? majorTickValues : [];
  const safeHandleLeft = clamp(handleLeftPercent ?? 50, minPercent, maxPercent);
  const safeTrackedHandleLeft = clamp(
    cameraTrackedHandleLeftPercent ?? safeHandleLeft,
    minPercent,
    maxPercent
  );
  const safePhaseOneProgress = clamp(phaseOneProgress ?? 1, 0, 1);
  const safePhaseThreeProgress = clamp(phaseThreeProgress ?? 0, 0, 1);
  const safePhaseThreeMoveProgress = clamp(phaseThreeMoveProgress ?? safePhaseThreeProgress, 0, 1);
  const safeCameraReengageProgress = clamp(cameraReengageProgress ?? 0, 0, 1);
  const cameraPullbackT = smoothstep(safePhaseOneProgress);
  const cameraReengageT = smoothstep(safeCameraReengageProgress);
  const cameraScale = lerp(CAMERA_START_SCALE, 1, cameraPullbackT)
    * lerp(1, CAMERA_REENGAGE_END_SCALE, cameraReengageT);
  const cameraFollowWeight = 1 - cameraPullbackT;
  const handleRatio = clamp(toPercent(safeHandleLeft, minPercent, maxPercent) / 100, 0, 1);
  const phaseThreeCameraOffsetWeight = smoothstep(safePhaseThreeMoveProgress);
  const trackedCameraTargetPercent = clamp(
    safeTrackedHandleLeft - CAMERA_PHASE_THREE_TRACK_LEFT_OFFSET * phaseThreeCameraOffsetWeight,
    minPercent,
    maxPercent
  );
  const trackedHandleRatio = clamp(toPercent(trackedCameraTargetPercent, minPercent, maxPercent) / 100, 0, 1);
  const phaseOneAnchorRatio = clamp(
    toPercent(phaseOneTargetPercent ?? 70, minPercent, maxPercent) / 100,
    0,
    1
  );
  const phaseOneAnchorPercent = clamp(phaseOneTargetPercent ?? 70, minPercent, maxPercent);
  const phaseOneAnchorLeft = toPercent(phaseOneAnchorPercent, minPercent, maxPercent);
  const seedanceRevealEndPercent = clamp(60, minPercent, maxPercent);
  const seedanceLabelPercent = lerp(minPercent, seedanceRevealEndPercent, 0.5);
  const seedanceLabelLeft = toPercent(seedanceLabelPercent, minPercent, maxPercent);
  const cameraTranslateX =
    (0.5 - handleRatio) * CAMERA_MAX_TRACK_X * 2 * cameraFollowWeight
    + (0.5 - trackedHandleRatio) * CAMERA_MAX_TRACK_X * 2 * cameraReengageT;
  const safeProgress = clamp(progress ?? 0, 0, 1);
  const currentPercent = Math.round(safeHandleLeft);
  const currentPercentColor = toAnchoredColor(handleRatio, phaseOneAnchorRatio);
  const rulerTopColor = mixHex(currentPercentColor, "#ffffff", 0.3);
  const rulerBottomColor = mixHex(currentPercentColor, "#0f172a", 0.12);
  const handleTopColor = mixHex(currentPercentColor, "#ffffff", 0.22);
  const handleBottomColor = mixHex(currentPercentColor, "#0f172a", 0.16);
  const phaseAnchorReveal = smoothstep(clamp(safePhaseThreeProgress / 0.2, 0, 1));
  const cursorDistanceToAnchor = Math.abs(toPercent(safeHandleLeft, minPercent, maxPercent) - phaseOneAnchorLeft);
  const overlapT = clamp(1 - cursorDistanceToAnchor / 8, 0, 1) * phaseAnchorReveal;
  const overlapRelease = smoothstep(safePhaseThreeMoveProgress);
  const overlapWeight = overlapT * (1 - overlapRelease * 0.15);
  const cursorAvoidDirection = safeHandleLeft >= phaseOneAnchorPercent ? 1 : -1;
  const cursorLabelShiftX = lerp(0, 34 * cursorAvoidDirection, overlapWeight);
  const cursorLabelShiftY = lerp(0, -6, overlapWeight);
  const phase = safeProgress * Math.PI * 2;
  const tiltRotateY = lerp(20, 0, safePhaseOneProgress);
  const tiltRotateX = Math.cos(phase + Math.PI * 0.1) * 4.25;
  const tiltTranslateY = Math.sin(phase * 2 - Math.PI * 0.25) * 3.5;
  const tiltScale = 1 + Math.cos(phase) * 0.006;
  const tiltShadow = `drop-shadow(0 ${20 + Math.abs(tiltRotateX) * 1.3}px ${
    24 + Math.abs(tiltRotateY) * 1.8
  }px rgba(15,23,42,0.18))`;
  const sheenAngle = 112 + tiltRotateY * 2.2;

  useEffect(() => {
    const cursorLabelNode = cursorLabelRef.current;
    const seedanceLabelNode = seedanceLabelRef.current;

    if (!cursorLabelNode || !seedanceLabelNode) {
      return;
    }

    const cursorRect = cursorLabelNode.getBoundingClientRect();
    const seedanceRect = seedanceLabelNode.getBoundingClientRect();
    const revealWidth = clamp(cursorRect.right - seedanceRect.left, 0, seedanceRect.width);
    const nextRevealPercent = seedanceRect.width <= 0 ? 0 : (revealWidth / seedanceRect.width) * 100;

    setSeedanceRevealPercent((prev) => (Math.abs(prev - nextRevealPercent) < 0.1 ? prev : nextRevealPercent));
  }, [
    cameraScale,
    cameraTranslateX,
    currentPercent,
    cursorLabelShiftX,
    cursorLabelShiftY,
    safeHandleLeft,
    seedanceLabelLeft,
    tiltRotateX,
    tiltRotateY,
    tiltScale,
    tiltTranslateY,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <div
        className="absolute inset-0 flex items-center justify-center px-[8%] py-[8%]"
        style={{
          transform: `translate3d(${cameraTranslateX}px, 0, 0) scale(${cameraScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <div className="w-full max-w-[920px]">
          <div className="pb-15" style={{ perspective: 1100 }}>
            <div
              className="relative origin-center"
              style={{
                transformStyle: "preserve-3d",
                transform: `translateY(${tiltTranslateY}px) rotateX(${tiltRotateX}deg) rotateY(${tiltRotateY}deg) scale(${tiltScale})`,
                filter: tiltShadow,
              }}
            >
              <div
                className="relative h-[90px] rounded-[24px] px-10 shadow-[0_0_0_0.66px_rgba(0,0,0,0.09),0_12px_25px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.03)]"
                style={{
                  background: `linear-gradient(180deg, ${rulerTopColor} 0%, ${rulerBottomColor} 100%)`,
                  boxShadow:
                    "inset 0 0 0 5px rgba(255,255,255,0.92), 0 0 0 0.66px rgba(0,0,0,0.1), 0 12px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-[24px]"
                  style={{
                    background: `linear-gradient(${sheenAngle}deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 34%, rgba(255,255,255,0) 60%)`,
                    mixBlendMode: "screen",
                  }}
                />

                <div className="absolute inset-x-10 bottom-[10px] top-[10px]">
                  {ticks.map((value, index) => {
                    const left = toPercent(value, minPercent, maxPercent);
                    const isMajor = majorTickSet.has(value);
                    const longTick = isMajor || index % 4 === 0;

                    return (
                      <div
                        key={value}
                        className="absolute bottom-0 w-[2px] rounded-full bg-white/78"
                        style={{
                          left: `${left}%`,
                          height: longTick ? 21 : 14,
                          transform: "translateX(-50%)",
                        }}
                      />
                    );
                  })}

                </div>

                <div
                  className="absolute bottom-[10px] top-[10px] w-[4px]"
                  style={{
                    left: `${phaseOneAnchorLeft}%`,
                    opacity: phaseAnchorReveal,
                    transform: `translateX(-50%) scaleY(${lerp(0.3, 1, phaseAnchorReveal)})`,
                    transformOrigin: "50% 100%",
                    background:
                      "repeating-linear-gradient(180deg, rgba(255,255,255,0.98) 0 7px, rgba(255,255,255,0.22) 7px 12px)",
                    boxShadow: "0 0 0.5px rgba(255,255,255,0.95), 0 0 10px rgba(255,255,255,0.8)",
                  }}
                />

                <div
                  className="absolute top-1/2 h-[96px] w-[28px] -translate-y-1/2 rounded-[10px] shadow-[inset_0_0_0_3px_white,0_0_0_0.66px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08),0_3px_8px_2px_rgba(0,0,0,0.08)]"
                  style={{
                    left: `calc(${toPercent(safeHandleLeft, minPercent, maxPercent)}% - 14px)`,
                    zIndex: 20,
                    background: `linear-gradient(180deg, ${handleTopColor} 0%, ${handleBottomColor} 100%)`,
                  }}
                >
                  <div
                    ref={cursorLabelRef}
                    className="absolute bottom-[calc(100%+12px)] left-1/2 whitespace-nowrap text-[60px] font-black tracking-[-0.02em]"
                    style={{
                      zIndex: 30,
                      color: currentPercentColor,
                      textShadow: "0 2px 6px rgba(15,23,42,0.38)",
                      transform: `translateX(calc(-50% + ${cursorLabelShiftX}px)) translateY(${cursorLabelShiftY}px)`,
                      transformOrigin: "center bottom",
                    }}
                  >
                    {currentPercent}%
                  </div>
                </div>

                <div
                  className="pointer-events-none absolute bottom-[calc(100%+12px)] whitespace-nowrap text-[60px] font-black tracking-[-0.02em]"
                  style={{
                    left: `${phaseOneAnchorLeft}%`,
                    opacity: phaseAnchorReveal,
                    color: "rgba(255,255,255,0.98)",
                    textShadow: "0 2px 6px rgba(15,23,42,0.45), 0 0 8px rgba(255,255,255,0.35)",
                    transform: `translateX(-50%) translateY(${10 - phaseAnchorReveal * 10}px) scale(${lerp(0.92, 1, phaseAnchorReveal)})`,
                    transformOrigin: "center bottom",
                  }}
                >
                  {Math.round(phaseOneAnchorPercent)}%
                </div>

                <div
                  ref={seedanceLabelRef}
                  className="pointer-events-none absolute bottom-[calc(100%+12px)] whitespace-nowrap text-[60px] font-black tracking-[-0.02em]"
                  style={{
                    left: `${seedanceLabelLeft}%`,
                    zIndex: 10,
                    color: "white",
                    textShadow: "0 2px 6px rgba(15,23,42,0.38)",
                    transform: "translateX(-50%)",
                    transformOrigin: "center bottom",
                    clipPath: `inset(0 ${100 - seedanceRevealPercent}% 0 0)`,
                  }}
                >
                  Seedance 2.0
                </div>
              </div>

              <div
                className="relative mt-4 h-7 text-[21px] font-semibold tracking-[-0.015em] text-white/92"
                style={{ textShadow: "0 1px 4px rgba(15,23,42,0.5)" }}
              >
                {safeMajorTickValues.map((value) => (
                  <div
                    key={value}
                    className="absolute whitespace-nowrap"
                    style={{
                      left: `${toPercent(value, minPercent, maxPercent)}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {Math.round(toPercent(value, minPercent, maxPercent))}%
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
