#!/bin/bash
# 构建DDR库和处理CSS
echo "开始构建DDR库..."
npm run build

# 检查构建是否成功
if [ $? -eq 0 ]; then
  echo "构建成功，检查CSS合并结果..."
  
  # 检查dist/ddr-core.css文件是否存在
  if [ -f "dist/ddr-core.css" ]; then
    # 检查是否存在@import语句
    if grep -q "@import" "dist/ddr-core.css"; then
      echo "警告：CSS文件中仍然存在@import语句，可能需要检查构建过程"
    else
      echo "CSS文件已成功合并，不包含@import语句"
      echo "构建和CSS处理完成！"
    fi
  else
    echo "错误：找不到dist/ddr-core.css文件，请检查构建过程"
  fi
else
  echo "构建失败，请查看上述错误信息"
fi
