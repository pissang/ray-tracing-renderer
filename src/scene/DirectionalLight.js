export class DirectionalLight {
  constructor(direction, color, intensity, softness) {
    this.direction = direction || [1, 1, 1];
    this.color = color || [1, 1, 1];
    this.intensity = intensity == null ? 1 : intensity;
    this.softness = softness || 0;
  }
}