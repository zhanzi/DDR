const fs = require('fs');
const path = require('path');

// 处理CSS中的@import指令，内联所有导入的CSS
function processImports(css, basePath) {
  // 匹配@import语句
  const importRegex = /@import\s+['"](.+?)['"];/g;
  let match;
  let processedCss = css;
  
  // 处理所有的@import
  while ((match = importRegex.exec(css)) !== null) {
    const importPath = match[1];
    const fullPath = path.resolve(basePath, importPath);
    
    try {
      // 读取导入的CSS文件
      const importedCss = fs.readFileSync(fullPath, 'utf8');
      // 递归处理导入的CSS中的@import
      const processedImport = processImports(importedCss, path.dirname(fullPath));
      // 替换@import语句为实际内容
      processedCss = processedCss.replace(match[0], processedImport);
    } catch (error) {
      console.error(`处理导入文件 ${importPath} 失败: ${error.message}`);
    }
  }
  
  return processedCss;
}

// 插件，将CSS文件合并并复制到dist目录
function copyCssPlugin() {
  return {
    name: 'copy-css',
    writeBundle() {
      const srcPath = path.resolve(__dirname, 'src/styles/index.css');
      const srcDir = path.dirname(srcPath);
      const destPath = path.resolve(__dirname, 'dist/ddr-core.css');
      
      try {
        const css = fs.readFileSync(srcPath, 'utf8');
        // 处理所有@import指令
        const processedCss = processImports(css, srcDir);
        fs.writeFileSync(destPath, processedCss);
        console.log('\x1b[32m%s\x1b[0m', '✓ CSS文件已处理并复制到: ' + destPath);
      } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '✗ 处理CSS文件失败: ' + error.message);
      }
    }
  };
}

// 导出插件 - 同时支持ES模块和CommonJS
module.exports = { copyCssPlugin };
// 为了兼容ES模块导入
module.exports.copyCssPlugin = copyCssPlugin;
