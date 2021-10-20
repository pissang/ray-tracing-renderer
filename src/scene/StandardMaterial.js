export class StandardMaterial {

  constructor() {
    /**
     * @property {number[]}
     */
    this.color = null;
    /**
     * @property {number}
     */
    this.roughness = null;
    /**
     * @property {number}
     */
    this.metalness = null;

    /**
     * @property {import('./Texture').Texture}
     */
    this.map = null;

    /**
     * @property {number[]}
     */
    this.emissive = null;

    /**
     * @property {number}
     */
    this.emissiveIntensity = null;
    /**
     * @property {import('./Texture').Texture}
     */
    this.emissiveMap = null;

    /**
     * @property {import('./Texture').Texture}
     */
    this.normalMap = null;

    /**
     * @property {number[]}
     */
    this.normalScale = null;

    /**
     * @property {import('./Texture').Texture}
     */
    this.roughnessMap = null;
    /**
     * @property {import('./Texture').Texture}
     */
    this.metalnessMap = null;

    /**
     * @property {boolean}
     */
    this.transparent = false;

    this.solid = true;
    this.shadowCaster = true;
  }
}