import { SceneNode } from './SceneNode';
import {mat4} from 'gl-matrix';

export class Camera extends SceneNode {

  constructor(fov, aspect, near, far) {
    super();

    this.fov = fov != null ? fov : 50;
    this.near = near != null ? near : 0.1;
    this.far = far != null ? far : 2000;
    this.aspect = aspect != null ? aspect : 1;

    this.zoom = 1;
    this.focus = 10;

    this.aperture = 0.01;
  }

  get projectionMatrix() {
    return mat4.perspective([], this.fov * Math.PI / 180, this.aspect, this.near, this.far);
  }
}