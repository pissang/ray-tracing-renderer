import {Mesh} from '../scene/Mesh';
import {StandardMaterial} from '../scene/StandardMaterial';
import {Attribute, Geometry} from '../scene/Geometry';
import {Texture} from '../scene/Texture';
import {DirectionalLight} from '../scene/DirectionalLight';
import {AmbientLight} from '../scene/AmbientLight';
import {Camera} from '../scene/Camera';

function convertTexture(threeTexture) {
  if (!threeTexture) {
    return;
  }
  return new Texture(threeTexture.image);
}

function convertMaterial(threeMaterial) {
  const material = new StandardMaterial();
  material.color = threeMaterial.color.toArray();
  material.emissive = threeMaterial.emissive && threeMaterial.emissive.toArray();
  material.transparent = threeMaterial.transparent;
  material.roughness = threeMaterial.roughness;
  material.metalness = threeMaterial.metalness;
  material.emissiveIntensity = threeMaterial.emissiveIntensity;

  material.normalScale = threeMaterial.normalScale && threeMaterial.normalScale.toArray();

  material.map = convertTexture(threeMaterial.map);
  material.emissiveMap = convertTexture(threeMaterial.emissiveMap);
  material.roughnessMap = convertTexture(threeMaterial.roughnessMap);
  material.metalnessMap = convertTexture(threeMaterial.metalnessMap);

  return material;
}

function convertGeometry(threeGeometry) {
  const positionAttrb = threeGeometry.getAttribute('position');
  const normalAttrb = threeGeometry.getAttribute('normal');
  const uvAttrb = threeGeometry.getAttribute('uv');
  const indexAttrb = threeGeometry.getIndex();
  return new Geometry({
    position: positionAttrb && new Attribute(positionAttrb.array, positionAttrb.itemSize),
    normal: normalAttrb && new Attribute(normalAttrb.array, normalAttrb.itemSize),
    uv: uvAttrb && new Attribute(uvAttrb.array, uvAttrb.itemSize),
    indices: indexAttrb && new Attribute(indexAttrb.array, indexAttrb.itemSize),
  });
}

export function fromTHREEScene(scene) {
  const meshes = [];
  const lights = [];

  scene.updateMatrixWorld(true);
  scene.traverse(child => {
    if (child.isMesh) {
      if (!child.geometry) {
        console.warn(child, 'must have a geometry property');
      }
      else if (!(child.material.isMeshStandardMaterial)) {
        console.warn(child, 'must use MeshStandardMaterial in order to be rendered.');
      } else {
        const mesh = new Mesh(
          convertGeometry(child.geometry),
          convertMaterial(child.material)
        );
        mesh.matrixWorld = new Float32Array(child.matrixWorld.elements);
        meshes.push(mesh);
      }
    }
    else if (child.isDirectionalLight) {
      lights.push(new DirectionalLight(
        child.position.clone().sub(child.target.position).toArray(),
        child.color.toArray(),
        child.intensity
      ));
    }
    else if (child.isAmbientLight) {
      lights.push(new AmbientLight(
        child.color.toArray(),
        child.intensity
      ));
    }
  });

  const background = scene.background && (
    scene.background.isColor
      ? scene.background.toArray()
      : new Texture({
        image: {
          data: scene.background.image.data,
          width: scene.background.image.width,
          height: scene.background.image.height
        }
      })
    );

  return {
    background: background,
    renderList: meshes.concat(lights)
  };
}

export function fromTHREECamera(threeCamera, aperture) {
  const camera = new Camera(threeCamera.fov, threeCamera.aspect, threeCamera.near, threeCamera.far);
  threeCamera.updateWorldMatrix(true, false);
  camera.matrixWorld = threeCamera.matrixWorld.elements.slice();
  if (aperture) {
    camera.aperture = aperture;
  }
  return camera;
}