import React, { useEffect, useMemo } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

const WARM_START_RATIO = 0.6;
const COOL_COLOR = "#1d4ed8";
const WARM_COLOR = "#f28a58";
const PREWARM_RATIO_MAX = 0.24;
const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const toColorMixRatio = (
  ratio,
  warmStart = WARM_START_RATIO,
  prewarmRatioMax = PREWARM_RATIO_MAX
) => {
  const earlyT = clamp(ratio / Math.max(0.0001, warmStart), 0, 1);
  const earlyRatio = smoothstep(earlyT) * prewarmRatioMax;
  const lateT = clamp((ratio - warmStart) / Math.max(0.0001, 1 - warmStart), 0, 1);
  const lateRatio = smoothstep(lateT);
  return earlyRatio + (1 - prewarmRatioMax) * lateRatio;
};

const TICK_STEP = 2;

export const DemoMotionScene = ({
  minPercent,
  maxPercent,
  majorTickValues,
  handleLeftPercent,
  progress,
  onAutoLayoutReady,
}) => {
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
  const handleRatio = clamp(toPercent(safeHandleLeft, minPercent, maxPercent) / 100, 0, 1);
  const colorMixRatio = toColorMixRatio(handleRatio);
  const safeProgress = clamp(progress ?? 0, 0, 1);
  const currentPercent = Math.round(safeHandleLeft);
  const currentPercentColor = mixHex(COOL_COLOR, WARM_COLOR, colorMixRatio);
  const rulerTopColor = mixHex(currentPercentColor, "#ffffff", 0.3);
  const rulerBottomColor = mixHex(currentPercentColor, "#0f172a", 0.12);
  const handleTopColor = mixHex(currentPercentColor, "#ffffff", 0.22);
  const handleBottomColor = mixHex(currentPercentColor, "#0f172a", 0.16);
  const phase = safeProgress * Math.PI * 2;
  const tiltRotateY = Math.sin(phase) * 7.5;
  const tiltRotateX = Math.cos(phase + Math.PI * 0.1) * 4.25;
  const tiltTranslateY = Math.sin(phase * 2 - Math.PI * 0.25) * 3.5;
  const tiltScale = 1 + Math.cos(phase) * 0.006;
  const tiltShadow = `drop-shadow(0 ${20 + Math.abs(tiltRotateX) * 1.3}px ${
    24 + Math.abs(tiltRotateY) * 1.8
  }px rgba(15,23,42,0.18))`;
  const sheenAngle = 112 + tiltRotateY * 2.2;

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <div className="absolute inset-0 flex items-center justify-center px-[8%] py-[8%]">
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
                  className="absolute top-1/2 h-[96px] w-[28px] -translate-y-1/2 rounded-[10px] shadow-[inset_0_0_0_3px_white,0_0_0_0.66px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08),0_3px_8px_2px_rgba(0,0,0,0.08)]"
                  style={{
                    left: `calc(${toPercent(safeHandleLeft, minPercent, maxPercent)}% - 14px)`,
                    background: `linear-gradient(180deg, ${handleTopColor} 0%, ${handleBottomColor} 100%)`,
                  }}
                >
                  <div
                    className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 whitespace-nowrap text-[30px] font-black tracking-[-0.02em]"
                    style={{
                      color: currentPercentColor,
                      textShadow: "0 2px 6px rgba(15,23,42,0.38)",
                    }}
                  >
                    {currentPercent}%
                  </div>
                </div>
              </div>

              <div
                className="relative mt-4 h-7 text-[19px] font-semibold tracking-[-0.015em] text-white/92"
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
