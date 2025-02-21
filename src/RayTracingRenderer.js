import { loadExtensions } from './renderer/glUtil';
import { makeRenderingPipeline } from './renderer/RenderingPipeline';
import * as constants from './constants';

const glRequiredExtensions = [
  'EXT_color_buffer_float', // enables rendering to float buffers
  'EXT_float_blend',
];

const glOptionalExtensions = [
  'OES_texture_float_linear', // enables gl.LINEAR texture filtering for float textures,
];

export function RayTracingRenderer(params = {}) {
  const canvas = params.canvas || document.createElement('canvas');

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    depth: true,
    stencil: false,
    antialias: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: true
  });

  loadExtensions(gl, glRequiredExtensions);
  const optionalExtensions = loadExtensions(gl, glOptionalExtensions);

  let pipeline = null;
  const size = {width: 0, height: 0};
  let pixelRatio = 1;

  let oldRenderList = [];

  const module = {
    bounces: 2,
    domElement: canvas,
    maxHardwareUsage: false,
    needsUpdate: true,
    onSampleRendered: null,
    renderWhenOffFocus: true,
    toneMapping: constants.ACESFilmicToneMapping,
    toneMappingExposure: 1,
    toneMappingWhitePoint: 1,
  };

  function initRenderList(renderList, background) {
    const toneMappingParams = {
      exposure: module.toneMappingExposure,
      whitePoint: module.toneMappingWhitePoint,
      toneMapping: module.toneMapping
    };

    const bounces = module.bounces;

    pipeline = makeRenderingPipeline({gl, optionalExtensions, renderList, background, toneMappingParams, bounces});

    pipeline.onSampleRendered = (...args) => {
      if (module.onSampleRendered) {
        module.onSampleRendered(...args);
      }
    };

    module.setSize(size.width, size.height);
    module.needsUpdate = false;
  }

  module.setSize = (width, height, updateStyle = true) => {
    size.width = width;
    size.height = height;

    canvas.width = size.width * pixelRatio;
    canvas.height = size.height * pixelRatio;

    if (updateStyle) {
      canvas.style.width = `${ size.width }px`;
      canvas.style.height = `${ size.height }px`;
    }

    if (pipeline) {
      pipeline.setSize(size.width * pixelRatio, size.height * pixelRatio);
    }
  };

  module.getSize = () => {
    return {
      width: size.width,
      height: size.height
    };
  };

  module.setPixelRatio = (pr) => {
    if (!pr) {
      return;
    }
    pixelRatio = pr;
    module.setSize(size.width, size.height, false);
  };

  module.getPixelRatio = () => pixelRatio;

  module.getTotalSamplesRendered = () => {
    if (pipeline) {
      return pipeline.getTotalSamplesRendered();
    }
  };

  let isValidTime = 1;
  let currentTime = NaN;
  let syncWarning = false;

  function restartTimer() {
    isValidTime = NaN;
  }

  module.sync = (t) => {
    // the first call to the callback of requestAnimationFrame does not have a time parameter
    // use performance.now() in this case
    currentTime = t || performance.now();
  };

  let lastFocus = false;

  function isSameRenderList(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  module.render = (renderList, camera, background) => {
    if (!module.renderWhenOffFocus) {
      const hasFocus = document.hasFocus();
      if (!hasFocus) {
        lastFocus = hasFocus;
        return;
      } else if (hasFocus && !lastFocus) {
        lastFocus = hasFocus;
        restartTimer();
      }
    }

    if (module.needsUpdate || !isSameRenderList(oldRenderList, renderList)) {
      initRenderList(renderList, background);
      oldRenderList = renderList.slice();
    }

    if (isNaN(currentTime)) {
      if (!syncWarning) {
        console.warn('Ray Tracing Renderer warning: For improved performance, please call renderer.sync(time) before render.render(scene, camera), with the time parameter equalling the parameter passed to the callback of requestAnimationFrame');
        syncWarning = true;
      }

      currentTime = performance.now(); // less accurate than requestAnimationFrame's time parameter
    }

    pipeline.time(isValidTime * currentTime);

    isValidTime = 1;
    currentTime = NaN;


    if(module.maxHardwareUsage) {
      // render new sample for the entire screen
      pipeline.drawFull(camera);
    } else {
      // render new sample for a tiled subset of the screen
      pipeline.draw(camera);
    }
  };

  // Assume module.render is called using requestAnimationFrame.
  // This means that when the user is on a different browser tab, module.render won't be called.
  // Since the timer should not measure time when module.render is inactive,
  // the timer should be reset when the user switches browser tabs
  document.addEventListener('visibilitychange', restartTimer);

  module.dispose = () => {
    document.removeEventListener('visibilitychange', restartTimer);
    pipeline = null;
  };

  return module;
}

RayTracingRenderer.isSupported = () => {
  const gl = document.createElement('canvas')
    .getContext('webgl2', {
      failIfMajorPerformanceCaveat: true
    });

  if (!gl) {
    return false;
  }

  const extensions = loadExtensions(gl, glRequiredExtensions);
  for (let e in extensions) {
    if (!extensions[e]) {
      return false;
    }
  }

  return true;
};
