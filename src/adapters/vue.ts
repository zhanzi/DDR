import { defineComponent, h, onMounted, onUnmounted, watch, ref } from 'vue';
import DDR from '../core';
import { DDROptions, DDRInstance, DDRConfig } from '../types';

export const DDRReport = defineComponent({
  name: 'DDRReport',
  
  props: {
    config: {
      type: [String, Object],
      required: true
    },
    theme: {
      type: String,
      default: 'default'
    },
    mode: {
      type: String,
      default: 'auto'
    },
    lang: {
      type: String,
      default: 'zh-CN'
    },
    metadata: {
      type: Object,
      default: () => ({})
    },
    debug: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['data-loaded', 'render-complete', 'export-start', 'export-complete', 'metadata-updated', 'error'],
  
  setup(props, { emit, expose }) {
    // 引用DOM容器元素
    const containerRef = ref<HTMLElement | null>(null);
    
    // DDR实例引用
    const instanceRef = ref<DDRInstance | null>(null);
    
    // 初始化DDR实例
    const initDDR = () => {
      if (containerRef.value) {
        try {          // 创建DDR实例
          const instance = DDR.create({
            container: containerRef.value,
            config: props.config as string | DDRConfig,
            theme: props.theme,
            mode: props.mode as "auto" | "dom" | "canvas" | undefined,
            lang: props.lang,
            metadata: props.metadata,
            debug: props.debug,
            onError: (error: Error) => {
              emit('error', error);
            }
          });
          
          // 注册事件处理器
          instance.on('data-loaded', ({ data }: { data: any[] }) => {
            emit('data-loaded', data);
          });
          
          instance.on('render-complete', () => {
            emit('render-complete');
          });
            instance.on('export-start', (data: Record<string, any>) => {
            emit('export-start', data);
          });
          
          instance.on('export-complete', (data: Record<string, any>) => {
            emit('export-complete', data);
          });
          
          instance.on('metadata-updated', ({ metadata }: { metadata: Record<string, any> }) => {
            emit('metadata-updated', metadata);
          });
          
          // 保存实例引用
          instanceRef.value = instance;
        } catch (error) {
          if (error instanceof Error) {
            emit('error', error);
          }
        }
      }
    };
    
    // 在组件挂载后初始化DDR
    onMounted(() => {
      initDDR();
    });
    
    // 在组件卸载前销毁DDR实例
    onUnmounted(() => {
      if (instanceRef.value) {
        instanceRef.value.destroy();
        instanceRef.value = null;
      }
    });
    
    // 监听配置变更，重新初始化DDR
    watch(
      () => props.config,
      () => {
        // 销毁旧实例
        if (instanceRef.value) {
          instanceRef.value.destroy();
          instanceRef.value = null;
        }
        
        // 创建新实例
        initDDR();
      },
      { deep: true }
    );
    
    // 监听元数据变更
    watch(
      () => props.metadata,
      (newMetadata) => {
        if (instanceRef.value && newMetadata) {
          instanceRef.value.updateMetadata(newMetadata);
        }
      },
      { deep: true }
    );
    
    // 监听主题变更
    watch(
      () => props.theme,
      (newTheme) => {
        if (containerRef.value) {
          // 移除所有主题类名
          containerRef.value.classList.forEach(className => {
            if (className.startsWith('ddr-theme-')) {
              containerRef.value?.classList.remove(className);
            }
          });
          // 添加新主题类名
          containerRef.value.classList.add(`ddr-theme-${newTheme}`);
        }
      }
    );
    
    // 暴露方法给父组件
    expose({
      reload: (params?: Record<string, any>) => {
        return instanceRef.value?.reload(params);
      },
      refreshMetadata: () => {
        return instanceRef.value?.refreshMetadata();
      },
      exportTo: (type: "excel" | "pdf", options?: any) => {
        return instanceRef.value?.exportTo(type, options);
      },
      print: () => {
        return instanceRef.value?.print();
      },
      getData: () => {
        return instanceRef.value?.getData();
      },
      getMetadata: () => {
        return instanceRef.value?.getMetadata();
      }
    });
    
    // 返回渲染函数需要的值
    return {
      containerRef
    };
  },
  
  render() {
    // 渲染容器div
    return h('div', {
      ref: 'containerRef',
      class: 'ddr-vue-container',
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      }
    });
  }
});

export default DDRReport;
