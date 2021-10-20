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

  copy(source) {
    this.fov = source.fov;
    this.near = source.near;
    this.far = source.far;
    this.aspect = source.aspect;
    this.zoom = source.zoom;
    this.focus = source.focus;
    this.aperture = source.aperture;

    mat4.copy(this.matrixWorld, source.matrixWorld);
  }
}