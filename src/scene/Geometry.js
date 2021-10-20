export class Attribute {
  constructor(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
  }

  getItem(out, vertexIndex) {
    const array = this.array;
    const itemSize = this.itemSize;
    const offset = vertexIndex * itemSize;
    for (let i = 0; i < itemSize; i++) {
      out[i] = array[offset + i];
    }
  }

  get count() {
    return this.array.length / this.itemSize;
  }
}

export class Geometry {
  constructor(data) {
    data = data || {};

    /**
     * @property {Attribute} position Position of geometry
     */
    this.position = data.position;
    /**
     * @property {Attribute} normal Normal of geometry
     */
    this.normal = data.normal;
    /**
     * @property {Attribute} uv Uv of geometry
     */
    this.uv = data.uv;
    /**
     * @property {Attribute} position Indices of geometry
     */
    this.indices = data.indices;

    /**
     * @property {Attribute} materialMeshIndex Material index of merged geometry.
     */
    this.materialMeshIndex;
  }

}