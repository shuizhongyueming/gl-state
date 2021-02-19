import uniq from 'uniq';
import { getDefaultVariables } from './getDefaultVariables';
import { getSpecialVars, SpecialVars } from './getSpecialVars';
import { range } from './utils/range';

interface GlStack {
  curTex?: number;
  texState?: Array<[number, number]>;
  stateStacks: Array<
    number | boolean | number[] | WebGLProgram | WebGLBuffer | WebGLFramebuffer | WebGLRenderbuffer
  >;
  specialVars: SpecialVars;
}

function createGLStateStack(gl: WebGLRenderingContext, variables?: number[]) {
  //By default SAVE EVERYTHING
  if (!variables) {
    variables = getDefaultVariables(gl);
  }

  //Compute a collection of state variables
  const nvariables = variables.slice();
  nvariables.sort(function (a, b) {
    return a - b;
  });
  uniq(nvariables);

  const glStateStack: GlStack[] = [];

  //Check if texture state needs to be saved
  const textureTypes = [
    gl.TEXTURE,
    gl.TEXTURE_2D,
    gl.TEXTURE_CUBE_MAP,
    gl.TEXTURE_BINDING_2D,
    gl.TEXTURE_BINDING_CUBE_MAP,
  ];
  const isNeedSaveTexture = textureTypes.some(function (v) {
    return nvariables.indexOf(v) >= 0;
  });
  const restoreActive = nvariables.indexOf(gl.ACTIVE_TEXTURE) < 0;

  var numTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

  return {
    push() {
      const stack: GlStack = {
        stateStacks: [],
        specialVars: getSpecialVars(gl),
      };
      const specialVarValues = Object.values(stack.specialVars);

      if (isNeedSaveTexture) {
        stack.curTex = gl.getParameter(gl.ACTIVE_TEXTURE);
        stack.texState = range(0, numTextures).map((n) => {
          gl.activeTexture(gl.TEXTURE0 + n);
          return [
            gl.getParameter(gl.TEXTURE_BINDING_2D),
            gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP),
          ];
        });
        gl.activeTexture(stack.curTex);
      }

      stack.stateStacks = nvariables
        // 过滤掉属于textureTypes的
        .filter((type) => textureTypes.indexOf(type) === -1)
        .map((type) => {
          switch (type) {
            case gl.SAMPLE_COVERAGE:
              return gl.isEnabled(gl.SAMPLE_COVERAGE);
            default:
              const special = specialVarValues.find((n) => n.params.indexOf(type) >= 0);
              if (special && special.present === false) {
                special.values = special.params.map((k: number) => gl.getParameter(k));
                special.present = true;
              }

              return gl.getParameter(type);
          }
        });

      glStateStack.push(stack);
    },
    pop() {
      const stack = glStateStack.pop();
      if (!stack) {
        return;
      }
      const { stateStacks, specialVars } = stack;

      if (isNeedSaveTexture) {
        let curTex: number;
        if (restoreActive) {
          curTex = gl.getParameter(gl.ACTIVE_TEXTURE);
        }
        range(0, numTextures).forEach((n) => {
          gl.activeTexture(gl.TEXTURE0 + n);
          gl.bindTexture(gl.TEXTURE_2D, stack.texState[n][0]);
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, stack.texState[n][1]);
        });
        if (restoreActive) {
          gl.activeTexture(curTex);
        }
      }

      nvariables
        // 过滤掉属于textureTypes的
        .filter((type) => textureTypes.indexOf(type) === -1)
        .forEach((type) => {
          const sv = stateStacks.pop();
          switch (type) {
            case gl.ACTIVE_TEXTURE:
              return gl.activeTexture(sv as number);
            case gl.ARRAY_BUFFER_BINDING:
              return gl.bindBuffer(gl.ARRAY_BUFFER, sv as number);
            case gl.BLEND_COLOR:
              // @ts-ignore
              return gl.blendColor(...sv);
            case gl.COLOR_CLEAR_VALUE:
              // @ts-ignore
              return gl.clearColor(...sv);
            case gl.COLOR_WRITEMASK:
              // @ts-ignore
              return gl.colorMask(...sv);
            case gl.CULL_FACE_MODE:
              // @ts-ignore
              return gl.cullFace(...sv);
            case gl.CURRENT_PROGRAM:
              return gl.useProgram(sv as WebGLProgram);
            case gl.DEPTH_CLEAR_VALUE:
              return gl.clearDepth(sv as number);
            case gl.DEPTH_FUNC:
              return gl.depthFunc(sv as number);
            case gl.DEPTH_RANGE:
              // @ts-ignore
              return gl.depthRange(...sv);
            case gl.DEPTH_WRITEMASK:
              return gl.depthMask(sv as boolean);
            case gl.ELEMENT_ARRAY_BUFFER_BINDING:
              return gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sv as WebGLBuffer);
            case gl.FRAMEBUFFER_BINDING:
              return gl.bindFramebuffer(gl.FRAMEBUFFER, sv as WebGLFramebuffer);
            case gl.FRONT_FACE:
              return gl.frontFace(sv as number);
            case gl.LINE_WIDTH:
              return gl.lineWidth(sv as number);
            case gl.RENDERBUFFER_BINDING:
              return gl.bindRenderbuffer(gl.RENDERBUFFER, sv as WebGLRenderbuffer);
            case gl.SCISSOR_BOX:
              // @ts-ignore
              return gl.scissor(...sv);
            case gl.STENCIL_WRITEMASK:
              return gl.stencilMaskSeparate(gl.FRONT, sv as number);
            case gl.STENCIL_BACK_WRITEMASK:
              return gl.stencilMaskSeparate(gl.BACK, sv as number);
            case gl.STENCIL_CLEAR_VALUE:
              return gl.clearStencil(sv as number);
            case gl.VIEWPORT:
              // @ts-ignore
              return gl.viewport(...sv);

            //Pixel storage
            case gl.PACK_ALIGNMENT:
            case gl.UNPACK_ALIGNMENT:
            case gl.UNPACK_COLORSPACE_CONVERSION_WEBGL:
            case gl.UNPACK_FLIP_Y_WEBGL:
            case gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
              return gl.pixelStorei(type, sv as any);

            //Flags
            case gl.BLEND:
            case gl.CULL_FACE:
            case gl.DEPTH_TEST:
            case gl.DITHER:
            case gl.POLYGON_OFFSET_FILL:
            case gl.SAMPLE_COVERAGE:
            case gl.SCISSOR_TEST:
            case gl.STENCIL_TEST:
              return sv ? gl.enable(type) : gl.disable(type);

            // Hints
            case gl.GENERATE_MIPMAP_HINT:
              return gl.hint(type, sv as number);

            default:
            // do nothing
          }
        });

      Object.entries(specialVars)
        .filter(([k, s]) => s.present)
        .forEach(([k, s]) => {
          var parts = k.split('_');
          if (parts.length === 1) {
            gl[parts[0]](...s.values);
          } else {
            gl[parts[0]](gl[parts[1]], ...s.values);
          }
        });
    },
  };
}
