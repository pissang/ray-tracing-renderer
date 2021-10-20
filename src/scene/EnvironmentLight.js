export class EnvironmentLight {
  constructor(map, intensity) {
    /**
     * @property {import('./Texture').Texture}
     */
    this.map = map;

    this.intensity = intensity == null ? 1 : intensity;
  }
}