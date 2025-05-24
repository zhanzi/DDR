import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import DDR from '../core';
import { DDROptions, DDRInstance, DDREvent } from '../types';

interface DDRReactProps extends Omit<DDROptions, 'container'> {
  className?: string;
  style?: React.CSSProperties;
  onDataLoaded?: (data: any) => void;
  onRenderComplete?: () => void;
  onError?: (error: Error) => void;
  _fetchData?: () => Promise<any>; // 模拟API函数
}

// 暴露给ref的方法接口
export interface DDRReportRef {
  exportTo: (type: 'excel' | 'pdf', options?: any) => Promise<void>;
  print: () => void;
  reload: (params?: any) => Promise<void>;
  getInstance: () => DDRInstance | null;
}

/**
 * React组件封装
 * 允许在React项目中以组件形式使用DDR报表
 */
export const DDRReport = forwardRef<DDRReportRef, DDRReactProps>(({
  className,
  style,
  config,
  theme,
  mode,
  lang,
  metadata,
  onDataLoaded,
  onRenderComplete,
  onError,
  ...rest
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<DDRInstance | null>(null);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    exportTo: async (type: 'excel' | 'pdf', options?: any) => {
      if (instance) {
        return instance.exportTo(type, options);
      }
      throw new Error('DDR实例未初始化');
    },
    print: () => {
      if (instance) {
        instance.print();
      } else {
        throw new Error('DDR实例未初始化');
      }
    },
    reload: async (params?: any) => {
      if (instance) {
        return instance.reload(params);
      }
      throw new Error('DDR实例未初始化');
    },
    getInstance: () => instance
  }), [instance]);
    // 初始化DDR实例
  useEffect(() => {
    if (containerRef.current) {
      try {
        // 创建DDR实例
        const ddrInstance = DDR.create({
          container: containerRef.current,
          config,
          theme,
          mode,
          lang,
          metadata,
          onError: (error: Error) => {
            if (onError) {
              onError(error);
            }
          },
          ...rest
        });

        // 注册事件处理器
        if (onDataLoaded) {
          ddrInstance.on('data-loaded', ({ data }: { data: any[] }) => {
            onDataLoaded(data);
          });
        }

        if (onRenderComplete) {
          ddrInstance.on('render-complete', () => {
            onRenderComplete();
          });
        }

        setInstance(ddrInstance);

        // 清理函数
        return () => {
          ddrInstance.destroy();
        };
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    }

    // 确保总是返回一个清理函数
    return () => {
      // 空清理函数，避免TS7030警告
    };
  }, [config]); // 仅在config改变时重新初始化

  // 处理其他属性变更
  useEffect(() => {
    // 如果实例已存在并且主题变更，应用新主题
    if (instance && theme && containerRef.current) {
      // 移除所有主题类名
      containerRef.current.classList.forEach(className => {
        if (className.startsWith('ddr-theme-')) {
          containerRef.current?.classList.remove(className);
        }
      });
      // 添加新主题类名
      containerRef.current.classList.add(`ddr-theme-${theme}`);
    }
  }, [theme, instance]);

  // 处理元数据更新
  useEffect(() => {
    if (instance && metadata) {
      instance.updateMetadata(metadata);
    }
  }, [metadata, instance]);
    // 使用React.createElement替代JSX语法，防止TypeScript编译问题
  return React.createElement('div', {
    ref: containerRef,
    className: `ddr-react-container ${className || ''}`,
    style: {
      width: '100%',
      height: '100%',
      position: 'relative',
      ...(style || {})
    }
  });
});

export default DDRReport;
