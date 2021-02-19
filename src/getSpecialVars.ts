export interface SpecialVarItem {
  present: boolean;
  params: number[];
  values: number[];
}
export interface SpecialVars {
  [key: string]: SpecialVarItem;
}

//Multiparameter state functions
export const getSpecialVars = (gl: WebGLRenderingContext) => {
  const specialVars = {
    blendEquationSeparate: [gl.BLEND_EQUATION_ALPHA, gl.BLEND_EQUATION_RGB],
    blendFuncSeparate: [gl.BLEND_SRC_RGB, gl.BLEND_DST_RGB, gl.BLEND_SRC_ALPHA, gl.BLEND_DST_ALPHA],
    sampleCoverage: [gl.SAMPLE_COVERAGE_INVERT, gl.SAMPLE_COVERAGE_VALUE],
    polygonOffset: [gl.POLYGON_OFFSET_FACTOR, gl.POLYGON_OFFSET_UNITS],
    stencilFuncSeparate_FRONT: [gl.STENCIL_FUNC, gl.STENCIL_REF, gl.STENCIL_VALUE_MASK],
    stencilFuncSeparate_BACK: [
      gl.STENCIL_BACK_FUNC,
      gl.STENCIL_BACK_REF,
      gl.STENCIL_BACK_VALUE_MASK,
    ],
    stencilOpSeparate_FRONT: [
      gl.STENCIL_FAIL,
      gl.STENCIL_PASS_DEPTH_FAIL,
      gl.STENCIL_PASS_DEPTH_PASS,
    ],
    stencilOpSeparate_BACK: [
      gl.STENCIL_BACK_FAIL,
      gl.STENCIL_BACK_PASS_DEPTH_FAIL,
      gl.STENCIL_BACK_PASS_DEPTH_PASS,
    ],
  };

  return Object.keys(specialVars).reduce((acc, id) => {
    const params = specialVars[id];
    acc[id] = {
      present: false,
      params,
      values: [], // params.map((k: number) => gl.getParameter(k)),
    };
    return acc;
  }, {} as SpecialVars);
};
