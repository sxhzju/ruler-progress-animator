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

const TICK_STEP = 2;

export const DemoMotionScene = ({
  minPercent,
  maxPercent,
  majorTickValues,
  handleLeftPercent,
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
  const safeHandleLeft = clamp(handleLeftPercent ?? 50, 0, 100);
  const currentPercent = Math.round(safeHandleLeft);
  const currentPercentColor = mixHex("#daedf8", "#f28a58", safeHandleLeft / 100);

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <div className="absolute inset-0 flex items-center justify-center px-[8%] py-[8%]">
        <div className="w-full max-w-[920px]">
          <div className="pb-15">
            <div
              className="relative h-[90px] rounded-[24px] px-10 shadow-[0_0_0_0.66px_rgba(0,0,0,0.09),0_12px_25px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.03)]"
              style={{
                background:
                  "linear-gradient(90deg, #daedf8 0%, #fcf9f5 50%, #fcf9f5 56%, #f28a58 100%)",
                boxShadow:
                  "inset 0 0 0 5px rgba(255,255,255,0.92), 0 0 0 0.66px rgba(0,0,0,0.1), 0 12px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div className="absolute inset-x-10 bottom-[10px] top-[10px]">
                {ticks.map((value, index) => {
                  const left = toPercent(value, minPercent, maxPercent);
                  const isMajor = majorTickSet.has(value);
                  const longTick = isMajor || index % 4 === 0;

                  return (
                    <div
                      key={value}
                      className="absolute bottom-0 w-[2px] rounded-full bg-slate-500/45"
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
                className="absolute top-1/2 h-[96px] w-[28px] -translate-y-1/2 rounded-[10px] bg-[#87b9ff] shadow-[inset_0_0_0_3px_white,0_0_0_0.66px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08),0_3px_8px_2px_rgba(0,0,0,0.08)]"
                style={{
                  left: `calc(${safeHandleLeft}% - 14px)`,
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

            <div className="relative mt-4 h-7 text-[19px] font-semibold tracking-[-0.015em] text-slate-700/90">
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
  );
};
