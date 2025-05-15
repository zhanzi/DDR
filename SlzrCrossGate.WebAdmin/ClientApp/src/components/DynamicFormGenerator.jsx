import React from 'react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  Slider,
  Radio,
  RadioGroup,
  Divider,
  InputAdornment,
  IconButton,
  Paper,
  Grid,
  Chip,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';  
/**
 * 动态表单生成器组件
 * 
 * 根据字典配置生成表单控件
 * @param {Object} props - 组件属性
 * @param {Array} props.configs - 控件配置数组
 * @param {Object} props.values - 表单值对象
 * @param {Function} props.onChange - 值变更处理函数
 * @param {Boolean} props.disabled - 是否禁用表单
 */
const DynamicFormGenerator = ({ configs, values, onChange, disabled = false }) => {
  // 根据控件类型生成对应的表单控件
  const renderControl = (config) => {
    const { dictionaryCode, dictionaryLabel, controlType, controlConfig } = config;
    const value = values?.[dictionaryCode] ?? config.dictionaryValue ?? '';
    
    // 处理控件配置
    const configOptions = controlConfig ? (
      typeof controlConfig === 'string' 
        ? JSON.parse(controlConfig)
        : controlConfig
    ) : {};
      // 处理表单值变更
    const handleChange = (event) => {
      // 根据不同控件类型处理不同的事件值
      let newValue;
      
      if (controlType === 'switch') {
        const checked = event.target.checked;
        // 处理自定义switch值
        if (configOptions.onValue !== undefined && configOptions.offValue !== undefined) {
          newValue = checked ? configOptions.onValue : configOptions.offValue;
        } else {
          newValue = checked;
        }
      } else if (controlType === 'slider') {
        newValue = event;
      } else {
        newValue = event.target.value;
      }
      
      onChange(dictionaryCode, newValue);
    };

    // 根据控件类型渲染不同的表单控件
    switch (controlType?.toLowerCase()) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={dictionaryLabel}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            margin="normal"
            size="medium"
            {...configOptions}
          />
        );
        
      case 'number':
        return (
          <TextField
            fullWidth
            label={dictionaryLabel}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            margin="normal"
            size="medium"
            type="number"
            InputProps={{
              inputProps: {
                min: configOptions.min,
                max: configOptions.max,
                step: configOptions.step || 1
              }
            }}
            {...configOptions}
          />
        );
        
      case 'select':
        return (
          <FormControl fullWidth margin="normal" disabled={disabled}>
            <InputLabel>{dictionaryLabel}</InputLabel>
            <Select
              value={value || ''}
              onChange={handleChange}
              label={dictionaryLabel}
              size="medium"
            >
              {configOptions.options?.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {configOptions.helperText && (
              <FormHelperText>{configOptions.helperText}</FormHelperText>
            )}
          </FormControl>
        );
          case 'switch':
        // 确定当前的选中状态
        let isChecked;
        if (configOptions.onValue !== undefined && configOptions.offValue !== undefined) {
          // 使用自定义值时，判断当前值是否等于开启值
          isChecked = value === configOptions.onValue;
        } else {
          // 默认情况下使用布尔转换
          isChecked = Boolean(value);
        }

        return (
          <Box sx={{ my: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isChecked}
                  onChange={handleChange}
                  disabled={disabled}
                  color="primary"
                />
              }
              label={dictionaryLabel}
            />
            {configOptions.helperText && (
              <FormHelperText>{configOptions.helperText}</FormHelperText>
            )}
          </Box>
        );
        
      case 'slider':
        return (
          <Box sx={{ my: 3, px: 1 }}>
            <Typography id={`slider-${dictionaryCode}-label`} gutterBottom>
              {dictionaryLabel}
            </Typography>
            <Slider
              value={Number(value) || 0}
              onChange={(e, newValue) => handleChange(newValue)}
              disabled={disabled}
              aria-labelledby={`slider-${dictionaryCode}-label`}
              valueLabelDisplay="auto"
              min={configOptions.min || 0}
              max={configOptions.max || 100}
              step={configOptions.step || 1}
            />
            {configOptions.helperText && (
              <FormHelperText>{configOptions.helperText}</FormHelperText>
            )}
          </Box>
        );
        
      case 'radio':
        return (
          <FormControl component="fieldset" margin="normal" disabled={disabled}>
            <Typography variant="body2">{dictionaryLabel}</Typography>
            <RadioGroup
              row={configOptions.row || false}
              value={value || ''}
              onChange={handleChange}
              name={dictionaryCode}
            >
              {configOptions.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            {configOptions.helperText && (
              <FormHelperText>{configOptions.helperText}</FormHelperText>
            )}
          </FormControl>
        );
        
      case 'tag-input':
      case 'tag': // 支持两种命名方式
        const [inputValue, setInputValue] = useState('');
        const tags = Array.isArray(value) ? value : (value ? value.split(configOptions.separator || ',') : []);
        
        const handleTagDelete = (tagToDelete) => {
          const newTags = tags.filter(tag => tag !== tagToDelete);
          onChange(dictionaryCode, configOptions.separator 
            ? newTags.join(configOptions.separator) 
            : newTags);
        };

        const handleTagAdd = () => {
          if (!inputValue.trim()) return;
          
          // 验证输入
          if (configOptions.validation?.pattern) {
            const pattern = new RegExp(configOptions.validation.pattern);
            if (!pattern.test(inputValue)) {
              // 如果有错误处理函数，可以在这里调用
              return;
            }
          }
          
          // 检查最大标签数量
          if (configOptions.validation?.maxCount && tags.length >= configOptions.validation.maxCount) {
            return;
          }
          
          // 检查是否已存在
          if (!tags.includes(inputValue)) {
            const newTags = [...tags, inputValue];
            onChange(dictionaryCode, configOptions.separator 
              ? newTags.join(configOptions.separator) 
              : newTags);
          }
          
          setInputValue('');
        };

        const handleKeyDown = (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleTagAdd();
          }
        };

        return (
          <Box sx={{ my: 2 }}>
            <Typography gutterBottom>{dictionaryLabel}</Typography>
            <TextField
              fullWidth
              size="medium"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={configOptions.placeholder || '输入后按回车添加'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      edge="end" 
                      onClick={handleTagAdd}
                      disabled={disabled || !inputValue.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={disabled ? undefined : () => handleTagDelete(tag)}
                  color="primary"
                  variant="outlined"
                  size="medium"
                />
              ))}
            </Stack>
            
            {configOptions.helperText && (
              <FormHelperText>
                {configOptions.helperText}
                {configOptions.validation?.maxCount && (
                  ` (${tags.length}/${configOptions.validation.maxCount})`
                )}
              </FormHelperText>
            )}
          </Box>
        );



      case 'divider':
        return (
          <Box sx={{ my: 2 }}>
            {dictionaryLabel && (
              <Typography variant="subtitle1" gutterBottom>
                {dictionaryLabel}
              </Typography>
            )}
            <Divider />
          </Box>
        );
        
      case 'section':
        return (
          <Paper sx={{ p: 2, my: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              {dictionaryLabel}
            </Typography>
            {configOptions.description && (
              <Typography variant="body2" color="textSecondary" paragraph>
                {configOptions.description}
              </Typography>
            )}
          </Paper>
        );
        
      default:
        return (
          <Typography color="error">
            未知控件类型: {controlType}
          </Typography>
        );
    }
  };

  // 分组处理配置
  const groupConfigsBySection = () => {
    const sections = {};
    let defaultSection = [];
    
    configs.forEach(config => {
      if (config.controlType?.toLowerCase() === 'section') {
        // 创建新分组
        sections[config.dictionaryCode] = {
          title: config.dictionaryLabel,
          description: config.controlConfig?.description,
          items: []
        };
      } else if (Object.keys(sections).length > 0) {
        // 将控件添加到最后一个分组
        const lastSectionKey = Object.keys(sections).pop();
        sections[lastSectionKey].items.push(config);
      } else {
        // 添加到默认分组
        defaultSection.push(config);
      }
    });
    
    return { sections, defaultSection };
  };
  
  // 获取分组后的配置
  const { sections, defaultSection } = groupConfigsBySection();
  
  return (
    <Box sx={{ my: 2 }}>
      {/* 渲染默认分组中的控件 */}
      {defaultSection.map((config) => (
        <Box key={config.dictionaryCode}>
          {renderControl(config)}
        </Box>
      ))}
      
      {/* 渲染其他分组的控件 */}
      {Object.entries(sections).map(([sectionKey, section]) => (
        <Paper key={sectionKey} sx={{ p: 2, my: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            {section.title}
          </Typography>
          {section.description && (
            <Typography variant="body2" color="textSecondary" paragraph>
              {section.description}
            </Typography>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ mt: 2 }}>
            {section.items.map((config) => (
              <Box key={config.dictionaryCode}>
                {renderControl(config)}
              </Box>
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

DynamicFormGenerator.propTypes = {
  configs: PropTypes.arrayOf(PropTypes.shape({
    dictionaryCode: PropTypes.string.isRequired,
    dictionaryLabel: PropTypes.string,
    dictionaryValue: PropTypes.any,
    controlType: PropTypes.string,
    controlConfig: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  })).isRequired,
  values: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default DynamicFormGenerator;
