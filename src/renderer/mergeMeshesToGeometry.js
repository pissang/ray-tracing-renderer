import { Attribute, Geometry } from '../scene/Geometry';
import {mat4, vec3} from 'gl-matrix';

export function mergeMeshesToGeometry(meshes) {

  let vertexCount = 0;
  let indexCount = 0;

  const geometryAndMaterialIndex = [];
  const materialIndexMap = new Map();

  for (const mesh of meshes) {
    let geometry = mesh.geometry;

    const index = geometry.indices;
    if (!index) {
      addFlatGeometryIndices(geometry);
    }

    geometry = transformGeometry(geometry, mesh.matrixWorld);

    if (!geometry.normal) {
      computeGeometryNormals(geometry);
    }
    else {
      vec3.forEach(geometry.normal.array, 3, 0, undefined, vec3.normalize);
    }

    vertexCount += geometry.position.count;
    indexCount += geometry.indices.count;

    const material = mesh.material;
    let materialIndex = materialIndexMap.get(material);
    if (materialIndex === undefined) {
      materialIndex = materialIndexMap.size;
      materialIndexMap.set(material, materialIndex);
    }

    geometryAndMaterialIndex.push({
      geometry,
      materialIndex
    });
  }

  const geometry = mergeGeometry(geometryAndMaterialIndex, vertexCount, indexCount);

  return {
    geometry,
    materials: Array.from(materialIndexMap.keys())
  };
}

function mergeGeometry(geometryAndMaterialIndex, vertexCount, indexCount) {
  const positionAttrib = new Attribute(new Float32Array(3 * vertexCount), 3);
  const normalAttrib = new Attribute(new Float32Array(3 * vertexCount), 3);
  const uvAttrib = new Attribute(new Float32Array(2 * vertexCount), 2);
  const indexAttrib = new Attribute(new Uint32Array(indexCount), 1);

  const materialMeshIndexAttrib = new Attribute(new Int32Array(2 * vertexCount), 2);

  const mergedGeometry = new Geometry({
    position: positionAttrib,
    normal: normalAttrib,
    uv: uvAttrib,
    indices: indexAttrib
  });
  mergedGeometry.materialMeshIndex = materialMeshIndexAttrib;

  let currentVertex = 0;
  let currentIndex = 0;
  let currentMesh = 1;

  for (const { geometry, materialIndex } of geometryAndMaterialIndex) {
    const vertexCount = geometry.position.count;

    ['position', 'normal', 'uv'].forEach(function (attr) {
      mergedGeometry[attr].array.set(geometry[attr].array, currentVertex * geometry[attr].itemSize);
    });

    const meshIndices = geometry.indices.array;
    for (let i = 0; i < meshIndices.length; i++) {
      indexAttrib.array[currentIndex + i] = currentVertex + meshIndices[i];
    }

    for (let i = 0; i < vertexCount * 2;) {
      materialMeshIndexAttrib.array[currentVertex * 2 + i++] = materialIndex;
      materialMeshIndexAttrib.array[currentVertex * 2 + i++] = currentMesh;
    }

    currentVertex += vertexCount;
    currentIndex += meshIndices.length;
    currentMesh++;
  }

  return mergedGeometry;
}

function addFlatGeometryIndices(geometry) {
  const position = geometry.position;

  if (!position) {
    console.warn('No position attribute');
    return;
  }

  const index = new Uint32Array(position.count);

  for (let i = 0; i < index.length; i++) {
    index[i] = i;
  }

  geometry.indices = new Attribute(index, 1, false);

  return geometry;
}

function transformGeometry(geometry, matrix) {
  const newGeometry = new Geometry({
    position: new Attribute(geometry.position.array.slice(), geometry.position.itemSize),
    normal: geometry.normal && new Attribute(geometry.normal.array.slice(), geometry.normal.itemSize),
    // No need to clone uv
    uv: geometry.uv && new Attribute(geometry.uv.array, geometry.uv.itemSize),
    indices: geometry.indices && new Attribute(geometry.indices.array, geometry.indices.itemSize),
  });

  // Normal Matrix
  const inverseTransposeMatrix = mat4.create();
  mat4.invert(inverseTransposeMatrix, matrix);
  mat4.transpose(inverseTransposeMatrix, inverseTransposeMatrix);

  vec3.forEach(newGeometry.position.array, 3, 0, null, vec3.transformMat4, matrix);
  if (newGeometry.normal) {
      vec3.forEach(newGeometry.normal.array, 3, 0, null, vec3.transformMat4, inverseTransposeMatrix);
  }
  return newGeometry;
}

function computeGeometryNormals(geometry) {
  const indices = geometry.indices;
  const positions = geometry.position.array;
  geometry.normal = new Attribute(new Float32Array(positions.length), 3);
  const normals = geometry.normal.array;

  const p1 = vec3.create();
  const p2 = vec3.create();
  const p3 = vec3.create();

  const v21 = vec3.create();
  const v32 = vec3.create();

  const n = vec3.create();

  const len = indices ? indices.length : this.vertexCount;
  let i1, i2, i3;
  for (let f = 0; f < len;) {
      if (indices) {
          i1 = indices[f++];
          i2 = indices[f++];
          i3 = indices[f++];
      }
      else {
          i1 = f++;
          i2 = f++;
          i3 = f++;
      }

      vec3.set(p1, positions[i1*3], positions[i1*3+1], positions[i1*3+2]);
      vec3.set(p2, positions[i2*3], positions[i2*3+1], positions[i2*3+2]);
      vec3.set(p3, positions[i3*3], positions[i3*3+1], positions[i3*3+2]);

      vec3.sub(v21, p1, p2);
      vec3.sub(v32, p2, p3);
      vec3.cross(n, v21, v32);
      // Already be weighted by the triangle area
      for (let i = 0; i < 3; i++) {
          normals[i1*3+i] = normals[i1*3+i] + n[i];
          normals[i2*3+i] = normals[i2*3+i] + n[i];
          normals[i3*3+i] = normals[i3*3+i] + n[i];
      }
  }

  for (let i = 0; i < normals.length;) {
      vec3.set(n, normals[i], normals[i+1], normals[i+2]);
      vec3.normalize(n, n);
      normals[i++] = n[0];
      normals[i++] = n[1];
      normals[i++] = n[2];
  }
}