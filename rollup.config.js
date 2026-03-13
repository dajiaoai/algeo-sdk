import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/algeo-sdk.esm.js', format: 'esm' },
    { file: 'dist/algeo-sdk.cjs.js', format: 'cjs' },
    { file: 'dist/algeo-sdk.umd.js', format: 'umd', name: 'AlgeoSdk' },
  ],
  plugins: [
    nodeResolve(),
    replace({
      __ALGEO_SDK_VERSION__: pkg.version,
      preventAssignment: true,
    }),
    typescript({ declaration: true, declarationDir: 'dist' }),
  ],
};
