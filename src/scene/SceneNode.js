import {mat4} from 'gl-matrix';

export class SceneNode {
  constructor() {
    /**
     * @property {Float32Array} matrixWorld World transform matrix..
     */
    this.matrixWorld = mat4.create();
  }

  get matrixWorldInverse() {
    return mat4.invert([], this.matrixWorld);
  }
}