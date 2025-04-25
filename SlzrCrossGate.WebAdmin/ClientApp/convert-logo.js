const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function convertSvgToPng() {
  try {
    // 创建一个 192x192 的画布
    const canvas = createCanvas(192, 192);
    const ctx = canvas.getContext('2d');
    
    // 设置背景色为紫色（与SVG中的渐变色相似）
    ctx.fillStyle = '#7E22CE';
    ctx.fillRect(0, 0, 192, 192);
    
    // 绘制圆形
    ctx.beginPath();
    ctx.arc(96, 96, 88, 0, Math.PI * 2);
    ctx.fillStyle = '#7E22CE';
    ctx.fill();
    
    // 绘制显示器外框
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(40, 50, 112, 80, 6);
    ctx.stroke();
    
    // 绘制显示器底座
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(86, 130);
    ctx.lineTo(106, 130);
    ctx.lineTo(110, 142);
    ctx.lineTo(82, 142);
    ctx.closePath();
    ctx.fill();
    
    // 绘制终端符号
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 绘制 > 符号
    ctx.beginPath();
    ctx.moveTo(60, 70);
    ctx.lineTo(80, 90);
    ctx.lineTo(60, 110);
    ctx.stroke();
    
    // 绘制 _ 符号
    ctx.beginPath();
    ctx.moveTo(90, 110);
    ctx.lineTo(120, 110);
    ctx.stroke();
    
    // 将画布内容保存为 PNG 文件
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./public/logo192.png', buffer);
    console.log('成功创建 logo192.png');
  } catch (error) {
    console.error('转换失败:', error);
  }
}

// 创建简单的纯色 logo
function createSimpleLogo() {
  try {
    // 创建一个 192x192 的画布
    const canvas = createCanvas(192, 192);
    const ctx = canvas.getContext('2d');
    
    // 设置背景色为紫色
    ctx.fillStyle = '#7E22CE';
    ctx.fillRect(0, 0, 192, 192);
    
    // 绘制简单的终端符号
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 绘制显示器外框
    ctx.beginPath();
    ctx.roundRect(40, 50, 112, 80, 10);
    ctx.stroke();
    
    // 绘制 > 符号
    ctx.beginPath();
    ctx.moveTo(60, 70);
    ctx.lineTo(80, 90);
    ctx.lineTo(60, 110);
    ctx.stroke();
    
    // 绘制 _ 符号
    ctx.beginPath();
    ctx.moveTo(90, 110);
    ctx.lineTo(120, 110);
    ctx.stroke();
    
    // 将画布内容保存为 PNG 文件
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./public/logo192.png', buffer);
    console.log('成功创建 logo192.png');
  } catch (error) {
    console.error('创建失败:', error);
  }
}

// 执行创建简单 logo 的函数
createSimpleLogo();
