import React, { useEffect, useMemo } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toPercent = (value, min, max) => {
  if (max <= min) {
    return 50;
  }
  return ((value - min) / (max - min)) * 100;
};

const TICK_STEP = 100;

export const DemoMotionScene = ({
  kelvin,
  minKelvin,
  maxKelvin,
  majorTickValues,
  handleLeftPercent,
  onAutoLayoutReady,
}) => {
  useEffect(() => {
    onAutoLayoutReady?.();
  }, [onAutoLayoutReady]);

  const ticks = useMemo(() => {
    const result = [];
    for (let value = minKelvin; value <= maxKelvin; value += TICK_STEP) {
      result.push(value);
    }
    return result;
  }, [maxKelvin, minKelvin]);

  const majorTickSet = useMemo(
    () => new Set(Array.isArray(majorTickValues) ? majorTickValues : []),
    [majorTickValues]
  );
  const safeMajorTickValues = Array.isArray(majorTickValues) ? majorTickValues : [];
  const safeHandleLeft = clamp(handleLeftPercent ?? 50, 0, 100);

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <div className="absolute inset-0 flex items-center justify-center px-[8%] py-[8%]">
        <div className="w-full max-w-[920px]">
          <div className="pb-15">
            <div
              className="relative h-[90px] rounded-[24px] px-10 shadow-[0_0_0_0.66px_rgba(0,0,0,0.09),0_12px_25px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.03)]"
              style={{
                background:
                  "linear-gradient(90deg, #fcc47b 0%, #fcf9f5 50%, #fcf9f5 56%, #daedf8 100%)",
                boxShadow:
                  "inset 0 0 0 5px rgba(255,255,255,0.92), 0 0 0 0.66px rgba(0,0,0,0.1), 0 12px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div className="absolute inset-x-10 bottom-[10px] top-[10px]">
                {ticks.map((value, index) => {
                  const left = toPercent(value, minKelvin, maxKelvin);
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
                className="absolute top-1/2 h-[47px] w-[28px] -translate-y-1/2 rounded-[10px] bg-[#87b9ff] shadow-[inset_0_0_0_3px_white,0_0_0_0.66px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08),0_3px_8px_2px_rgba(0,0,0,0.08)]"
                style={{
                  left: `calc(${safeHandleLeft}% - 14px)`,
                }}
              />
            </div>

            <div className="relative mt-4 h-7 text-[19px] font-semibold tracking-[-0.015em] text-slate-700/90">
              {safeMajorTickValues.map((value) => (
                <div
                  key={value}
                  className="absolute whitespace-nowrap"
                  style={{
                    left: `${toPercent(value, minKelvin, maxKelvin)}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {value}
                  K
                </div>
              ))}
            </div>

            <div className="mt-7 inline-flex items-center rounded-full border border-slate-400/30 bg-white/72 px-5 py-2 text-[1rem] font-semibold text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.12)] backdrop-blur">
              Current: {Math.round(kelvin)}K
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
