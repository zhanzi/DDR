// Vue 2 适配器示例
// 文件名: src/adapters/vue2.js

import DDR from '../core';

export const DDRReport = {
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

  data() {
    return {
      instance: null
    };
  },

  mounted() {
    this.initDDR();
  },

  beforeDestroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  },

  watch: {
    config: {
      handler() {
        // 销毁旧实例
        if (this.instance) {
          this.instance.destroy();
          this.instance = null;
        }
        // 创建新实例
        this.initDDR();
      },
      deep: true
    },

    metadata: {
      handler(newMetadata) {
        if (this.instance && newMetadata) {
          this.instance.updateMetadata(newMetadata);
        }
      },
      deep: true
    },

    theme(newTheme) {
      if (this.$refs.container) {
        // 移除所有主题类名
        const classList = Array.from(this.$refs.container.classList);
        classList.forEach(className => {
          if (className.startsWith('ddr-theme-')) {
            this.$refs.container.classList.remove(className);
          }
        });
        // 添加新主题类名
        this.$refs.container.classList.add(`ddr-theme-${newTheme}`);
      }
    }
  },

  methods: {
    initDDR() {
      if (this.$refs.container) {
        try {
          // 创建DDR实例
          const instance = DDR.create({
            container: this.$refs.container,
            config: this.config,
            theme: this.theme,
            mode: this.mode,
            lang: this.lang,
            metadata: this.metadata,
            debug: this.debug,
            onError: (error) => {
              this.$emit('error', error);
            }
          });

          // 注册事件处理器
          instance.on('data-loaded', ({ data }) => {
            this.$emit('data-loaded', data);
          });

          instance.on('render-complete', () => {
            this.$emit('render-complete');
          });

          instance.on('export-start', (data) => {
            this.$emit('export-start', data);
          });

          instance.on('export-complete', (data) => {
            this.$emit('export-complete', data);
          });

          instance.on('metadata-updated', ({ metadata }) => {
            this.$emit('metadata-updated', metadata);
          });

          // 保存实例引用
          this.instance = instance;
        } catch (error) {
          this.$emit('error', error);
        }
      }
    },

    // 暴露给父组件的方法
    reload(params) {
      return this.instance?.reload(params);
    },

    refreshMetadata() {
      return this.instance?.refreshMetadata();
    },

    exportTo(type, options) {
      return this.instance?.exportTo(type, options);
    },

    print() {
      return this.instance?.print();
    },

    getData() {
      return this.instance?.getData();
    },

    getMetadata() {
      return this.instance?.getMetadata();
    }
  },

  render(h) {
    return h('div', {
      ref: 'container',
      class: 'ddr-vue-container',
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      }
    });
  }
};

export default DDRReport;
