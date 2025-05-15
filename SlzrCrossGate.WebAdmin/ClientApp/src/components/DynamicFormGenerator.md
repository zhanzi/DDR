# DynamicFormGenerator 组件使用指南

`DynamicFormGenerator` 是一个灵活的动态表单生成器组件，可以根据配置数组生成各种表单控件。下面详细介绍各种控件类型的使用方法和配置选项。

## 基本用法

```jsx
<DynamicFormGenerator 
  configs={configArray}  // 控件配置数组
  values={formValues}    // 表单值对象
  onChange={handleFieldChange}  // 值变更处理函数
  disabled={false}  // 是否禁用所有控件
/>
```

## 公共配置属性

所有控件类型都支持以下基本配置：

```json
{
  "dictionaryCode": "字段名",  // 必填，用于标识控件和存储值的键
  "dictionaryLabel": "显示名称",  // 控件标签文本
  "dictionaryValue": "默认值",  // 可选，控件的默认值
  "controlType": "控件类型",  // 必填，指定要渲染的控件类型
  "controlConfig": {}  // 可选，控件特定的配置项
}
```

## 各控件类型用法及配置

### 1. 文本输入框 (text)

```json
{
  "dictionaryCode": "lineName",
  "dictionaryLabel": "线路名称",
  "controlType": "text",
  "controlConfig": {
    "placeholder": "请输入线路名称",
    "helperText": "输入线路的完整名称",
    "required": true,
    "variant": "outlined",
    "maxLength": 50
  }
}
```

**可用配置项**：
- `placeholder`: 占位符文本
- `helperText`: 帮助文本
- `required`: 是否必填
- `variant`: 变体样式 ("outlined", "filled", "standard")
- `maxLength`, `minLength`: 最大/最小长度
- 其他 Material-UI TextField 支持的属性

### 2. 数字输入框 (number)

```json
{
  "dictionaryCode": "fare",
  "dictionaryLabel": "票价",
  "controlType": "number",
  "controlConfig": {
    "min": 0,
    "max": 100,
    "step": 0.5,
    "helperText": "单位：元"
  }
}
```

**可用配置项**：
- `min`: 最小值
- `max`: 最大值
- `step`: 步进值
- `helperText`: 帮助文本
- 其他 Material-UI TextField 支持的属性

### 3. 下拉选择框 (select)

```json
{
  "dictionaryCode": "transferType",
  "dictionaryLabel": "换乘类型",
  "controlType": "select",
  "controlConfig": {
    "options": [
      { "value": "0", "label": "不支持换乘" },
      { "value": "1", "label": "支持换乘" }
    ],
    "helperText": "请选择是否支持换乘"
  }
}
```

**可用配置项**：
- `options`: 选项数组，每个选项包含 `value` 和 `label`
- `helperText`: 帮助文本

### 4. 开关控件 (switch)

```json
{
  "dictionaryCode": "isTransfer",
  "dictionaryLabel": "是否支持换乘",
  "controlType": "switch",
  "dictionaryValue": true,  // 设置默认值为开启状态
  "controlConfig": {
      "onValue": 1,        // 开启时的值，可选。默认为 true
      "offValue": 0,        // 关闭时的值，可选。默认为 false
      "helperText": "0表示禁用，1表示启用"  // 可选的说明文本
  }
}
```

**可用配置项**：
- `dictionaryValue`: 设置默认值，`true` 表示开启，`false` 表示关闭

**注意**：switch 控件的值在内部会被转换为布尔值，所以当您需要指定值时，请使用 `true` 或 `false`。

### 5. 滑块控件 (slider)

```json
{
  "dictionaryCode": "cardDiscount",
  "dictionaryLabel": "卡类折扣",
  "controlType": "slider",
  "dictionaryValue": 90,
  "controlConfig": {
    "min": 0,
    "max": 100,
    "step": 10,
    "helperText": "0表示免费，100表示全价"
  }
}
```

**可用配置项**：
- `min`: 最小值
- `max`: 最大值
- `step`: 步进值
- `helperText`: 帮助文本

### 6. 单选框组 (radio)

```json
{
  "dictionaryCode": "isTransferType",
  "dictionaryLabel": "换乘优惠类型",
  "controlType": "radio",
  "controlConfig": {
    "row": true,  // 水平排列
    "options": [
      { "value": "0", "label": "不允许换乘优惠" },
      { "value": "1", "label": "仅允许差额换乘优惠" },
      { "value": "2", "label": "仅允许定额换乘优惠" },
      { "value": "3", "label": "允许所有换乘优惠" }
    ],
    "helperText": "选择该卡类型的换乘优惠方式"
  }
}
```

**可用配置项**：
- `row`: 设置为 `true` 时水平排列，默认垂直排列
- `options`: 选项数组，每个选项包含 `value` 和 `label`
- `helperText`: 帮助文本

### 7. 标签输入框 (tag-input 或 tag)

```json
{
  "dictionaryCode": "interGroupTransferRules",
  "dictionaryLabel": "组间换乘规则",
  "controlType": "tag-input",
  "controlConfig": {
    "validation": {
      "pattern": "^\\d{4}$",  // 正则表达式验证
      "maxCount": 20  // 最多添加的标签数量
    },
    "separator": ",",  // 分隔符，用于将标签数组存储为字符串
    "placeholder": "请输入4位数字后按回车",
    "helperText": "格式：前两位为起始组号，后两位为目标组号"
  }
}
```

**可用配置项**：
- `validation.pattern`: 正则表达式字符串，用于验证标签输入
- `validation.maxCount`: 最大标签数量
- `separator`: 分隔符，用于将标签数组转换为字符串存储（如果不指定，则存储为数组）
- `placeholder`: 占位符文本
- `helperText`: 帮助文本

### 8. 分隔线 (divider)

```json
{
  "dictionaryCode": "section1Divider",
  "dictionaryLabel": "基本信息",  // 可选，显示在分隔线上方
  "controlType": "divider"
}
```

**可用配置项**：
- `dictionaryLabel`: 分隔线上方的标题文本（可选）

### 9. 分组标题 (section)

```json
{
  "dictionaryCode": "basicInfoSection",
  "dictionaryLabel": "基本信息",
  "controlType": "section",
  "controlConfig": {
    "description": "请填写线路票价的基本信息"  // 可选，说明文本
  }
}
```

**可用配置项**：
- `description`: 分组描述文本

## 配置高级组合示例

以下是一个完整的表单配置示例，展示如何组合使用不同控件：

```jsx
const configs = [
  {
    dictionaryCode: "basicInfoSection",
    dictionaryLabel: "基本信息",
    controlType: "section",
    controlConfig: {
      description: "请填写线路票价的基本信息"
    }
  },
  {
    dictionaryCode: "lineNumber",
    dictionaryLabel: "线路号",
    controlType: "text",
    controlConfig: {
      required: true,
      pattern: "^\\d{4}$",
      helperText: "请输入4位数字的线路号"
    }
  },
  {
    dictionaryCode: "groupNumber",
    dictionaryLabel: "组号",
    controlType: "text",
    controlConfig: {
      required: true,
      pattern: "^\\d{2}$",
      helperText: "请输入2位数字的组号"
    }
  },
  {
    dictionaryCode: "fare",
    dictionaryLabel: "票价",
    controlType: "number",
    controlConfig: {
      min: 0,
      step: 0.1,
      helperText: "单位：元"
    }
  },
  {
    dictionaryCode: "transferSection",
    dictionaryLabel: "换乘设置",
    controlType: "section"
  },
  {
    dictionaryCode: "enableStatus",
    dictionaryLabel: "启用状态",
    controlType: "switch",
    dictionaryValue: 0,  // 默认值为关闭状态
    controlConfig: {
        onValue: 1,        // 开启时的值
        offValue: 0,        // 关闭时的值
        helperText: "0表示禁用，1表示启用"  // 可选的说明文本
    }
  },
  {
    dictionaryCode: "supportTransfer",
    dictionaryLabel: "是否支持换乘",
    controlType: "switch",
    dictionaryValue: true,  // 默认值为开启状态
    controlConfig: {
      onValue: 1,
      offValue: 0,
      helperText: "启用后支持换乘"
    }
  },
  {
    dictionaryCode: "diffTransferTime",
    dictionaryLabel: "差额换乘时间",
    controlType: "number",
    dictionaryValue: 90,
    controlConfig: {
      min: 0,
      max: 1440,
      helperText: "单位：分钟，最大24小时"
    }
  },
  {
    dictionaryCode: "fixedTransferTime",
    dictionaryLabel: "定额换乘时间",
    controlType: "number",
    dictionaryValue: 60,
    controlConfig: {
      min: 0,
      max: 1440,
      helperText: "单位：分钟，最大24小时"
    }
  },
  {
    dictionaryCode: "interGroupTransferRules",
    dictionaryLabel: "组间换乘规则",
    controlType: "tag-input",
    controlConfig: {
      validation: {
        pattern: "^\\d{4}$",
        maxCount: 20
      },
      separator: ",",
      placeholder: "请输入4位数字后按回车",
      helperText: "格式：前两位为起始组号，后两位为目标组号"
    }
  }
];

// 使用示例
const [formValues, setFormValues] = useState({
  lineNumber: "0001",
  groupNumber: "01",
  fare: 2.5,
  supportTransfer: true,
  diffTransferTime: 90,
  fixedTransferTime: 60,
  interGroupTransferRules: "0102,0103,0201"
});

const handleFieldChange = (field, value) => {
  setFormValues(prev => ({
    ...prev,
    [field]: value
  }));
};

return (
  <DynamicFormGenerator
    configs={configs}
    values={formValues}
    onChange={handleFieldChange}
  />
);
```

## 特别说明

1. **Switch 控件的值处理**：
   - 设置初始值：`dictionaryValue: true` 或 `dictionaryValue: false`
   - 在 `values` 对象中设置：`{ supportTransfer: true }`
   - 该控件的值会自动转换为布尔值，存储 `true` 或 `false`
   
2. **Tag 输入控件的值处理**：
   - 如果设置了 `separator`，值将以字符串形式存储（如 `"0102,0103"`）
   - 如果未设置 `separator`，值将以数组形式存储（如 `["0102", "0103"]`）

3. **Section 分组效果**：
   - Section 类型控件会创建一个新的分组
   - 分组后的控件会显示在一个带有标题的卡片内
   - 分组内的控件会自动添加一定的间距和分隔线

4. **动态控件的默认值**：
   - 可以通过 `dictionaryValue` 属性设置控件的默认值
   - 也可以在 `values` 对象中提供初始值

这些控件可以根据实际需求灵活组合，创建各种复杂的表单布局和交互效果。所有控件都会自动适应表单的禁用状态，并提供一致的用户体验。

## 常见问题与解决方案

### 1. 默认值未保存到后端

**问题描述**：表单中配置了默认值的字段，如果用户未手动修改，这些默认值可能不会包含在最终提交的表单数据中。

**解决方案**：在表单初始化和提交时，确保将所有默认值正确包含：

```jsx
import React, { useState, useEffect } from 'react';
import DynamicFormGenerator from '../components/DynamicFormGenerator';

const FormPage = () => {
  const [formConfig, setFormConfig] = useState([]);
  const [formData, setFormData] = useState({});
  
  // 从API获取配置
  useEffect(() => {
    fetchFormConfig().then(config => {
      setFormConfig(config);
      
      // 初始化默认值
      const defaultValues = {};
      config.forEach(item => {
        // 排除分组和分隔线类型
        if (item.controlType?.toLowerCase() !== 'section' && 
            item.controlType?.toLowerCase() !== 'divider' && 
            item.dictionaryCode) {
          if (item.dictionaryValue !== undefined) {
            defaultValues[item.dictionaryCode] = item.dictionaryValue;
          }
        }
      });
      
      // 设置表单初始数据，包含所有默认值
      setFormData(prev => ({...prev, ...defaultValues}));
    });
  }, []);
  
  // 处理字段变更
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 提交表单时确保包含所有默认值
  const handleSubmit = () => {
    // 最终数据，包含用户修改的值和未修改的默认值
    const finalData = { ...formData };
    
    // 检查是否有配置了默认值但未包含在表单数据中的字段
    formConfig.forEach(item => {
      if (finalData[item.dictionaryCode] === undefined && 
          item.dictionaryValue !== undefined &&
          item.controlType?.toLowerCase() !== 'section' && 
          item.controlType?.toLowerCase() !== 'divider') {
        finalData[item.dictionaryCode] = item.dictionaryValue;
      }
    });
    
    // 提交最终数据
    submitToApi(finalData);
  };
  
  return (
    <div>
      <DynamicFormGenerator
        configs={formConfig}
        values={formData}
        onChange={handleFieldChange}
      />
      <button onClick={handleSubmit}>提交</button>
    </div>
  );
};
```

### 2. 多层嵌套对象的处理

**问题描述**：当表单数据是多层嵌套对象时，需要正确处理路径和值的更新。

**解决方案**：使用字段名格式"parent.child"来标识嵌套字段，并使用对应的访问和更新逻辑：

```jsx
// 嵌套字段的处理
const handleNestedFieldChange = (field, value) => {
  const fieldParts = field.split('.');
  
  if (fieldParts.length > 1) {
    // 处理嵌套字段，如 "extraParams.key1"
    const [parent, child] = fieldParts;
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  } else {
    // 处理普通字段
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }
};
```

### 3. 数组类型表单项的处理

当表单包含数组类型数据（如多个卡折扣配置）时，可以这样处理：

```jsx
// 添加新的数组项
const addArrayItem = () => {
  // 根据配置生成默认值
  const newItem = {};
  arrayItemConfig.forEach(config => {
    if (config.dictionaryValue !== undefined) {
      newItem[config.dictionaryCode] = config.dictionaryValue;
    }
  });
  
  // 添加到数组中
  setFormData(prev => ({
    ...prev,
    items: [...(prev.items || []), newItem]
  }));
};

// 更新数组中特定项的值
const updateArrayItem = (index, field, value) => {
  setFormData(prev => {
    const updatedItems = [...prev.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    return {
      ...prev,
      items: updatedItems
    };
  });
};

// 删除数组中的项
const removeArrayItem = (index) => {
  setFormData(prev => {
    const updatedItems = prev.items.filter((_, i) => i !== index);
    return {
      ...prev,
      items: updatedItems
    };
  });
};
```
