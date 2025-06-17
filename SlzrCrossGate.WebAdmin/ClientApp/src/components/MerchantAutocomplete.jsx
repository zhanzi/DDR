import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { merchantAPI } from '../services/api';

/**
 * 商户自动完成下拉框组件
 *
 * @param {Object} props
 * @param {Object|null} props.value - 当前选中的商户对象
 * @param {Function} props.onChange - 选中值变更时的回调函数 (event, newValue) => void
 * @param {Array} [props.merchants] - 可选，预加载的商户列表数据
 * @param {string} [props.label="商户"] - 输入框标签
 * @param {string} [props.placeholder="输入商户ID或名称筛选"] - 占位符文本
 * @param {string} [props.size="small"] - 输入框大小，可选值: "small", "medium"
 * @param {boolean} [props.disabled=false] - 是否禁用
 * @param {boolean} [props.required=false] - 是否必填
 * @param {boolean} [props.error=false] - 是否显示错误状态
 * @param {string} [props.helperText=""] - 辅助文本/错误提示
 * @param {Object} [props.sx={}] - MUI sx 样式属性
 * @returns {JSX.Element}
 */
const MerchantAutocomplete = ({
  value,
  onChange,
  merchants: externalMerchants,
  label = "商户",
  placeholder = "输入商户ID或名称筛选",
  size = "small",
  disabled = false,
  required = false,
  error = false,
  helperText = "",
  sx = {},
  ...props
}) => {
  // 如果外部提供了商户列表，则使用外部数据，否则组件内部加载
  const [merchants, setMerchants] = useState(externalMerchants || []);
  const [loading, setLoading] = useState(!externalMerchants);

  // 只有当没有提供外部数据源时，组件内部才会加载商户列表
  useEffect(() => {
    if (externalMerchants) {
      setMerchants(externalMerchants);
      return;
    }

    const loadMerchants = async () => {
      try {
        setLoading(true);
        // 获取足够多的商户数据，避免分页限制
        const response = await merchantAPI.getMerchants({ pageSize: 100 });
        setMerchants(response.items || []);
      } catch (error) {
        console.error('Error loading merchants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMerchants();
  }, [externalMerchants]);

  // 当外部数据源更新时，更新内部状态
  useEffect(() => {
    if (externalMerchants) {
      setMerchants(externalMerchants);
    }
  }, [externalMerchants]);

  // 商户展示格式，显示为"ID - 名称"
  const getOptionLabel = (option) => {
    if (!option) return '';
    return `${option.merchantID} - ${option.name || ''}`;
  };

  // 处理自动完成选择变更事件
  const handleAutocompleteChange = (event, newValue) => {
    if (onChange) {
      onChange(event, newValue);
    }
  };

  return (
    <Autocomplete
      options={merchants}
      getOptionLabel={getOptionLabel}
      value={value}
      onChange={handleAutocompleteChange}
      loading={loading}
      disabled={disabled}
      isOptionEqualToValue={(option, value) => {
        if (!option || !value) return false;
        return option.merchantID === value.merchantID;
      }}
      ListboxProps={{
        style: {
          maxHeight: 300, // 设置下拉选项列表最大高度
          overflowY: 'auto', // 启用垂直滚动条
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size={size}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      sx={sx}
      {...props}
    />
  );
};

export default MerchantAutocomplete;