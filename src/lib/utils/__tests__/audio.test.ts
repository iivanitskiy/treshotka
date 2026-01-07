import { getLoudest, VolumeEntry } from "../audio";

describe("getLoudest", () => {
  it("returns undefined for empty input", () => {
    expect(getLoudest([])).toBeUndefined();
  });

  it("returns the entry with maximum level", () => {
    const volumes: VolumeEntry[] = [
      { level: 10, uid: "a" },
      { level: 30, uid: "b" },
      { level: 20, uid: "c" },
    ];
    expect(getLoudest(volumes)).toEqual({ level: 30, uid: "b" });
  });

  it("handles equal levels deterministically (first max wins)", () => {
    const volumes: VolumeEntry[] = [
      { level: 30, uid: "a" },
      { level: 30, uid: "b" },
    ];
    expect(getLoudest(volumes)).toEqual({ level: 30, uid: "a" });
  });

  it("performs efficiently on large arrays", () => {
    const volumes: VolumeEntry[] = Array.from({ length: 50000 }, (_, i) => ({
      level: i % 100,
      uid: i,
    }));
    const start = performance.now();
    const result = getLoudest(volumes);
    const elapsed = performance.now() - start;

    expect(result?.level).toBe(99);
    expect(elapsed).toBeLessThan(500);
  });
});

