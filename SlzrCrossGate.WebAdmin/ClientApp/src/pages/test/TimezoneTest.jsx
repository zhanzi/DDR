import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { formatDateTime, formatDate, formatTime, formatRelativeTime, isWithinMinutes, formatDateForAPI, getTimezoneInfo } from '../../utils/dateUtils';

const TimezoneTest = () => {
  // 测试数据 - 模拟从后端获取的时间字符串
  const testDates = [
    '2025-06-12T07:07:28.255875', // 您提到的示例时间
    '2024-12-19T10:30:00.000Z',   // UTC时间
    '2024-12-19T02:30:00.000Z',   // UTC凌晨时间
    new Date().toISOString(),      // 当前时间
    new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2分钟前
    new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10分钟前
  ];

  const timezoneInfo = getTimezoneInfo();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        时区转换测试页面
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        此页面用于测试时间显示的时区转换功能。所有时间都会自动转换为您的本地时区显示。
      </Typography>

      {/* 时区信息 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          当前时区信息
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">时区偏移</Typography>
            <Typography variant="h6">UTC{timezoneInfo.offsetString}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">时区名称</Typography>
            <Typography variant="h6">{timezoneInfo.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">偏移小时数</Typography>
            <Typography variant="h6">{timezoneInfo.offset} 小时</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 时间转换测试 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          时间转换测试
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          以下展示了不同格式的时间转换结果：
        </Typography>

        {testDates.map((dateStr, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                测试时间 #{index + 1}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">原始时间字符串：</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {dateStr}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">完整日期时间：</Typography>
                  <Typography variant="body1">{formatDateTime(dateStr)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">仅日期：</Typography>
                  <Typography variant="body1">{formatDate(dateStr)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">仅时间：</Typography>
                  <Typography variant="body1">{formatTime(dateStr)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">相对时间：</Typography>
                  <Typography variant="body1">{formatRelativeTime(dateStr)}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">是否在5分钟内：</Typography>
                  <Typography variant="body1" color={isWithinMinutes(dateStr, 5) ? 'success.main' : 'error.main'}>
                    {isWithinMinutes(dateStr, 5) ? '是' : '否'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">JavaScript Date对象：</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
                    {new Date(dateStr).toString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>API查询格式（解决时区问题）：</strong>
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">开始时间（当天00:00:00）：</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {formatDateForAPI(dateStr, true) || '无效日期'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">结束时间（当天23:59:59）：</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {formatDateForAPI(dateStr, false) || '无效日期'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Paper>

      {/* 使用说明 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          使用说明
        </Typography>
        <Typography variant="body2" paragraph>
          1. <strong>formatDateTime(dateInput)</strong>: 格式化为 'yyyy-MM-dd HH:mm:ss' 格式，自动转换为本地时区
        </Typography>
        <Typography variant="body2" paragraph>
          2. <strong>formatDate(dateInput)</strong>: 仅显示日期部分 'yyyy-MM-dd'
        </Typography>
        <Typography variant="body2" paragraph>
          3. <strong>formatTime(dateInput)</strong>: 仅显示时间部分 'HH:mm:ss'
        </Typography>
        <Typography variant="body2" paragraph>
          4. <strong>formatRelativeTime(dateInput)</strong>: 显示相对时间，如 "2小时前"、"3天前"
        </Typography>
        <Typography variant="body2" paragraph>
          5. <strong>isWithinMinutes(dateInput, minutes)</strong>: 判断时间是否在指定分钟内，常用于在线状态判断
        </Typography>
        <Typography variant="body2" paragraph>
          6. <strong>formatDateForAPI(dateInput, isStartOfDay)</strong>: 将本地日期转换为UTC格式供API查询使用，解决时区问题
        </Typography>
        <Typography variant="body2">
          7. <strong>getTimezoneInfo()</strong>: 获取当前浏览器的时区信息
        </Typography>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          时区问题解决方案
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>问题：</strong>用户在+8时区选择日期"2025-01-01"进行查询时，如果直接传递给后端，可能被误解为UTC时间，导致查询范围错误。
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>解决：</strong>使用 <code>formatDateForAPI()</code> 函数：
        </Typography>
        <Typography variant="body2" paragraph>
          • 开始日期：转换为本地时间 2025-01-01 00:00:00 对应的UTC时间
        </Typography>
        <Typography variant="body2" paragraph>
          • 结束日期：转换为本地时间 2025-01-01 23:59:59 对应的UTC时间
        </Typography>
        <Typography variant="body2">
          这样确保查询的是用户期望的本地时间范围内的数据。
        </Typography>
      </Paper>
    </Box>
  );
};

export default TimezoneTest;
