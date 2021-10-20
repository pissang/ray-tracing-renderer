export class AmbientLight {
  constructor(color, intensity) {
    /**
     * @property {number[]}
     */
    this.color = color || [1, 1, 1];

    this.intensity = intensity == null ? 1 : intensity;
  }
}