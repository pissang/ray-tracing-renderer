import { makeRenderPass } from './RenderPass';
import vertex from './glsl/gBuffer.vert';
import fragment from './glsl/gBuffer.frag';
import {mat4} from 'gl-matrix';

export function makeGBufferPass(gl, { materialBuffer, mergedMesh }) {
  const renderPass = makeRenderPass(gl, {
    defines: materialBuffer.defines,
    vertex,
    fragment
  });

  renderPass.setTexture('diffuseMap', materialBuffer.textures.diffuseMap);
  renderPass.setTexture('normalMap', materialBuffer.textures.normalMap);
  renderPass.setTexture('pbrMap', materialBuffer.textures.pbrMap);

  const geometry = mergedMesh.geometry;

  const elementCount = geometry.indices.count;

  const vao = gl.createVertexArray();

  gl.bindVertexArray(vao);
  uploadAttributes(gl, renderPass, geometry);
  gl.bindVertexArray(null);

  let jitterX = 0;
  let jitterY = 0;
  function setJitter(x, y) {
    jitterX = x;
    jitterY = y;
  }

  let currentCamera;
  function setCamera(camera) {
    currentCamera = camera;
  }

  function calcCamera() {
    const projView = currentCamera.projectionMatrix;

    projView[8] += 2 * jitterX;
    projView[9] += 2 * jitterY;

    mat4.mul(projView, projView, currentCamera.matrixWorldInverse);

    renderPass.setUniform('projView', projView);
  }

  function draw() {
    calcCamera();
    gl.bindVertexArray(vao);
    renderPass.useProgram();
    gl.enable(gl.DEPTH_TEST);
    gl.drawElements(gl.TRIANGLES, elementCount, gl.UNSIGNED_INT, 0);
    gl.disable(gl.DEPTH_TEST);
  }

  return {
    draw,
    outputLocs: renderPass.outputLocs,
    setCamera,
    setJitter
  };
}

function uploadAttributes(gl, renderPass, geometry) {
  setAttribute(gl, renderPass.attribLocs.aPosition, geometry.position);
  setAttribute(gl, renderPass.attribLocs.aNormal, geometry.normal);
  setAttribute(gl, renderPass.attribLocs.aUv, geometry.uv);
  setAttribute(gl, renderPass.attribLocs.aMaterialMeshIndex, geometry.materialMeshIndex);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices.array, gl.STATIC_DRAW);
}

function setAttribute(gl, location, bufferAttribute) {
  if (location === undefined) {
    return;
  }

  const { itemSize, array } = bufferAttribute;

  gl.enableVertexAttribArray(location);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

  if (array instanceof Float32Array) {
    gl.vertexAttribPointer(location, itemSize, gl.FLOAT, false, 0, 0);
  } else if (array instanceof Int32Array) {
    gl.vertexAttribIPointer(location, itemSize, gl.INT, 0, 0);
  } else {
    throw 'Unsupported buffer type';
  }
}
