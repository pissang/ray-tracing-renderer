import fragment from './glsl/reproject.frag';
import { makeRenderPass } from './RenderPass';
import {mat4} from 'gl-matrix';

export function makeReprojectPass(gl, params) {
  const {
    fullscreenQuad,
    maxReprojectedSamples,
  } = params;

  const renderPass = makeRenderPass(gl, {
      defines: {
        MAX_SAMPLES: maxReprojectedSamples.toFixed(1)
      },
      vertex: fullscreenQuad.vertexShader,
      fragment
    });

  function setPreviousCamera(previousCamera) {
    const matrix = mat4.mul([], previousCamera.projectionMatrix, previousCamera.matrixWorldInverse);
    renderPass.setUniform('historyCamera', matrix);
  }

  function setJitter(x, y) {
    renderPass.setUniform('jitter', x, y);
  }

  function draw(params) {
    const {
      blendAmount,
      light,
      lightScale,
      position,
      previousLight,
      previousLightScale,
      previousPosition,
    } = params;

    renderPass.setUniform('blendAmount', blendAmount);
    renderPass.setUniform('lightScale', lightScale.x, lightScale.y);
    renderPass.setUniform('previousLightScale', previousLightScale.x, previousLightScale.y);

    renderPass.setTexture('lightTex', light);
    renderPass.setTexture('positionTex', position);
    renderPass.setTexture('previousLightTex', previousLight);
    renderPass.setTexture('previousPositionTex', previousPosition);

    renderPass.useProgram();
    fullscreenQuad.draw();
  }

  return {
    draw,
    setJitter,
    setPreviousCamera,
  };
}
