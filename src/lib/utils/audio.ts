export type VolumeEntry = { level: number; uid: string | number };

export function getLoudest(volumes: VolumeEntry[]): VolumeEntry | undefined {
  let loudest: VolumeEntry | undefined;
  for (let i = 0; i < volumes.length; i++) {
    const v = volumes[i];
    if (!loudest || v.level > loudest.level) {
      loudest = v;
    }
  }
  return loudest;
}

