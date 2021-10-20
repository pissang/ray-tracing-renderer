import {SceneNode} from './SceneNode';

export class Mesh extends SceneNode {

  constructor(geometry, material) {
    super();

    /**
     * @property {import('./Geometry').Geometry}
     */
    this.geometry = geometry;
    /**
     * @property {import('./StandardMaterial').StandardMaterial}
     */
    this.material = material;
  }
}