import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';
// 使用CommonJS的方式导入
const { copyCssPlugin } = require('./rollup.config.css.js');

const extensions = ['.js', '.ts'];
const input = 'src/index.ts';

// 外部依赖，不打包进库中
const external = [
  // 排除xlsx-js-style，让它被打包进组件中
  ...Object.keys(pkg.dependencies || {}).filter(dep => dep !== 'xlsx-js-style'),
  ...Object.keys(pkg.peerDependencies || {})
];

// 浏览器构建时，将所有依赖都打包进去
const browserExternal = [
  ...Object.keys(pkg.peerDependencies || {})
];

export default [
  // CommonJS构建，用于Node.js和传统打包工具
  {
    input,
    inlineDynamicImports: true,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },    plugins: [
      nodeResolve({
        extensions,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: true
      }),
      babel({
        babelHelpers: 'bundled',
        extensions,
        exclude: 'node_modules/**'
      }),
      // 确保在CommonJS构建时也处理CSS
      copyCssPlugin(),
      terser()
    ],
    external
  },
  // IIFE构建，可直接在浏览器中使用
  {
    input: 'src/browser-entry.ts',
    inlineDynamicImports: true,
    output: {
      file: 'dist/ddr-core.browser.js',
      format: 'iife',
      name: 'DDR',
      sourcemap: true,
      exports: 'default',
      // 确保导出DDR的同时也导出DDR.create方法
      extend: true
    },
    plugins: [
      nodeResolve({
        extensions,
        // 确保能够解析node_modules中的依赖
        preferBuiltins: false,
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        // 确保类型检查不会影响构建
        noEmitOnError: false
      }),
      babel({
        babelHelpers: 'bundled',
        extensions,
        exclude: 'node_modules/**'
      }),
      // 添加CSS处理插件
      copyCssPlugin()
      // 暂时移除terser，先确保输出格式正确
    ],
    // 浏览器构建只排除peerDependencies
    external: browserExternal
  },  // ES模块构建，用于现代打包工具
  {
    input,
    inlineDynamicImports: true,
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve({ extensions }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      babel({
        babelHelpers: 'bundled',
        extensions,
        exclude: 'node_modules/**'
      }),
      // 确保ES模块构建也处理CSS
      copyCssPlugin()
    ],
    external
  },  // 类型定义
  {
    input,
    output: {
      file: pkg.types,
      format: 'es'
    },
    plugins: [dts({
      // 允许在生成类型文件时不生成完整的错误报告
      compilerOptions: {
        skipLibCheck: true
      }
    })]
  },
  // React适配器构建
  {
    input: 'src/adapters/react.ts',
    inlineDynamicImports: true,
    output: {
      file: 'dist/ddr-react.js',
      format: 'es',
      sourcemap: true,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      }
    },    plugins: [
      nodeResolve({ extensions }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      babel({
        babelHelpers: 'bundled',
        extensions,
        exclude: 'node_modules/**'
      }),
      // 确保React适配器构建也处理CSS
      copyCssPlugin()
    ],
    external: [...external, 'react', 'react-dom']
  },  // Vue适配器构建
  {
    input: 'src/adapters/vue.ts',
    inlineDynamicImports: true,
    output: {
      file: 'dist/ddr-vue.js',
      format: 'es',
      sourcemap: true,
      globals: {
        vue: 'Vue'
      }
    },
    plugins: [
      nodeResolve({ extensions }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      babel({
        babelHelpers: 'bundled',
        extensions,
        exclude: 'node_modules/**'
      }),
      // 添加CSS处理插件，确保在Vue构建时也处理CSS
      copyCssPlugin()
    ],
    external: [...external, 'vue']
  }
];
