@echo off
echo 开始构建DDR库...
call npm run build

REM 检查构建是否成功
if %errorlevel% neq 0 (
  echo 构建失败，请查看上述错误信息
  exit /b %errorlevel%
)

echo 构建成功，检查CSS合并结果...

REM 检查dist/ddr-core.css文件是否存在
if not exist "dist\ddr-core.css" (
  echo 错误：找不到dist/ddr-core.css文件，请检查构建过程
  exit /b 1
)

REM 检查是否存在@import语句
findstr "@import" "dist\ddr-core.css" >nul
if %errorlevel% equ 0 (
  echo 警告：CSS文件中仍然存在@import语句，可能需要检查构建过程
) else (
  echo CSS文件已成功合并，不包含@import语句
  echo 构建和CSS处理完成！
)
