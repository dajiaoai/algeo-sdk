import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/algeo-sdk.esm.js', format: 'esm' },
    { file: 'dist/algeo-sdk.cjs.js', format: 'cjs' },
    { file: 'dist/algeo-sdk.umd.js', format: 'umd', name: 'AlgeoSdk' },
  ],
  plugins: [typescript({ declaration: true, declarationDir: 'dist' })],
};
