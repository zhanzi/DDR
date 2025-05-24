/**
 * 表头表尾渲染器
 * 负责渲染报表的表头和表尾部分
 */
export class ReportHeaderFooter {
  /**
   * 渲染表头
   * @param container 容器元素
   * @param config 表头配置
   * @param data 表头数据
   */
  static renderHeader(
    container: HTMLElement,
    config: any,
    data: Record<string, any>
  ): HTMLElement {
    // 创建表头容器
    const headerContainer = document.createElement('div');
    headerContainer.className = 'ddr-header';
    
    // 设置表头高度(如果指定)
    if (config.height) {
      headerContainer.style.height = `${config.height}px`;
    }
    
    // 选择布局方式
    let layoutClass = 'ddr-header-layout-default';
    if (config.layout) {
      layoutClass = `ddr-header-layout-${config.layout}`;
    }
    headerContainer.classList.add(layoutClass);
    
    // 处理自定义布局
    if (config.layout === 'custom' && config.customLayout) {
      headerContainer.innerHTML = this.processTemplate(config.customLayout, data);
      container.prepend(headerContainer);
      return headerContainer;
    }
    
    // 添加Logo(如果有)
    if (config.logo) {
      const logoContainer = document.createElement('div');
      logoContainer.className = 'ddr-header-logo';
      
      // 设置Logo位置
      if (config.logo.position) {
        logoContainer.classList.add(`ddr-header-logo-${config.logo.position}`);
      } else {
        logoContainer.classList.add('ddr-header-logo-left');
      }
      
      // 创建Logo图片
      const logoImg = document.createElement('img');
      
      // 使用元数据中的Logo URL或静态URL
      const logoUrl = data.logoUrl || config.logo.url;
      if (logoUrl) {
        logoImg.src = logoUrl;
        
        // 设置Logo尺寸
        if (config.logo.width) {
          logoImg.style.width = `${config.logo.width}px`;
        }
        if (config.logo.height) {
          logoImg.style.height = `${config.logo.height}px`;
        }
        
        logoContainer.appendChild(logoImg);
        headerContainer.appendChild(logoContainer);
      }
    }
    
    // 添加标题
    if (config.title) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'ddr-header-title';
      
      // 处理动态标题或静态标题
      let titleText = '';
      if (typeof config.title === 'string') {
        titleText = config.title;
      } else if (typeof config.title === 'object') {
        titleText = data.title || config.title.text || '';
        
        // 应用标题样式(如果有)
        if (config.title.style) {
          Object.entries(config.title.style).forEach(([prop, value]) => {
            titleContainer.style[prop as any] = value as string;
          });
        }
      }
      
      titleContainer.textContent = titleText;
      headerContainer.appendChild(titleContainer);
      
      // 添加副标题(如果有)
      if (config.subtitle) {
        const subtitleElement = document.createElement('div');
        subtitleElement.className = 'ddr-header-subtitle';
        subtitleElement.textContent = config.subtitle;
        headerContainer.appendChild(subtitleElement);
      }
    }
    
    // 添加表头字段
    if (config.fields && config.fields.length && data.fields) {
      const fieldsContainer = document.createElement('div');
      fieldsContainer.className = 'ddr-header-fields';
      
      // 分别创建左侧和右侧字段容器
      const leftFields = document.createElement('div');
      leftFields.className = 'ddr-header-fields-left';
      
      const rightFields = document.createElement('div');
      rightFields.className = 'ddr-header-fields-right';
      
      // 遍历字段
      config.fields.forEach((field: any) => {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'ddr-header-field';
        
        // 创建标签
        const labelElement = document.createElement('span');
        labelElement.className = 'ddr-header-field-label';
        labelElement.textContent = field.label || field.key;
        
        // 创建值
        const valueElement = document.createElement('span');
        valueElement.className = 'ddr-header-field-value';
        
        // 获取字段值(静态值或元数据值)
        const fieldValue = field.value || (data.fields && data.fields[field.key]) || '';
        valueElement.textContent = fieldValue;
        
        // 应用自定义样式(如果有)
        if (field.style) {
          Object.entries(field.style).forEach(([prop, value]) => {
            fieldElement.style[prop as any] = value as string;
          });
        }
        
        // 组装字段元素
        fieldElement.appendChild(labelElement);
        fieldElement.appendChild(valueElement);
        
        // 根据位置添加到左侧或右侧
        if (field.position === 'right') {
          rightFields.appendChild(fieldElement);
        } else {
          leftFields.appendChild(fieldElement);
        }
      });
      
      // 添加字段到容器
      fieldsContainer.appendChild(leftFields);
      fieldsContainer.appendChild(rightFields);
      headerContainer.appendChild(fieldsContainer);
    }
    
    // 添加到页面
    container.prepend(headerContainer);
    return headerContainer;
  }
  
  /**
   * 渲染表尾
   * @param container 容器元素
   * @param config 表尾配置
   * @param data 表尾数据
   */
  static renderFooter(
    container: HTMLElement,
    config: any,
    data: Record<string, any>
  ): HTMLElement {
    // 创建表尾容器
    const footerContainer = document.createElement('div');
    footerContainer.className = 'ddr-footer';
    
    // 设置表尾高度(如果指定)
    if (config.height) {
      footerContainer.style.height = `${config.height}px`;
    }
    
    // 选择布局方式
    let layoutClass = 'ddr-footer-layout-default';
    if (config.layout) {
      layoutClass = `ddr-footer-layout-${config.layout}`;
    }
    footerContainer.classList.add(layoutClass);
    
    // 是否固定在底部
    if (config.fixed) {
      footerContainer.classList.add('ddr-footer-fixed');
    }
    
    // 处理自定义布局
    if (config.layout === 'custom' && config.customLayout) {
      footerContainer.innerHTML = this.processTemplate(config.customLayout, data);
      container.appendChild(footerContainer);
      return footerContainer;
    }
    
    // 添加汇总信息(如果有)
    if (config.summary && config.summary.length && data.summary) {
      const summaryContainer = document.createElement('div');
      summaryContainer.className = 'ddr-footer-summary';
      
      // 遍历汇总项
      config.summary.forEach((summaryItem: any) => {
        const summaryElement = document.createElement('div');
        summaryElement.className = 'ddr-footer-summary-item';
        
        // 创建标签
        const labelElement = document.createElement('span');
        labelElement.className = 'ddr-footer-summary-label';
        labelElement.textContent = summaryItem.label || `${summaryItem.column}汇总:`;
        
        // 创建值
        const valueElement = document.createElement('span');
        valueElement.className = 'ddr-footer-summary-value';
        
        // 获取汇总值
        const summaryValue = data.summary[summaryItem.column] || '';
        valueElement.textContent = summaryValue;
        
        // 组装汇总元素
        summaryElement.appendChild(labelElement);
        summaryElement.appendChild(valueElement);
        summaryContainer.appendChild(summaryElement);
      });
      
      footerContainer.appendChild(summaryContainer);
    }
    
    // 添加表尾字段
    if (config.fields && config.fields.length && data.fields) {
      const fieldsContainer = document.createElement('div');
      fieldsContainer.className = 'ddr-footer-fields';
      
      // 遍历字段
      config.fields.forEach((field: any) => {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'ddr-footer-field';
        
        // 根据位置添加类名
        if (field.position) {
          fieldElement.classList.add(`ddr-footer-field-${field.position}`);
        }
        
        // 创建标签
        const labelElement = document.createElement('span');
        labelElement.className = 'ddr-footer-field-label';
        labelElement.textContent = field.label || field.key;
        
        // 创建值
        const valueElement = document.createElement('span');
        valueElement.className = 'ddr-footer-field-value';
        
        // 获取字段值(静态值或元数据值)
        const fieldValue = field.value || (data.fields && data.fields[field.key]) || '';
        valueElement.textContent = fieldValue;
        
        // 应用自定义样式(如果有)
        if (field.style) {
          Object.entries(field.style).forEach(([prop, value]) => {
            fieldElement.style[prop as any] = value as string;
          });
        }
        
        // 组装字段元素
        fieldElement.appendChild(labelElement);
        fieldElement.appendChild(valueElement);
        fieldsContainer.appendChild(fieldElement);
      });
      
      footerContainer.appendChild(fieldsContainer);
    }
    
    // 添加签名区域
    if (config.signatures && config.signatures.length) {
      const signaturesContainer = document.createElement('div');
      signaturesContainer.className = 'ddr-footer-signatures';
      
      // 遍历签名项
      config.signatures.forEach((signature: any, index: number) => {
        const signatureElement = document.createElement('div');
        signatureElement.className = 'ddr-footer-signature';
        
        // 签名线
        const lineElement = document.createElement('div');
        lineElement.className = 'ddr-footer-signature-line';
        
        // 签名人
        let nameValue = signature.name || '';
        if (signature.metadataPath && data.signatures && data.signatures[index]) {
          nameValue = data.signatures[index].name || nameValue;
        }
        
        // 日期时间
        let dateValue = '';
        if (signature.showTimestamp && signature.dateMetadataPath && 
            data.signatures && data.signatures[index]) {
          dateValue = data.signatures[index].date || '';
        }
        
        // 设置宽度
        if (signature.width) {
          signatureElement.style.width = `${signature.width}px`;
        }
        
        // 签名标签
        const labelElement = document.createElement('div');
        labelElement.className = 'ddr-footer-signature-label';
        labelElement.textContent = signature.label || `签名${index + 1}`;
        
        // 签名名称
        const nameElement = document.createElement('div');
        nameElement.className = 'ddr-footer-signature-name';
        nameElement.textContent = nameValue;
        
        // 日期时间(如果有)
        if (dateValue) {
          const dateElement = document.createElement('div');
          dateElement.className = 'ddr-footer-signature-date';
          dateElement.textContent = dateValue;
          signatureElement.appendChild(dateElement);
        }
        
        // 组装签名元素
        signatureElement.appendChild(labelElement);
        signatureElement.appendChild(lineElement);
        signatureElement.appendChild(nameElement);
        signaturesContainer.appendChild(signatureElement);
      });
      
      footerContainer.appendChild(signaturesContainer);
    }
    
    // 添加页码信息(如果有)
    if (config.pageInfo && data.pagination) {
      const pageInfoElement = document.createElement('div');
      pageInfoElement.className = 'ddr-footer-page-info';
      
      // 设置位置
      if (config.pageInfo.position) {
        pageInfoElement.classList.add(`ddr-footer-page-info-${config.pageInfo.position}`);
      } else {
        pageInfoElement.classList.add('ddr-footer-page-info-center');
      }
      
      // 格式化页码信息
      let pageInfoText = config.pageInfo.format || '第 {current} 页/共 {total} 页';
      pageInfoText = pageInfoText
        .replace('{current}', String(data.pagination.pageNumber))
        .replace('{total}', String(data.pagination.totalPages));
      
      pageInfoElement.textContent = pageInfoText;
      footerContainer.appendChild(pageInfoElement);
    }
    
    // 添加注释(如果有)
    if (config.notes) {
      const notesElement = document.createElement('div');
      notesElement.className = 'ddr-footer-notes';
      notesElement.textContent = config.notes;
      footerContainer.appendChild(notesElement);
    }
      // 添加到页面
    // 确保页脚被添加到正确的容器位置，检查是否有表格容器来添加
    const tableContainer = container.querySelector('.ddr-table-container');
    if (tableContainer) {
      // 将页脚添加到表格容器之后
      tableContainer.parentNode?.insertBefore(footerContainer, tableContainer.nextSibling);
    } else {
      // 如果没有找到表格容器，则添加到主容器末尾
      container.appendChild(footerContainer);
    }
    return footerContainer;
  }
  
  /**
   * 处理模板字符串
   * 替换模板中的变量为实际数据
   * @param template 模板字符串
   * @param data 数据对象
   */
  private static processTemplate(template: string, data: Record<string, any>): string {
    // 替换简单的变量 {{variable}}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      // 解析嵌套属性，如 "company.name"
      const value = key.split('.').reduce((obj: any, prop: string) => {
        return obj && obj[prop] !== undefined ? obj[prop] : '';
      }, data);
      
      return String(value);
    });
  }
}
