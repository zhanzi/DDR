import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * DDR核心类
 * 数据驱动报表的主要实现
 */
var DDR = /** @class */function () {
  function DDR(options) {
    this.data = [];
    this.metadata = {};
    this.pagination = null;
    this.filters = {};
    this.eventListeners = new Map();
    this.formatters = {};
    this.initialized = false;
    this.options = options;
    // 获取容器元素
    if (typeof options.container === 'string') {
      var el = document.querySelector(options.container);
      if (!el) {
        throw new Error("\u627E\u4E0D\u5230\u5BB9\u5668\u5143\u7D20: ".concat(options.container));
      }
      this.container = el;
    } else if (options.container instanceof HTMLElement) {
      this.container = options.container;
    } else {
      throw new Error('无效的容器元素');
    }
    // 应用容器样式
    this.container.classList.add('ddr-container');
    if (options.theme) {
      this.container.classList.add("ddr-theme-".concat(options.theme));
    } else {
      this.container.classList.add('ddr-theme-default');
    }
    // 合并本地和全局格式化函数
    this.formatters = __assign({}, DDR.globalFormatters);
    // 初始化元数据
    if (options.metadata) {
      this.metadata = __assign({}, options.metadata);
    }
  }
  /**
   * 创建DDR实例
   * @param options 初始化选项
   * @returns DDR实例
   */
  DDR.create = function (options) {
    var instance = new DDR(options);
    instance.init().catch(function (error) {
      if (options.onError) {
        options.onError(error);
      } else {
        console.error('DDR初始化失败:', error);
      }
    });
    return instance;
  };
  /**
   * 注册自定义格式化函数
   * @param name 格式化函数名称
   * @param formatter 格式化函数
   */
  DDR.registerFormatter = function (name, formatter) {
    DDR.globalFormatters[name] = formatter;
  };
  /**
   * 初始化报表
   */
  DDR.prototype.init = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _a, apiResponse, error_1;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 3,, 4]);
            // 加载配置
            _a = this;
            return [4 /*yield*/, this._loadConfig(this.options.config)];
          case 1:
            // 加载配置
            _a.config = _b.sent();
            return [4 /*yield*/, this._fetchData(this.config.dataSource)];
          case 2:
            apiResponse = _b.sent();
            this.data = apiResponse.records;
            this.metadata = apiResponse.metadata || this.metadata;
            this.pagination = apiResponse.pagination || null;
            // 渲染报表
            this._render();
            this.initialized = true;
            this._emitEvent('data-loaded', {
              data: this.data
            });
            if (this.options.onLoad) {
              this.options.onLoad();
            }
            return [3 /*break*/, 4];
          case 3:
            error_1 = _b.sent();
            this._emitEvent('error', {
              error: error_1
            });
            throw error_1;
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 重新加载数据
   * @param params 额外的查询参数
   */
  DDR.prototype.reload = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var apiResponse, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.initialized) {
              throw new Error('DDR尚未初始化');
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3,, 4]);
            return [4 /*yield*/, this._fetchData(this.config.dataSource, params)];
          case 2:
            apiResponse = _a.sent();
            this.data = apiResponse.records;
            // 只有在API返回了元数据时才更新
            if (apiResponse.metadata) {
              this.metadata = apiResponse.metadata;
              this._emitEvent('metadata-updated', {
                metadata: this.metadata
              });
            }
            this.pagination = apiResponse.pagination || null;
            // 重新渲染
            this._render();
            this._emitEvent('data-loaded', {
              data: this.data
            });
            return [3 /*break*/, 4];
          case 3:
            error_2 = _a.sent();
            this._emitEvent('error', {
              error: error_2
            });
            throw error_2;
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 刷新元数据
   */
  DDR.prototype.refreshMetadata = function () {
    return __awaiter(this, void 0, void 0, function () {
      var response, apiResponse, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.initialized) {
              throw new Error('DDR尚未初始化');
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 6,, 7]);
            if (!this.config.dataSource.metadataSource) return [3 /*break*/, 3];
            return [4 /*yield*/, this._fetchMetadata(this.config.dataSource.metadataSource)];
          case 2:
            response = _a.sent();
            this.metadata = response.metadata || {};
            return [3 /*break*/, 5];
          case 3:
            return [4 /*yield*/, this._fetchData(this.config.dataSource)];
          case 4:
            apiResponse = _a.sent();
            if (apiResponse.metadata) {
              this.metadata = apiResponse.metadata;
            }
            _a.label = 5;
          case 5:
            // 重新渲染表头和表尾
            this._renderHeaderFooter();
            this._emitEvent('metadata-updated', {
              metadata: this.metadata
            });
            return [3 /*break*/, 7];
          case 6:
            error_3 = _a.sent();
            this._emitEvent('error', {
              error: error_3
            });
            throw error_3;
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 更新元数据
   * @param metadata 要更新的元数据
   */
  DDR.prototype.updateMetadata = function (metadata) {
    // 检查是否包含数据更新
    if (metadata.data && Array.isArray(metadata.data)) {
      console.log('📊 通过updateMetadata更新数据，共', metadata.data.length, '条记录');
      this.data = metadata.data;
      // 从metadata中移除data，避免污染元数据
      metadata.data;
        var metadataWithoutData = __rest(metadata, ["data"]);
      this.metadata = __assign(__assign({}, this.metadata), metadataWithoutData);
      if (this.initialized) {
        // 重新渲染整个报表（包括数据表格）
        this._render();
        this._emitEvent('data-loaded', {
          data: this.data
        });
        this._emitEvent('metadata-updated', {
          metadata: this.metadata
        });
      }
    } else {
      // 只更新元数据，不涉及数据变更
      this.metadata = __assign(__assign({}, this.metadata), metadata);
      if (this.initialized) {
        // 只重新渲染表头和表尾
        this._renderHeaderFooter();
        this._emitEvent('metadata-updated', {
          metadata: this.metadata
        });
      }
    }
  };
  /**
   * 导出为Excel或PDF
   * @param type 导出类型
   * @param options 导出选项
   */
  DDR.prototype.exportTo = function (type, options) {
    return __awaiter(this, void 0, void 0, function () {
      var Exporter, error_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.initialized) {
              throw new Error('DDR尚未初始化');
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 7,, 8]);
            this._emitEvent('export-start', {
              type: type,
              options: options
            });
            return [4 /*yield*/, Promise.resolve().then(function () { return index; })];
          case 2:
            Exporter = _a.sent().Exporter;
            if (!(type === 'excel')) return [3 /*break*/, 4];
            // Excel导出传递DOM元素以保留样式
            return [4 /*yield*/, Exporter.toExcel(this.container, options)];
          case 3:
            // Excel导出传递DOM元素以保留样式
            _a.sent();
            return [3 /*break*/, 6];
          case 4:
            if (!(type === 'pdf')) return [3 /*break*/, 6];
            // PDF导出传递DOM元素和配置
            return [4 /*yield*/, Exporter.toPDF(this.container, this.config, options)];
          case 5:
            // PDF导出传递DOM元素和配置
            _a.sent();
            _a.label = 6;
          case 6:
            this._emitEvent('export-complete', {
              type: type,
              fileName: (options === null || options === void 0 ? void 0 : options.fileName) || "".concat(this.config.meta.name, ".").concat(type === 'excel' ? 'xlsx' : 'pdf')
            });
            return [3 /*break*/, 8];
          case 7:
            error_4 = _a.sent();
            this._emitEvent('error', {
              error: error_4
            });
            throw error_4;
          case 8:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 销毁实例并清理资源
   */
  DDR.prototype.destroy = function () {
    // 清除DOM
    this.container.innerHTML = '';
    // 移除事件监听器
    this.eventListeners.clear();
    // 清除引用
    this.data = [];
    this.metadata = {};
    this.initialized = false;
  };
  /**
   * 设置过滤条件
   * @param filters 过滤条件
   */
  DDR.prototype.setFilter = function (filters) {
    this.filters = __assign(__assign({}, this.filters), filters);
  };
  /**
   * 添加事件监听
   * @param event 事件名称
   * @param callback 回调函数
   */
  DDR.prototype.on = function (event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  };
  /**
   * 移除事件监听
   * @param event 事件名称
   * @param callback 回调函数
   */
  DDR.prototype.off = function (event, callback) {
    if (this.eventListeners.has(event)) {
      var callbacks = this.eventListeners.get(event);
      var index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  };
  /**
   * 执行打印 - 使用与PDF导出一致的逻辑
   */
  DDR.prototype.print = function () {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
      var Exporter, error_5;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            _c.trys.push([0, 3,, 4]);
            console.log('开始打印，使用PDF导出逻辑生成打印内容');
            return [4 /*yield*/, Promise.resolve().then(function () { return index; })];
          case 1:
            Exporter = _c.sent().Exporter;
            // 使用PDF导出的逻辑生成打印内容，但不保存文件
            return [4 /*yield*/, Exporter.toPrint(this.container, this.config, {
              watermark: (_a = this.config.features) === null || _a === void 0 ? void 0 : _a.watermark,
              pdf: ((_b = this.config.features) === null || _b === void 0 ? void 0 : _b.pdfConfig) || {}
            })];
          case 2:
            // 使用PDF导出的逻辑生成打印内容，但不保存文件
            _c.sent();
            return [3 /*break*/, 4];
          case 3:
            error_5 = _c.sent();
            console.error('打印失败，降级到简单打印:', error_5);
            // 降级到原来的简单打印方式
            this._simplePrint();
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 简单打印方式（降级方案）
   */
  DDR.prototype._simplePrint = function () {
    // 创建打印样式
    var style = document.createElement('style');
    style.textContent = "\n      @media print {\n        body * {\n          visibility: hidden;\n        }\n        .ddr-container, .ddr-container * {\n          visibility: visible;\n        }\n        .ddr-container {\n          position: absolute;\n          left: 0;\n          top: 0;\n          width: 100% !important;\n          height: auto !important;\n          overflow: visible !important;\n        }\n        .ddr-table-container {\n          overflow: visible !important;\n          height: auto !important;\n        }\n        .ddr-table {\n          page-break-inside: auto;\n        }\n        .ddr-table-row {\n          page-break-inside: avoid;\n          page-break-after: auto;\n        }\n        .ddr-header, .ddr-footer {\n          page-break-inside: avoid;\n        }\n      }\n    ";
    document.head.appendChild(style);
    // 执行打印
    window.print();
    // 移除打印样式
    setTimeout(function () {
      document.head.removeChild(style);
    }, 100);
  };
  /**
   * 获取原始数据
   * @returns 数据数组
   */
  DDR.prototype.getData = function () {
    return __spreadArray([], this.data, true);
  };
  /**
   * 获取元数据
   * @returns 元数据对象
   */
  DDR.prototype.getMetadata = function () {
    return __assign({}, this.metadata);
  };
  /**
   * 从元数据中根据路径获取值
   * @param path 路径，例如："company.name"
   * @returns 找到的值或undefined
   */
  DDR.prototype._getValueByPath = function (path) {
    if (!path) return undefined;
    return path.split('.').reduce(function (acc, part) {
      return acc && acc[part] !== undefined ? acc[part] : undefined;
    }, this.metadata);
  };
  /**
   * 加载配置
   * @param config 配置路径或对象
   * @returns 加载后的配置
   */
  DDR.prototype._loadConfig = function (config) {
    return __awaiter(this, void 0, void 0, function () {
      var response, response, error_6;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!(typeof config === 'string')) return [3 /*break*/, 8];
            if (!config.startsWith('http')) return [3 /*break*/, 3];
            return [4 /*yield*/, fetch(config)];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("\u52A0\u8F7D\u914D\u7F6E\u5931\u8D25: ".concat(response.statusText));
            }
            return [4 /*yield*/, response.json()];
          case 2:
            return [2 /*return*/, _a.sent()];
          case 3:
            _a.trys.push([3, 6,, 7]);
            return [4 /*yield*/, fetch(config)];
          case 4:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("\u52A0\u8F7D\u914D\u7F6E\u5931\u8D25: ".concat(response.statusText));
            }
            return [4 /*yield*/, response.json()];
          case 5:
            return [2 /*return*/, _a.sent()];
          case 6:
            error_6 = _a.sent();
            throw new Error("\u52A0\u8F7D\u914D\u7F6E\u5931\u8D25: ".concat(error_6 instanceof Error ? error_6.message : String(error_6)));
          case 7:
            return [3 /*break*/, 9];
          case 8:
            return [2 /*return*/, config];
          case 9:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 获取数据
   * @param dataSource 数据源配置
   * @param extraParams 额外的查询参数
   * @returns API响应对象
   */
  DDR.prototype._fetchData = function (dataSource, extraParams) {
    return __awaiter(this, void 0, void 0, function () {
      var params, options, url, queryParams_1, response, result;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            // 优先级1：如果直接提供了数据，则使用直接数据
            if (dataSource.data && Array.isArray(dataSource.data)) {
              console.log('📊 使用直接提供的数据，共', dataSource.data.length, '条记录');
              return [2 /*return*/, {
                records: dataSource.data,
                metadata: this.metadata
              }];
            }
            // 优先级2：如果有模拟数据则使用模拟数据
            if (dataSource.mock && (!this.options.debug || window.location.hostname === 'localhost')) {
              console.log('📊 使用模拟数据，共', dataSource.mock.length, '条记录');
              return [2 /*return*/, {
                records: dataSource.mock,
                metadata: this.metadata
              }];
            }
            // 优先级3：如果没有API配置，则返回空数据
            if (!dataSource.api) {
              console.warn('⚠️ 未配置API地址且未提供直接数据，返回空数据集');
              return [2 /*return*/, {
                records: [],
                metadata: this.metadata
              }];
            }
            params = __assign(__assign(__assign({}, dataSource.params), this.filters), extraParams);
            options = {
              method: dataSource.method || 'GET',
              headers: __assign({
                'Content-Type': 'application/json'
              }, dataSource.headers || {})
            };
            // 对于POST请求，添加body
            if (options.method === 'POST') {
              options.body = JSON.stringify(params);
            }
            url = dataSource.api;
            if (options.method === 'GET' && Object.keys(params).length > 0) {
              queryParams_1 = new URLSearchParams();
              Object.entries(params).forEach(function (_a) {
                var key = _a[0],
                  value = _a[1];
                queryParams_1.append(key, String(value));
              });
              url += "?".concat(queryParams_1.toString());
            }
            return [4 /*yield*/, fetch(url, options)];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("API\u8BF7\u6C42\u5931\u8D25: ".concat(response.statusText));
            }
            return [4 /*yield*/, response.json()];
          case 2:
            result = _a.sent();
            // 检查API返回状态
            if (!result.success) {
              throw new Error("API\u9519\u8BEF: ".concat(result.message || "\u72B6\u6001\u7801 ".concat(result.code)));
            }
            // 提取数据
            return [2 /*return*/, {
              records: result.data.records || [],
              metadata: result.data.metadata,
              pagination: result.data.pagination
            }];
        }
      });
    });
  };
  /**
   * 获取元数据
   * @param metadataSource 元数据源配置
   * @returns 元数据对象
   */
  DDR.prototype._fetchMetadata = function (metadataSource) {
    return __awaiter(this, void 0, void 0, function () {
      var options, url, queryParams_2, response, result;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!metadataSource) {
              throw new Error('未配置元数据源');
            }
            options = {
              method: metadataSource.method || 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            };
            // 对于POST请求，添加body
            if (options.method === 'POST' && metadataSource.params) {
              options.body = JSON.stringify(metadataSource.params);
            }
            url = metadataSource.api;
            if (options.method === 'GET' && metadataSource.params && Object.keys(metadataSource.params).length > 0) {
              queryParams_2 = new URLSearchParams();
              Object.entries(metadataSource.params).forEach(function (_a) {
                var key = _a[0],
                  value = _a[1];
                queryParams_2.append(key, String(value));
              });
              url += "?".concat(queryParams_2.toString());
            }
            return [4 /*yield*/, fetch(url, options)];
          case 1:
            response = _a.sent();
            if (!response.ok) {
              throw new Error("\u5143\u6570\u636EAPI\u8BF7\u6C42\u5931\u8D25: ".concat(response.statusText));
            }
            return [4 /*yield*/, response.json()];
          case 2:
            result = _a.sent();
            // 检查API返回状态
            if (!result.success) {
              throw new Error("\u5143\u6570\u636EAPI\u9519\u8BEF: ".concat(result.message || "\u72B6\u6001\u7801 ".concat(result.code)));
            }
            // 提取元数据
            return [2 /*return*/, {
              metadata: result.data.metadata || {}
            }];
        }
      });
    });
  };
  /**
   * 渲染报表
   */
  DDR.prototype._render = function () {
    var _a;
    // 清空容器
    this.container.innerHTML = '';
    // 创建包装器
    var wrapper = document.createElement('div');
    wrapper.className = 'ddr-wrapper';
    // 应用布局设置
    if (this.config.layout) {
      if (this.config.layout.height) {
        wrapper.style.height = typeof this.config.layout.height === 'number' ? "".concat(this.config.layout.height, "px") : this.config.layout.height;
      }
      if (this.config.layout.bordered) {
        wrapper.classList.add('ddr-bordered');
      }
    }
    this.container.appendChild(wrapper);
    // 根据数据量选择渲染模式
    var renderMode = this._determineRenderMode();
    wrapper.setAttribute('data-render-mode', renderMode);
    // 渲染表头和表尾
    this._renderHeaderFooter(wrapper);
    // 渲染数据表格
    if (renderMode === 'canvas') {
      this._renderCanvas(wrapper);
    } else {
      this._renderDOM(wrapper);
    }
    // 添加水印
    if ((_a = this.config.features) === null || _a === void 0 ? void 0 : _a.watermark) {
      this._addWatermark(wrapper, this.config.features.watermark);
    }
    this._emitEvent('render-complete');
  }; /**
     * 渲染表头和表尾
     * @param container 容器元素
     */
  DDR.prototype._renderHeaderFooter = function (container) {
    var wrapper = container || this.container.querySelector('.ddr-wrapper');
    if (!wrapper) return;
    // 移除旧的表头和表尾
    var oldHeader = wrapper.querySelector('.ddr-report-header');
    var oldFooter = wrapper.querySelector('.ddr-report-footer');
    if (oldHeader) {
      wrapper.removeChild(oldHeader);
    }
    if (oldFooter) {
      wrapper.removeChild(oldFooter);
    }
    // 添加新的表头
    if (this.config.header) {
      var header = this._createHeader(this.config.header);
      if (header) {
        wrapper.insertBefore(header, wrapper.firstChild);
        // 使用MutationObserver监听表头高度变化
        var resizeObserver = new ResizeObserver(function (entries) {
          for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            // 获取准确的header高度
            var headerHeight_1 = entry.contentRect.height;
            wrapper.style.setProperty('--header-height', "".concat(headerHeight_1, "px"));
            // 确保表格容器的位置和高度正确
            var tableContainer_1 = wrapper.querySelector('.ddr-table-container');
            if (tableContainer_1) {
              // 不再直接设置top，使用margin来控制位置，避免绝对定位导致的重叠
              tableContainer_1.style.marginTop = '10px';
              tableContainer_1.style.maxHeight = "calc(100% - ".concat(headerHeight_1 + 10, "px - var(--footer-height, 0px))");
            }
          }
        });
        // 开始监听表头尺寸变化
        resizeObserver.observe(header);
        // 立即执行一次计算
        var headerHeight = header.getBoundingClientRect().height;
        wrapper.style.setProperty('--header-height', "".concat(headerHeight, "px"));
        // 确保表格容器的高度和位置正确
        var tableContainer = wrapper.querySelector('.ddr-table-container');
        if (tableContainer) {
          tableContainer.style.marginTop = '10px';
          tableContainer.style.maxHeight = "calc(100% - ".concat(headerHeight + 10, "px - var(--footer-height, 0px))");
        }
      }
    }
    // 表尾现在在_renderDOM中处理
    // 初始渲染时不再在这里添加页脚，而是在渲染完表格后添加
    // 这样可以确保页脚放置在表格容器之后
    if (this.config.footer && this.initialized) {
      // 只在刷新元数据时添加页脚
      var footer = this._createFooter(this.config.footer);
      if (footer) {
        // 尝试查找表格容器，如果找到则在其后添加页脚
        var tableContainer = wrapper.querySelector('.ddr-table-container');
        if (tableContainer) {
          wrapper.insertBefore(footer, tableContainer.nextSibling);
        } else {
          wrapper.appendChild(footer);
        }
      }
    }
  };
  /**
  * 创建表头
  * @param headerConfig 表头配置
  * @returns 表头元素
  */
  DDR.prototype._createHeader = function (headerConfig) {
    var _this = this;
    if (!headerConfig) return null;
    var headerElement = document.createElement('div');
    headerElement.className = 'ddr-report-header';
    // 不再设置固定高度，改为最小高度，让其自动适应内容
    headerElement.style.minHeight = "".concat(headerConfig.height || 80, "px");
    // 创建顶部区域容器（Logo + 标题）
    var topContainer = document.createElement('div');
    topContainer.className = 'ddr-header-top';
    // 渲染Logo
    if (headerConfig.logo) {
      var logoContainer = document.createElement('div');
      logoContainer.className = "ddr-header-logo ddr-header-logo-".concat(headerConfig.logo.position || 'left');
      var logoImg = document.createElement('img');
      logoImg.alt = 'Logo';
      // 优先使用元数据中的logo
      logoImg.src = headerConfig.logo.metadataKey ? this._getValueByPath(headerConfig.logo.metadataKey) || headerConfig.logo.url || '' : headerConfig.logo.url || '';
      if (headerConfig.logo.width) {
        logoImg.width = headerConfig.logo.width;
      }
      if (headerConfig.logo.height) {
        logoImg.height = headerConfig.logo.height;
      }
      logoContainer.appendChild(logoImg);
      topContainer.appendChild(logoContainer);
    }
    // 创建中间标题区域
    var centerContainer = document.createElement('div');
    centerContainer.className = 'ddr-header-center';
    // 渲染标题到中间区域
    if (headerConfig.title) {
      var titleText = typeof headerConfig.title === 'string' ? headerConfig.title : headerConfig.title.metadataPath ? this._getValueByPath(headerConfig.title.metadataPath) || headerConfig.title.text : headerConfig.title.text;
      var titleElement = document.createElement('h2');
      titleElement.className = 'ddr-header-title';
      titleElement.textContent = titleText;
      if (typeof headerConfig.title === 'object' && headerConfig.title.style) {
        Object.assign(titleElement.style, headerConfig.title.style);
      }
      centerContainer.appendChild(titleElement);
    }
    // 渲染副标题到中间区域
    if (headerConfig.subtitle) {
      var subtitleElement = document.createElement('div');
      subtitleElement.className = 'ddr-header-subtitle';
      subtitleElement.textContent = headerConfig.subtitle;
      centerContainer.appendChild(subtitleElement);
    }
    topContainer.appendChild(centerContainer);
    headerElement.appendChild(topContainer);
    // 渲染字段
    if (headerConfig.fields && headerConfig.fields.length > 0) {
      var fieldsContainer = document.createElement('div');
      fieldsContainer.className = 'ddr-header-fields';
      var leftFields_1 = document.createElement('div');
      leftFields_1.className = 'ddr-header-fields-left';
      var rightFields_1 = document.createElement('div');
      rightFields_1.className = 'ddr-header-fields-right';
      headerConfig.fields.forEach(function (field) {
        var fieldElement = document.createElement('div');
        fieldElement.className = 'ddr-header-field';
        // 创建标签
        var labelElement = document.createElement('span');
        labelElement.className = 'ddr-field-label';
        labelElement.textContent = field.label || '';
        fieldElement.appendChild(labelElement);
        // 创建值
        var valueElement = document.createElement('span');
        valueElement.className = 'ddr-field-value';
        // 优先从元数据获取值
        var value = field.metadataPath ? _this._getValueByPath(field.metadataPath) : field.value || '';
        // 应用格式化函数(如果有)
        if (value !== undefined && field.formatter && _this.formatters[field.formatter]) {
          value = _this.formatters[field.formatter](value);
        }
        valueElement.textContent = value !== undefined ? String(value) : '';
        fieldElement.appendChild(valueElement);
        // 应用自定义样式
        if (field.style) {
          Object.assign(fieldElement.style, field.style);
        }
        // 根据位置添加到左侧或右侧
        if (field.position === 'right') {
          rightFields_1.appendChild(fieldElement);
        } else {
          leftFields_1.appendChild(fieldElement);
        }
      });
      fieldsContainer.appendChild(leftFields_1);
      fieldsContainer.appendChild(rightFields_1);
      headerElement.appendChild(fieldsContainer);
    }
    return headerElement;
  };
  /**
   * 创建表尾
   * @param footerConfig 表尾配置
   * @returns 表尾元素
   */
  DDR.prototype._createFooter = function (footerConfig) {
    var _this = this;
    if (!footerConfig) return null;
    var footerElement = document.createElement('div');
    footerElement.className = 'ddr-report-footer';
    // 改为最小高度而不是固定高度，允许内容增加时自动扩展
    footerElement.style.minHeight = "".concat(footerConfig.height || 100, "px");
    // 如果需要固定在底部
    if (footerConfig.fixed) {
      footerElement.classList.add('ddr-footer-fixed');
    }
    // 渲染汇总行
    if (footerConfig.summary && footerConfig.summary.length > 0) {
      var summaryElement_1 = document.createElement('div');
      summaryElement_1.className = 'ddr-footer-summary';
      footerConfig.summary.forEach(function (summaryConfig) {
        var summaryItem = document.createElement('div');
        summaryItem.className = 'ddr-summary-item';
        var labelElement = document.createElement('span');
        labelElement.className = 'ddr-summary-label';
        labelElement.textContent = "".concat(summaryConfig.column, "\u5408\u8BA1:");
        var valueElement = document.createElement('span');
        valueElement.className = 'ddr-summary-value';
        // 获取汇总值，优先使用元数据中的预计算值
        var summaryValue;
        if (summaryConfig.metadataPath) {
          summaryValue = _this._getValueByPath(summaryConfig.metadataPath);
        } else {
          // 前端计算汇总值
          summaryValue = _this._calculateSummary(_this.data, summaryConfig);
        }
        // 应用格式化函数(如果有)
        if (summaryConfig.formatter && _this.formatters[summaryConfig.formatter]) {
          summaryValue = _this.formatters[summaryConfig.formatter](summaryValue);
        }
        valueElement.textContent = summaryValue !== undefined ? String(summaryValue) : '';
        summaryItem.appendChild(labelElement);
        summaryItem.appendChild(valueElement);
        summaryElement_1.appendChild(summaryItem);
      });
      footerElement.appendChild(summaryElement_1);
    }
    // 渲染字段
    if (footerConfig.fields && footerConfig.fields.length > 0) {
      var fieldsContainer_1 = document.createElement('div');
      fieldsContainer_1.className = 'ddr-footer-fields';
      footerConfig.fields.forEach(function (field) {
        var fieldElement = document.createElement('div');
        fieldElement.className = "ddr-footer-field ddr-align-".concat(field.position || 'left');
        // 创建标签
        var labelElement = document.createElement('span');
        labelElement.className = 'ddr-field-label';
        labelElement.textContent = field.label || '';
        fieldElement.appendChild(labelElement);
        // 创建值
        var valueElement = document.createElement('span');
        valueElement.className = 'ddr-field-value';
        // 优先从元数据获取值
        var value = field.metadataPath ? _this._getValueByPath(field.metadataPath) : field.value || '';
        // 应用格式化函数(如果有)
        if (value !== undefined && field.formatter && _this.formatters[field.formatter]) {
          value = _this.formatters[field.formatter](value);
        }
        valueElement.textContent = value !== undefined ? String(value) : '';
        fieldElement.appendChild(valueElement);
        // 应用自定义样式
        if (field.style) {
          Object.assign(fieldElement.style, field.style);
        }
        fieldsContainer_1.appendChild(fieldElement);
      });
      footerElement.appendChild(fieldsContainer_1);
    }
    // 渲染签名区域
    if (footerConfig.signatures && footerConfig.signatures.length > 0) {
      var signaturesElement_1 = document.createElement('div');
      signaturesElement_1.className = 'ddr-footer-signatures';
      footerConfig.signatures.forEach(function (signature) {
        var signatureItem = document.createElement('div');
        signatureItem.className = 'ddr-signature-item';
        // 签名标签
        var labelElement = document.createElement('div');
        labelElement.className = 'ddr-signature-label';
        labelElement.textContent = signature.label || '';
        signatureItem.appendChild(labelElement);
        // 签名人
        var nameElement = document.createElement('div');
        nameElement.className = 'ddr-signature-name';
        // 优先从元数据获取签名人
        var name = signature.metadataPath ? _this._getValueByPath(signature.metadataPath) : signature.name || '';
        nameElement.textContent = name || '';
        signatureItem.appendChild(nameElement);
        // 日期
        if (signature.showTimestamp) {
          var dateElement = document.createElement('div');
          dateElement.className = 'ddr-signature-date';
          // 获取时间戳
          var timestamp = signature.dateMetadataPath ? _this._getValueByPath(signature.dateMetadataPath) : null;
          if (timestamp) {
            dateElement.textContent = new Date(timestamp).toLocaleDateString();
          }
          signatureItem.appendChild(dateElement);
        }
        if (signature.width) {
          signatureItem.style.width = "".concat(signature.width, "px");
        }
        signaturesElement_1.appendChild(signatureItem);
      });
      footerElement.appendChild(signaturesElement_1);
    }
    // 渲染注释
    if (footerConfig.notes) {
      var notesElement = document.createElement('div');
      notesElement.className = 'ddr-footer-notes';
      notesElement.textContent = footerConfig.notes;
      footerElement.appendChild(notesElement);
    }
    // 渲染页码信息
    if (footerConfig.pageInfo && this.pagination) {
      var pageElement = document.createElement('div');
      pageElement.className = "ddr-footer-page ddr-align-".concat(footerConfig.pageInfo.position || 'right');
      // 格式化页码
      var pageText = footerConfig.pageInfo.format.replace('{current}', String(this.pagination.pageNumber || 1)).replace('{total}', String(this.pagination.totalPages || 1));
      pageElement.textContent = pageText;
      footerElement.appendChild(pageElement);
    }
    return footerElement;
  };
  /**
   * 计算汇总值
   * @param data 数据数组
   * @param summary 汇总配置
   * @returns 汇总值
   */
  DDR.prototype._calculateSummary = function (data, summary) {
    if (!data.length) return 0;
    var values = data.map(function (item) {
      var value = item[summary.column];
      return typeof value === 'number' ? value : 0;
    });
    switch (summary.type) {
      case 'sum':
        return values.reduce(function (sum, val) {
          return sum + val;
        }, 0);
      case 'avg':
        return values.reduce(function (sum, val) {
          return sum + val;
        }, 0) / values.length;
      case 'count':
        return values.length;
      default:
        return 0;
    }
  };
  /**
   * 确定渲染模式
   * @returns 渲染模式 'dom' 或 'canvas'
   */
  DDR.prototype._determineRenderMode = function () {
    // 如果用户指定了渲染模式
    if (this.options.mode === 'dom' || this.options.mode === 'canvas') {
      return this.options.mode;
    }
    // 根据数据量自动选择
    if (this.data.length > 5000) {
      return 'canvas';
    }
    return 'dom';
  };
  /**
  * DOM模式渲染
  * @param container 容器元素
  */
  DDR.prototype._renderDOM = function (container) {
    var _a;
    // 创建表格容器
    var tableContainer = document.createElement('div');
    tableContainer.className = 'ddr-table-container'; // 检查是否有报表头部，如果有，确保表格容器有正确的top值
    var headerElement = container.querySelector('.ddr-report-header');
    if (headerElement) {
      // 使用ResizeObserver监听表头实际高度变化
      if (window.ResizeObserver) {
        var resizeObserver = new ResizeObserver(function (entries) {
          for (var _i = 0, entries_2 = entries; _i < entries_2.length; _i++) {
            var entry = entries_2[_i];
            if (entry.target === headerElement) {
              var contentRect = entry.contentRect;
              var headerHeight = contentRect.height;
              // 更新CSS变量
              container.style.setProperty('--header-height', "".concat(headerHeight, "px"));
              container.style.setProperty('--table-offset-top', "".concat(headerHeight, "px"));
              // 确保表格容器有足够的间距
              tableContainer.style.marginTop = '20px';
            }
          }
        });
        resizeObserver.observe(headerElement);
      } else {
        // 兼容性方案：使用getBoundingClientRect和resize事件监听
        var updateHeaderSize = function () {
          var headerHeight = headerElement.getBoundingClientRect().height;
          container.style.setProperty('--header-height', "".concat(headerHeight, "px"));
          container.style.setProperty('--table-offset-top', "".concat(headerHeight, "px"));
          tableContainer.style.marginTop = '20px';
        };
        updateHeaderSize(); // 立即执行一次
        window.addEventListener('resize', updateHeaderSize);
      }
    }
    var tableWrapper = document.createElement('div');
    tableWrapper.className = 'ddr-table-wrapper';
    var table = document.createElement('table');
    table.className = 'ddr-table';
    // 应用表格样式
    if (this.config.layout) {
      if (this.config.layout.stripe) {
        table.classList.add('ddr-table-stripe');
      }
      if (this.config.layout.hover) {
        table.classList.add('ddr-table-hover');
      }
    }
    // 创建表头
    var thead = this._createTableHeader(this.config.columns);
    table.appendChild(thead);
    // 创建表体
    var tbody = this._createTableBody(this.config.columns, this.data);
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    tableContainer.appendChild(tableWrapper);
    container.appendChild(tableContainer);
    // 如果需要分页
    if (((_a = this.config.features) === null || _a === void 0 ? void 0 : _a.pagination) && this.pagination) {
      var paginationElement = this._createPagination(this.pagination);
      container.appendChild(paginationElement);
    }
    // 在渲染完表格后，单独处理页脚添加
    if (this.config.footer) {
      var footer = this._createFooter(this.config.footer);
      if (footer) {
        // 确保页脚在表格容器之后添加，而不是包装在ddr-table-container内部
        container.appendChild(footer);
      }
    }
  };
  /**
   * Canvas模式渲染(大数据量)
   * @param container 容器元素
   */
  DDR.prototype._renderCanvas = function (container) {
    // 对于实际项目，可能需要引入专门的Canvas渲染库
    // 这里简化处理，仅显示一个提示信息
    var placeholder = document.createElement('div');
    placeholder.className = 'ddr-canvas-placeholder';
    placeholder.textContent = "\u4F7F\u7528Canvas\u6A21\u5F0F\u6E32\u67D3".concat(this.data.length, "\u884C\u6570\u636E");
    container.appendChild(placeholder);
    console.log('实际项目中需要实现Canvas渲染引擎');
    // 在实际应用中，这里会引入Canvas渲染引擎
    // 例如: await import('../core/render-engine/canvas-renderer')
  };
  /**
   * 创建表头
   * @param columns 列配置
   * @returns 表头元素
   */
  DDR.prototype._createTableHeader = function (columns) {
    var thead = document.createElement('thead');
    thead.className = 'ddr-thead';
    // 处理嵌套表头的情况
    var rowCount = this._calculateHeaderRowCount(columns);
    var rows = Array(rowCount).fill(null).map(function () {
      var tr = document.createElement('tr');
      tr.className = 'ddr-header-row';
      return tr;
    });
    // 填充表头单元格
    this._fillHeaderCells(columns, rows, 0, 0);
    // 将行添加到表头
    rows.forEach(function (row) {
      thead.appendChild(row);
    });
    return thead;
  };
  /**
   * 计算表头行数
   * @param columns 列配置
   * @returns 行数
   */
  DDR.prototype._calculateHeaderRowCount = function (columns) {
    var maxDepth = 1;
    var traverse = function (cols, currentDepth) {
      if (currentDepth === void 0) {
        currentDepth = 1;
      }
      cols.forEach(function (col) {
        if (col.children && col.children.length) {
          maxDepth = Math.max(maxDepth, currentDepth + 1);
          traverse(col.children, currentDepth + 1);
        }
      });
    };
    traverse(columns);
    return maxDepth;
  };
  /**
   * 填充表头单元格
   * @param columns 列配置
   * @param rows 行元素数组
   * @param rowIndex 当前行索引
   * @param colIndex 当前列索引
   * @returns 占用的列数
   */
  DDR.prototype._fillHeaderCells = function (columns, rows, rowIndex, colIndex) {
    var _this = this;
    var currentColIndex = colIndex;
    columns.forEach(function (column) {
      var cell = document.createElement('th');
      cell.className = 'ddr-header-cell';
      cell.textContent = column.title;
      // 设置单元格样式
      if (column.align) {
        cell.style.textAlign = column.align;
      }
      if (column.width) {
        cell.style.width = typeof column.width === 'number' ? "".concat(column.width, "px") : column.width;
      }
      // 如果有子列，则设置colspan和rowspan
      if (column.children && column.children.length) {
        var childColSpan = _this._fillHeaderCells(column.children, rows, rowIndex + 1, currentColIndex);
        cell.colSpan = childColSpan;
        cell.rowSpan = 1;
        currentColIndex += childColSpan;
      } else {
        cell.colSpan = 1;
        cell.rowSpan = rows.length - rowIndex;
        currentColIndex += 1;
      }
      rows[rowIndex].appendChild(cell);
    });
    return currentColIndex - colIndex;
  };
  /**
   * 创建表体
   * @param columns 列配置
   * @param data 数据数组
   * @returns 表体元素
   */
  DDR.prototype._createTableBody = function (columns, data) {
    var _this = this;
    var _a;
    var tbody = document.createElement('tbody');
    tbody.className = 'ddr-tbody';
    // 获取扁平化的列
    var flatColumns = this._getFlatColumns(columns);
    // 记录需要合并的单元格
    var merges = new Map();
    // 如果没有数据，显示空表格提示
    if (!data.length) {
      var emptyRow = document.createElement('tr');
      emptyRow.className = 'ddr-empty-row';
      var emptyCell = document.createElement('td');
      emptyCell.className = 'ddr-empty-cell';
      emptyCell.colSpan = flatColumns.length;
      emptyCell.textContent = ((_a = this.config.features) === null || _a === void 0 ? void 0 : _a.emptyText) || '暂无数据';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return tbody;
    }
    // 创建行
    data.forEach(function (rowData, rowIndex) {
      var _a;
      var row = document.createElement('tr');
      row.className = 'ddr-body-row';
      row.setAttribute('data-index', String(rowIndex));
      // 应用配置的行高
      if ((_a = _this.config.layout) === null || _a === void 0 ? void 0 : _a.rowHeight) {
        row.style.height = typeof _this.config.layout.rowHeight === 'number' ? "".concat(_this.config.layout.rowHeight, "px") : _this.config.layout.rowHeight;
      }
      // 创建单元格
      var colIndex = 0;
      flatColumns.forEach(function (column) {
        var _a, _b;
        // 跳过隐藏列
        if (column.visible === false) {
          return;
        }
        // 检查是否已经被合并跳过
        var cellKey = "".concat(rowIndex, "-").concat(colIndex);
        if (merges.has(cellKey) && ((_a = merges.get(cellKey)) === null || _a === void 0 ? void 0 : _a.rowSpan) === 0) {
          colIndex++;
          return;
        }
        var cell = document.createElement('td');
        cell.className = 'ddr-body-cell';
        // 获取单元格值
        var value = rowData[column.key];
        // 应用格式化函数
        if (column.formatter) {
          if (typeof column.formatter === 'string' && _this.formatters[column.formatter]) {
            value = _this.formatters[column.formatter](value);
          } else if (typeof column.formatter === 'object') {
            var formatterFunc = _this.formatters[column.formatter.type];
            if (formatterFunc) {
              value = formatterFunc(value, column.formatter.params);
            }
          }
        }
        // 设置单元格内容
        cell.textContent = value !== undefined && value !== null ? String(value) : '';
        // 设置单元格样式
        if (column.align) {
          cell.style.textAlign = column.align;
        }
        // 处理单元格合并
        if (column.merge === 'vertical' || column.merge === true) {
          _this._handleCellMerge(cell, rowData, column, rowIndex, colIndex, data, merges);
        }
        // 应用条件样式
        if ((_b = column.style) === null || _b === void 0 ? void 0 : _b.conditional) {
          column.style.conditional.forEach(function (condition) {
            // 简单条件表达式解析
            // 实际项目中可能需要更复杂的表达式解析
            var valueToCheck = rowData[column.key];
            try {
              var result = _this._evaluateCondition(condition.when, {
                value: valueToCheck,
                row: rowData
              });
              if (result) {
                Object.assign(cell.style, condition.style);
              }
            } catch (e) {
              console.error('条件解析错误:', e);
            }
          });
        }
        row.appendChild(cell);
        colIndex++;
      });
      tbody.appendChild(row);
    });
    return tbody;
  };
  /**
   * 处理单元格合并
   */
  DDR.prototype._handleCellMerge = function (td, rowData, column, rowIndex, colIndex, data, merges) {
    console.log("\uD83D\uDD04 \u5904\u7406\u5217 \"".concat(column.key, "\" \u7684\u5408\u5E76\uFF0C\u5F53\u524D\u884C ").concat(rowIndex, "\uFF0C\u503C: \"").concat(rowData[column.key], "\""));
    var currentValue = rowData[column.key];
    var rowSpan = 1;
    // 向下查找相同值的连续单元格
    for (var i = rowIndex + 1; i < data.length; i++) {
      var nextValue = data[i][column.key];
      if (nextValue === currentValue) {
        rowSpan++;
        // 标记被合并的单元格，后面遇到时跳过
        var skipKey = "".concat(i, "-").concat(colIndex);
        merges.set(skipKey, {
          rowSpan: 0,
          colSpan: 0
        });
        console.log("  \u2705 \u627E\u5230\u76F8\u540C\u503C\uFF0C\u884C ".concat(i, "\uFF0C\u503C: \"").concat(nextValue, "\"\uFF0CrowSpan: ").concat(rowSpan));
      } else {
        console.log("  \u274C \u503C\u4E0D\u540C\uFF0C\u884C ".concat(i, "\uFF0C\u503C: \"").concat(nextValue, "\" !== \"").concat(currentValue, "\"\uFF0C\u505C\u6B62\u5408\u5E76"));
        break;
      }
    }
    if (rowSpan > 1) {
      td.rowSpan = rowSpan;
      console.log("\uD83C\uDFAF \u5217 \"".concat(column.key, "\" \u7B2C ").concat(rowIndex, " \u884C\u8BBE\u7F6E rowSpan = ").concat(rowSpan));
    } else {
      console.log("\uD83D\uDCDD \u5217 \"".concat(column.key, "\" \u7B2C ").concat(rowIndex, " \u884C\u65E0\u9700\u5408\u5E76"));
    }
  };
  /**
   * 评估条件表达式
   * @param condition 条件表达式
   * @param context 上下文对象
   * @returns 条件结果
   */
  DDR.prototype._evaluateCondition = function (condition, context) {
    // 简化版条件表达式解析
    // 实际项目中可能需要更复杂的表达式解析
    try {
      // 简单替换，支持value和row变量
      var expression_1 = condition;
      // 替换 value 变量
      expression_1 = expression_1.replace(/value/g, JSON.stringify(context.value));
      // 替换 row.xxx 变量
      var rowVarMatches = expression_1.match(/row\.\w+/g);
      if (rowVarMatches) {
        rowVarMatches.forEach(function (match) {
          var prop = match.split('.')[1];
          expression_1 = expression_1.replace(match, JSON.stringify(context.row[prop]));
        });
      }
      // 使用Function构造函数执行表达式
      // 注意：这种方式在实际项目中可能存在安全风险
      return new Function("return ".concat(expression_1))();
    } catch (e) {
      console.error('条件解析错误:', e, condition);
      return false;
    }
  };
  /**
   * 获取扁平化的列配置
   * @param columns 列配置
   * @returns 扁平化后的列配置
   */
  DDR.prototype._getFlatColumns = function (columns) {
    var result = [];
    var flatten = function (cols) {
      cols.forEach(function (col) {
        if (col.children && col.children.length) {
          flatten(col.children);
        } else {
          result.push(col);
        }
      });
    };
    flatten(columns);
    return result;
  };
  /**
   * 创建分页组件
   * @param pagination 分页信息
   * @returns 分页元素
   */
  DDR.prototype._createPagination = function (pagination) {
    var _this = this;
    var paginationElement = document.createElement('div');
    paginationElement.className = 'ddr-pagination';
    var pageInfo = document.createElement('span');
    pageInfo.className = 'ddr-pagination-info';
    pageInfo.textContent = "\u7B2C".concat(pagination.pageNumber || 1, "\u9875/\u5171").concat(pagination.totalPages || 1, "\u9875");
    paginationElement.appendChild(pageInfo);
    // 上一页按钮
    var prevBtn = document.createElement('button');
    prevBtn.className = 'ddr-pagination-prev';
    prevBtn.textContent = '上一页';
    prevBtn.disabled = (pagination.pageNumber || 1) <= 1;
    prevBtn.onclick = function () {
      _this.reload(__assign(__assign({}, _this.filters), {
        pageNumber: (pagination.pageNumber || 1) - 1
      }));
    };
    paginationElement.appendChild(prevBtn);
    // 页码按钮
    var totalPages = pagination.totalPages || 1;
    var currentPage = pagination.pageNumber || 1;
    // 简单分页逻辑
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    // 调整startPage
    startPage = Math.max(1, endPage - 4);
    var _loop_1 = function (i) {
      var pageBtn = document.createElement('button');
      pageBtn.className = "ddr-pagination-page".concat(i === currentPage ? ' active' : '');
      pageBtn.textContent = String(i);
      pageBtn.onclick = function () {
        if (i !== currentPage) {
          _this.reload(__assign(__assign({}, _this.filters), {
            pageNumber: i
          }));
        }
      };
      paginationElement.appendChild(pageBtn);
    };
    for (var i = startPage; i <= endPage; i++) {
      _loop_1(i);
    }
    // 下一页按钮
    var nextBtn = document.createElement('button');
    nextBtn.className = 'ddr-pagination-next';
    nextBtn.textContent = '下一页';
    nextBtn.disabled = (pagination.pageNumber || 1) >= (pagination.totalPages || 1);
    nextBtn.onclick = function () {
      _this.reload(__assign(__assign({}, _this.filters), {
        pageNumber: (pagination.pageNumber || 1) + 1
      }));
    };
    paginationElement.appendChild(nextBtn);
    // 每页条数选择
    var sizeSelect = document.createElement('select');
    sizeSelect.className = 'ddr-pagination-size';
    [10, 20, 50, 100].forEach(function (size) {
      var option = document.createElement('option');
      option.value = String(size);
      option.textContent = "".concat(size, "\u6761/\u9875");
      option.selected = size === (pagination.pageSize || 20);
      sizeSelect.appendChild(option);
    });
    sizeSelect.onchange = function (e) {
      var pageSize = Number(e.target.value);
      _this.reload(__assign(__assign({}, _this.filters), {
        pageSize: pageSize,
        pageNumber: 1
      }));
    };
    paginationElement.appendChild(sizeSelect);
    return paginationElement;
  };
  /**
  * 添加水印
  * @param container 容器元素
  * @param text 水印文本
  */
  DDR.prototype._addWatermark = function (container, text) {
    var _this = this;
    // 移除现有水印
    var existingWatermark = container.querySelector('.ddr-watermark');
    if (existingWatermark) {
      container.removeChild(existingWatermark);
    }
    var watermark = document.createElement('div');
    watermark.className = 'ddr-watermark';
    // 确保水印始终可见
    watermark.style.zIndex = '10';
    // 处理动态替换
    if (text.includes('${')) {
      text = text.replace(/\${([^}]+)}/g, function (match, key) {
        return String(_this._getValueByPath(key) || match);
      });
    }
    // 计算需要创建多少行和列的水印
    var rows = 5;
    var cols = 4;
    // 创建水印网格
    for (var i = 0; i < rows * cols; i++) {
      var content = document.createElement('div');
      content.className = 'ddr-watermark-content';
      content.textContent = text;
      // 增加不透明度，提高可见性
      content.style.opacity = '0.2';
      content.style.color = 'rgba(0, 0, 0, 0.25)';
      content.style.fontSize = '18px';
      watermark.appendChild(content);
    }
    // 设置水印层的位置并防止水印被篡改
    Object.defineProperty(watermark.style, 'pointerEvents', {
      value: 'none',
      writable: false
    });
    container.appendChild(watermark);
    // 增强版：防止水印被删除或修改的监视器
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // 检查水印是否被移除
        if (mutation.type === 'childList' && Array.from(mutation.removedNodes).some(function (node) {
          return node === watermark || node instanceof Element && node.querySelector('.ddr-watermark');
        })) {
          if (!container.contains(watermark)) {
            // 如果水印被移除，重新添加它
            var newWatermark_1 = watermark.cloneNode(true);
            setTimeout(function () {
              return container.appendChild(newWatermark_1);
            }, 100);
          }
        }
        // 检查水印样式是否被修改
        if (mutation.type === 'attributes' && mutation.target === watermark && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          // 恢复水印样式
          watermark.className = 'ddr-watermark';
          watermark.style.zIndex = '10';
          watermark.style.opacity = '0.8';
        }
      });
    });
    // 监视子元素变化和属性变化
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  };
  /**
   * 准备导出数据
   * @param options 导出选项
   * @returns 导出数据
   */
  DDR.prototype._prepareExportData = function (options) {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    // 获取扁平化的列
    var flatColumns = this._getFlatColumns(this.config.columns);
    // 过滤隐藏列
    var visibleColumns = flatColumns.filter(function (col) {
      return col.visible !== false && ((options === null || options === void 0 ? void 0 : options.includeHidden) || col.visible !== false);
    });
    // 准备表头
    var result = [];
    // 添加表头信息(如果需要)
    if ((options === null || options === void 0 ? void 0 : options.includeHeader) !== false && ((_a = this.config.header) === null || _a === void 0 ? void 0 : _a.showOnExport) !== false) {
      if ((_b = this.config.header) === null || _b === void 0 ? void 0 : _b.title) {
        var titleText = typeof this.config.header.title === 'string' ? this.config.header.title : this.config.header.title.text;
        result.push([titleText]);
        result.push([]); // 空行
      }
      if ((_d = (_c = this.config.header) === null || _c === void 0 ? void 0 : _c.fields) === null || _d === void 0 ? void 0 : _d.length) {
        this.config.header.fields.forEach(function (field) {
          var value = field.metadataPath ? _this._getValueByPath(field.metadataPath) : field.value || '';
          result.push(["".concat(field.label || ''), value]);
        });
        result.push([]); // 空行
      }
    }
    // 添加表格标题行
    var headers = visibleColumns.map(function (col) {
      return col.title;
    });
    result.push(headers);
    // 添加数据行
    this.data.forEach(function (rowData) {
      var row = visibleColumns.map(function (column) {
        var value = rowData[column.key];
        // 应用格式化函数
        if (column.formatter) {
          if (typeof column.formatter === 'string' && _this.formatters[column.formatter]) {
            value = _this.formatters[column.formatter](value);
          } else if (typeof column.formatter === 'object') {
            var formatterFunc = _this.formatters[column.formatter.type];
            if (formatterFunc) {
              value = formatterFunc(value, column.formatter.params);
            }
          }
        }
        return value;
      });
      result.push(row);
    });
    // 添加表尾信息(如果需要)
    if ((options === null || options === void 0 ? void 0 : options.includeFooter) !== false && ((_e = this.config.footer) === null || _e === void 0 ? void 0 : _e.showOnExport) !== false) {
      result.push([]); // 空行
      // 添加汇总信息
      if ((_g = (_f = this.config.footer) === null || _f === void 0 ? void 0 : _f.summary) === null || _g === void 0 ? void 0 : _g.length) {
        this.config.footer.summary.forEach(function (sum) {
          var summaryValue;
          if (sum.metadataPath) {
            summaryValue = _this._getValueByPath(sum.metadataPath);
          } else {
            summaryValue = _this._calculateSummary(_this.data, sum);
          }
          if (sum.formatter && _this.formatters[sum.formatter]) {
            summaryValue = _this.formatters[sum.formatter](summaryValue);
          }
          result.push(["".concat(sum.column, "\u5408\u8BA1:"), summaryValue]);
        });
        result.push([]); // 空行
      }
      // 添加表尾字段
      if ((_j = (_h = this.config.footer) === null || _h === void 0 ? void 0 : _h.fields) === null || _j === void 0 ? void 0 : _j.length) {
        this.config.footer.fields.forEach(function (field) {
          var value = field.metadataPath ? _this._getValueByPath(field.metadataPath) : field.value || '';
          result.push([field.label || '', value]);
        });
      }
      // 添加签名信息
      if ((_l = (_k = this.config.footer) === null || _k === void 0 ? void 0 : _k.signatures) === null || _l === void 0 ? void 0 : _l.length) {
        var signatureRow_1 = [];
        this.config.footer.signatures.forEach(function (signature) {
          signatureRow_1.push(signature.label || '');
          var name = signature.metadataPath ? _this._getValueByPath(signature.metadataPath) : signature.name || '';
          signatureRow_1.push(name);
        });
        result.push(signatureRow_1);
      }
      // 添加注释
      if ((_m = this.config.footer) === null || _m === void 0 ? void 0 : _m.notes) {
        result.push([this.config.footer.notes]);
      }
    }
    return result;
  };
  /**
   * 触发事件
   * @param event 事件名称
   * @param data 事件数据
   */
  DDR.prototype._emitEvent = function (event, data) {
    if (this.eventListeners.has(event)) {
      var callbacks = this.eventListeners.get(event);
      callbacks.forEach(function (callback) {
        try {
          callback(data);
        } catch (error) {
          console.error("\u4E8B\u4EF6".concat(event, "\u5904\u7406\u9519\u8BEF:"), error);
        }
      });
    }
  };
  // 全局格式化函数
  DDR.globalFormatters = {
    // 内置格式化函数
    date: function (value) {
      var date = new Date(value);
      return date.toLocaleDateString();
    },
    currency: function (value, params) {
      var _a = params || {},
        _b = _a.currency,
        currency = _b === void 0 ? 'CNY' : _b,
        _c = _a.locale,
        locale = _c === void 0 ? 'zh-CN' : _c;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    },
    number: function (value, params) {
      var _a = params || {},
        _b = _a.precision,
        precision = _b === void 0 ? 2 : _b,
        _c = _a.thousandSeparator,
        thousandSeparator = _c === void 0 ? true : _c;
      var options = {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
        useGrouping: thousandSeparator
      };
      return new Intl.NumberFormat(undefined, options).format(value);
    },
    percentage: function (value, params) {
      var _a = (params || {}).precision,
        precision = _a === void 0 ? 2 : _a;
      return new Intl.NumberFormat(undefined, {
        style: 'percent',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(value);
    }
  };
  return DDR;
}();

/**
 * React组件封装
 * 允许在React项目中以组件形式使用DDR报表
 */
var DDRReport = forwardRef(function (_a, ref) {
  var className = _a.className,
    style = _a.style,
    config = _a.config,
    theme = _a.theme,
    mode = _a.mode,
    lang = _a.lang,
    metadata = _a.metadata,
    onDataLoaded = _a.onDataLoaded,
    onRenderComplete = _a.onRenderComplete,
    onError = _a.onError,
    rest = __rest(_a, ["className", "style", "config", "theme", "mode", "lang", "metadata", "onDataLoaded", "onRenderComplete", "onError"]);
  var containerRef = useRef(null);
  var _b = useState(null),
    instance = _b[0],
    setInstance = _b[1];
  // 暴露方法给父组件
  useImperativeHandle(ref, function () {
    return {
      exportTo: function (type, options) {
        return __awaiter(void 0, void 0, void 0, function () {
          return __generator(this, function (_a) {
            if (instance) {
              return [2 /*return*/, instance.exportTo(type, options)];
            }
            throw new Error('DDR实例未初始化');
          });
        });
      },
      print: function () {
        if (instance) {
          instance.print();
        } else {
          throw new Error('DDR实例未初始化');
        }
      },
      reload: function (params) {
        return __awaiter(void 0, void 0, void 0, function () {
          return __generator(this, function (_a) {
            if (instance) {
              return [2 /*return*/, instance.reload(params)];
            }
            throw new Error('DDR实例未初始化');
          });
        });
      },
      getInstance: function () {
        return instance;
      }
    };
  }, [instance]);
  // 初始化DDR实例
  useEffect(function () {
    if (containerRef.current) {
      try {
        // 创建DDR实例
        var ddrInstance_1 = DDR.create(__assign({
          container: containerRef.current,
          config: config,
          theme: theme,
          mode: mode,
          lang: lang,
          metadata: metadata,
          onError: function (error) {
            if (onError) {
              onError(error);
            }
          }
        }, rest));
        // 注册事件处理器
        if (onDataLoaded) {
          ddrInstance_1.on('data-loaded', function (_a) {
            var data = _a.data;
            onDataLoaded(data);
          });
        }
        if (onRenderComplete) {
          ddrInstance_1.on('render-complete', function () {
            onRenderComplete();
          });
        }
        setInstance(ddrInstance_1);
        // 清理函数
        return function () {
          ddrInstance_1.destroy();
        };
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    }
    // 确保总是返回一个清理函数
    return function () {
      // 空清理函数，避免TS7030警告
    };
  }, [config]); // 仅在config改变时重新初始化
  // 处理其他属性变更
  useEffect(function () {
    // 如果实例已存在并且主题变更，应用新主题
    if (instance && theme && containerRef.current) {
      // 移除所有主题类名
      containerRef.current.classList.forEach(function (className) {
        var _a;
        if (className.startsWith('ddr-theme-')) {
          (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.classList.remove(className);
        }
      });
      // 添加新主题类名
      containerRef.current.classList.add("ddr-theme-".concat(theme));
    }
  }, [theme, instance]);
  // 处理元数据更新
  useEffect(function () {
    if (instance && metadata) {
      instance.updateMetadata(metadata);
    }
  }, [metadata, instance]);
  // 使用React.createElement替代JSX语法，防止TypeScript编译问题
  return React.createElement('div', {
    ref: containerRef,
    className: "ddr-react-container ".concat(className || ''),
    style: __assign({
      width: '100%',
      height: '100%',
      position: 'relative'
    }, style || {})
  });
});

/**
 * 修复PDF导出异常的补丁文件
 * 导入到主项目中以解决PDF导出的问题
 */
// 修复PDF导出时的分页问题
function fixPDFExport() {
  try {
    console.log('PDF导出修复已应用 (使用内置jsPDF)');
    // 由于jsPDF现在是通过ES模块导入的，修复逻辑已经简化
    // 主要的修复已经在主导出逻辑中处理
    console.log('PDF导出修复已成功应用');
  } catch (e) {
    console.warn('应用PDF修复时发生错误:', e);
  }
}
// 导出中文支持的辅助函数
function setupChineseSupport(pdf) {
  try {
    // 设置默认字体
    pdf.setFont('helvetica');
    // 优化中文处理
    var encodingFallback_1 = function (text) {
      try {
        // 简单替换一些中文标点符号为英文标点
        return text.replace(/：/g, ':').replace(/，/g, ',').replace(/。/g, '.').replace(/（/g, '(').replace(/）/g, ')').replace(/；/g, ';');
      } catch (e) {
        return text;
      }
    };
    // 保存原始的text方法
    var originalText_1 = pdf.text;
    // 覆盖text方法，添加中文处理
    pdf.text = function (text, x, y, options) {
      try {
        // 尝试使用原始方法
        return originalText_1.call(this, encodingFallback_1(text), x, y, options);
      } catch (e) {
        console.warn('文字渲染失败:', e);
        // 如果失败，尝试直接渲染ASCII字符
        var asciiOnly = text.replace(/[^\x00-\x7F]/g, '?');
        return originalText_1.call(this, asciiOnly, x, y, options);
      }
    };
    return pdf;
  } catch (e) {
    console.warn('中文支持设置失败:', e);
    return pdf;
  }
}

/**
 * 修复Excel导出样式问题
 */
// 定义Excel样式辅助函数
function applyExcelStyles(ws, data) {
  // 定义通用样式
  var styles = {
    header: {
      font: {
        bold: true,
        sz: 12,
        color: {
          rgb: "FFFFFF"
        }
      },
      fill: {
        fgColor: {
          rgb: "4472C4"
        }
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true
      },
      border: {
        top: {
          style: 'medium',
          color: {
            rgb: '366092'
          }
        },
        right: {
          style: 'thin',
          color: {
            rgb: '366092'
          }
        },
        bottom: {
          style: 'medium',
          color: {
            rgb: '366092'
          }
        },
        left: {
          style: 'thin',
          color: {
            rgb: '366092'
          }
        }
      }
    },
    title: {
      font: {
        bold: true,
        sz: 18,
        color: {
          rgb: "000000"
        }
      },
      alignment: {
        horizontal: "center",
        vertical: "center"
      },
      border: {
        top: {
          style: 'thin',
          color: {
            rgb: 'CCCCCC'
          }
        },
        bottom: {
          style: 'thin',
          color: {
            rgb: 'CCCCCC'
          }
        }
      }
    },
    metadata: {
      font: {
        sz: 11,
        color: {
          rgb: "333333"
        }
      },
      alignment: {
        horizontal: "left",
        vertical: "center"
      },
      border: {
        top: {
          style: 'thin',
          color: {
            rgb: 'EEEEEE'
          }
        },
        right: {
          style: 'thin',
          color: {
            rgb: 'EEEEEE'
          }
        },
        bottom: {
          style: 'thin',
          color: {
            rgb: 'EEEEEE'
          }
        },
        left: {
          style: 'thin',
          color: {
            rgb: 'EEEEEE'
          }
        }
      }
    },
    cell: {
      font: {
        sz: 11,
        color: {
          rgb: "333333"
        }
      },
      alignment: {
        vertical: "center",
        wrapText: true
      },
      border: {
        top: {
          style: 'thin',
          color: {
            rgb: 'DDDDDD'
          }
        },
        right: {
          style: 'thin',
          color: {
            rgb: 'DDDDDD'
          }
        },
        bottom: {
          style: 'thin',
          color: {
            rgb: 'DDDDDD'
          }
        },
        left: {
          style: 'thin',
          color: {
            rgb: 'DDDDDD'
          }
        }
      }
    },
    oddRow: {
      fill: {
        fgColor: {
          rgb: "E9EDF4"
        }
      }
    },
    evenRow: {
      fill: {
        fgColor: {
          rgb: "FFFFFF"
        }
      }
    },
    summary: {
      font: {
        bold: true,
        sz: 11,
        color: {
          rgb: "000000"
        }
      },
      alignment: {
        horizontal: "right",
        vertical: "center"
      },
      border: {
        top: {
          style: 'medium',
          color: {
            rgb: 'CCCCCC'
          }
        },
        bottom: {
          style: 'medium',
          color: {
            rgb: 'CCCCCC'
          }
        }
      }
    }
  };
  // 判断表格结构
  if (!data || data.length === 0) return ws;
  // 查找标题行和数据行范围
  var headerRowIndex = findHeaderRowIndex(data);
  var dataInfo = analyzeDataStructure(data, headerRowIndex);
  // 应用样式到标题区域
  if (dataInfo.titleRowIndex >= 0) {
    for (var r = 0; r <= dataInfo.titleRowIndex; r++) {
      for (var c = 0; c < (data[r] ? data[r].length : 0); c++) {
        var cellRef = XLSX.utils.encode_cell({
          r: r,
          c: c
        });
        if (!ws[cellRef]) continue;
        if (r === 0 && c === 0) {
          // 报表标题
          ws[cellRef].s = styles.title;
        } else {
          // 元数据
          ws[cellRef].s = styles.metadata;
        }
      }
    }
  }
  // 应用样式到表头
  if (headerRowIndex >= 0) {
    for (var c = 0; c < data[headerRowIndex].length; c++) {
      var cellRef = XLSX.utils.encode_cell({
        r: headerRowIndex,
        c: c
      });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = styles.header;
    }
  }
  // 应用样式到数据行
  for (var r = headerRowIndex + 1; r <= dataInfo.dataEndRowIndex; r++) {
    var isAlternateRow = (r - headerRowIndex) % 2 === 1;
    for (var c = 0; c < (data[r] ? data[r].length : 0); c++) {
      var cellRef = XLSX.utils.encode_cell({
        r: r,
        c: c
      });
      if (!ws[cellRef]) continue;
      // 检查是否是数字
      var isNumber = isNumericCell(data[r][c]);
      // 合并基础样式与行样式
      ws[cellRef].s = __assign(__assign(__assign({}, styles.cell), isAlternateRow ? styles.oddRow : styles.evenRow), {
        alignment: __assign(__assign({}, styles.cell.alignment), {
          horizontal: isNumber ? "right" : "left"
        })
      });
    }
  }
  // 应用样式到汇总行
  if (dataInfo.summaryRowIndices.length > 0) {
    for (var _i = 0, _a = dataInfo.summaryRowIndices; _i < _a.length; _i++) {
      var r = _a[_i];
      for (var c = 0; c < (data[r] ? data[r].length : 0); c++) {
        var cellRef = XLSX.utils.encode_cell({
          r: r,
          c: c
        });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = styles.summary;
      }
    }
  }
  return ws;
}
// 辅助函数：查找表头行
function findHeaderRowIndex(data) {
  // 如果数据少于3行，假设没有表头
  if (data.length < 3) return 0;
  // 通常表头行是有固定列数的一行，位于顶部附近
  for (var i = 0; i < Math.min(10, data.length - 1); i++) {
    if (data[i] && data[i + 1] && data[i].length === data[i + 1].length && data[i].length >= 3) {
      return i;
    }
  }
  // 默认返回第一行
  return 0;
}
// 辅助函数：分析数据结构
function analyzeDataStructure(data, headerRowIndex) {
  var result = {
    titleRowIndex: -1,
    dataEndRowIndex: data.length - 1,
    summaryRowIndices: []
  };
  // 查找标题行
  if (headerRowIndex > 0) {
    result.titleRowIndex = 0;
  }
  // 查找汇总行和数据结束行
  for (var r = data.length - 1; r > headerRowIndex; r--) {
    var row = data[r];
    if (!row || row.length === 0) continue;
    // 检查是否是汇总行
    var isSummaryRow = false;
    for (var c = 0; c < row.length; c++) {
      var cell = row[c];
      if (cell && typeof cell === 'string' && (cell.includes('合计') || cell.includes('总计') || cell.includes('汇总') || cell.includes('小计'))) {
        isSummaryRow = true;
        result.summaryRowIndices.push(r);
        break;
      }
    }
    // 如果不是汇总行，可能是最后一行数据
    if (!isSummaryRow && result.dataEndRowIndex === data.length - 1) {
      result.dataEndRowIndex = r;
    }
  }
  return result;
}
// 辅助函数：判断单元格是否包含数字
function isNumericCell(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    var trimmed = value.trim();
    if (trimmed === '') return false;
    // 检查是否是数字格式
    return !isNaN(Number(trimmed)) && !isNaN(parseFloat(trimmed)) && !trimmed.includes(' '); // 不包含空格
  }
  return false;
}

// 尝试导入支持样式的XLSX库
var XLSXStyle;
try {
  XLSXStyle = require('xlsx-js-style');
  console.log('使用支持样式的XLSX库');
} catch (e) {
  XLSXStyle = XLSX;
  console.log('使用标准XLSX库（样式支持有限）');
}
// 应用PDF导出修复
if (typeof window !== 'undefined') {
  setTimeout(function () {
    try {
      console.log('jsPDF库已内置到组件中');
      fixPDFExport();
    } catch (e) {
      console.warn('应用PDF导出修复失败:', e);
    }
  }, 0);
}
/**
 * 报表导出模块
 * 支持Excel和PDF格式导出
 */
var Exporter = /** @class */function () {
  function Exporter() {}
  /**
   * 导出为Excel
   * @param data 报表数据或DOM元素
   * @param options 导出选项
   */
  Exporter.toExcel = function (data, options) {
    if (options === void 0) {
      options = {};
    }
    return __awaiter(this, void 0, void 0, function () {
      var _a, fileName, _b, sheetName, _c, includeHidden, _d, styles, excelData, domElement, ws_1, wscols, _loop_1, i, sampleCells, wb, hasStyles, sampleCells_2, _i, sampleCells_1, cellRef, writeOptions, excelBuffer, blob, url, link;
      return __generator(this, function (_e) {
        try {
          _a = options.fileName, fileName = _a === void 0 ? '报表' : _a, _b = options.sheetName, sheetName = _b === void 0 ? 'Sheet1' : _b, _c = options.includeHidden, includeHidden = _c === void 0 ? false : _c, _d = options.styles, styles = _d === void 0 ? {} // 自定义样式选项
          : _d;
          excelData = void 0;
          domElement = null;
          // 判断输入类型
          if (data instanceof HTMLElement) {
            domElement = data;
            excelData = this.extractDataFromDOM(data);
          } else {
            excelData = data;
          }
          ws_1 = XLSXStyle.utils.aoa_to_sheet(excelData);
          wscols = [];
          if (excelData.length > 0) {
            _loop_1 = function (i) {
              // 计算最大宽度
              var maxWidth = 10; // 默认宽度
              excelData.forEach(function (row) {
                if (row[i] && String(row[i]).length > maxWidth) {
                  maxWidth = Math.min(50, String(row[i]).length); // 限制最大宽度
                }
              });
              wscols.push({
                wch: maxWidth
              });
            };
            for (i = 0; i < excelData[0].length; i++) {
              _loop_1(i);
            }
            ws_1['!cols'] = wscols;
          }
          // 使用增强的样式功能
          console.log('Excel导出数据结构:', {
            dataRows: excelData.length,
            hasDOMElement: !!domElement,
            firstRow: excelData[0],
            lastRow: excelData[excelData.length - 1]
          });
          // 尝试使用增强样式方法
          console.log('使用增强样式应用到Excel');
          try {
            // 直接调用增强样式方法
            this.applyEnhancedStylesToExcel(ws_1, excelData);
            console.log('增强样式应用成功');
          } catch (enhancedError) {
            console.warn('增强样式应用失败，回退到基础样式:', enhancedError);
            this.applyBasicStylesToExcel(ws_1, excelData);
          }
          sampleCells = ['A1', 'A2', 'B1', 'B2'];
          sampleCells.forEach(function (cellRef) {
            if (ws_1[cellRef]) {
              console.log("\u5355\u5143\u683C ".concat(cellRef, " \u6837\u5F0F:"), ws_1[cellRef].s);
            }
          });
          wb = XLSXStyle.utils.book_new();
          XLSXStyle.utils.book_append_sheet(wb, ws_1, sheetName);
          // 设置工作簿属性以支持样式
          if (!wb.Workbook) wb.Workbook = {};
          if (!wb.Workbook.Views) wb.Workbook.Views = [];
          wb.Workbook.Views[0] = {
            RTL: false
          };
          // 导出文件 - 使用支持样式的格式
          try {
            hasStyles = false;
            sampleCells_2 = ['A1', 'A2', 'B1'];
            for (_i = 0, sampleCells_1 = sampleCells_2; _i < sampleCells_1.length; _i++) {
              cellRef = sampleCells_1[_i];
              if (ws_1[cellRef] && ws_1[cellRef].s) {
                hasStyles = true;
                break;
              }
            }
            console.log("Excel\u5BFC\u51FA\u4FE1\u606F: \u5DE5\u4F5C\u8868\u5305\u542B".concat(Object.keys(ws_1).length, "\u4E2A\u5355\u5143\u683C, \u6837\u5F0F\u4FE1\u606F: ").concat(hasStyles ? '有' : '无'));
            // 设置工作簿属性以支持样式
            wb.Props = {
              Title: fileName,
              Subject: "报表数据",
              Author: "DDR报表组件",
              CreatedDate: new Date()
            };
            // 尝试多种导出方式以确保样式生效
            try {
              writeOptions = {
                bookType: 'xlsx',
                type: 'buffer',
                cellStyles: true,
                sheetStubs: false,
                compression: true
              };
              excelBuffer = XLSXStyle.write(wb, writeOptions);
              blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              });
              url = window.URL.createObjectURL(blob);
              link = document.createElement('a');
              link.href = url;
              link.download = "".concat(fileName, ".xlsx");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              console.log('Excel导出完成（Blob方式，支持样式）');
            } catch (blobError) {
              console.warn('Blob导出失败，尝试直接导出:', blobError);
              // 方式2：直接使用writeFile（可能样式支持更好）
              XLSXStyle.writeFile(wb, "".concat(fileName, ".xlsx"), {
                cellStyles: true,
                compression: true
              });
              console.log('Excel导出完成（直接导出方式）');
            }
          } catch (error) {
            console.error('Excel导出失败:', error);
            // 降级到基础导出
            try {
              XLSXStyle.writeFile(wb, "".concat(fileName, ".xlsx"));
              console.log('Excel导出完成（基础模式）');
            } catch (fallbackError) {
              console.error('Excel基础导出也失败:', fallbackError);
              throw fallbackError;
            }
          }
          return [2 /*return*/, Promise.resolve()];
        } catch (error) {
          return [2 /*return*/, Promise.reject(error)];
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * 从DOM元素提取数据
   * @param element DOM元素
   */
  Exporter.extractDataFromDOM = function (element) {
    var _a;
    var result = [];
    // 提取报表标题
    var titleElement = element.querySelector('.ddr-report-header .ddr-header-title');
    if (titleElement) {
      result.push([((_a = titleElement.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '']);
      result.push([]); // 空行分隔
    }
    // 提取元数据字段
    var fieldsElements = element.querySelectorAll('.ddr-header-fields .ddr-header-field');
    if (fieldsElements.length > 0) {
      var metadataRow_1 = [];
      fieldsElements.forEach(function (field) {
        var _a, _b, _c, _d;
        var label = ((_b = (_a = field.querySelector('.ddr-field-label')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
        var value = ((_d = (_c = field.querySelector('.ddr-field-value')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
        if (label && value) {
          metadataRow_1.push("".concat(label, " ").concat(value));
        }
      });
      if (metadataRow_1.length > 0) {
        result.push(metadataRow_1);
        result.push([]); // 空行分隔
      }
    }
    // 提取表格数据
    var table = element.querySelector('table');
    if (table) {
      var rows = table.querySelectorAll('tr');
      rows.forEach(function (row) {
        var cells = row.querySelectorAll('td, th');
        var rowData = [];
        cells.forEach(function (cell) {
          var _a;
          rowData.push(((_a = cell.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '');
        });
        if (rowData.length > 0) {
          result.push(rowData);
        }
      });
    }
    // 提取表尾信息
    var footerElement = element.querySelector('.ddr-report-footer');
    if (footerElement) {
      result.push([]); // 空行分隔
      // 提取汇总信息
      var summaryElements = footerElement.querySelectorAll('.ddr-footer-summary .ddr-summary-item');
      if (summaryElements.length > 0) {
        var summaryRow_1 = [];
        summaryElements.forEach(function (item) {
          var _a, _b, _c, _d;
          var label = ((_b = (_a = item.querySelector('.ddr-summary-label')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
          var value = ((_d = (_c = item.querySelector('.ddr-summary-value')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
          if (label && value) {
            summaryRow_1.push("".concat(label, " ").concat(value));
          }
        });
        if (summaryRow_1.length > 0) {
          result.push(summaryRow_1);
        }
      }
      // 提取其他表尾字段
      var footerFields = footerElement.querySelectorAll('.ddr-footer-fields .ddr-footer-field');
      if (footerFields.length > 0) {
        var footerRow_1 = [];
        footerFields.forEach(function (field) {
          var _a, _b, _c, _d;
          var label = ((_b = (_a = field.querySelector('.ddr-field-label')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
          var value = ((_d = (_c = field.querySelector('.ddr-field-value')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
          if (label && value) {
            footerRow_1.push("".concat(label, " ").concat(value));
          }
        });
        if (footerRow_1.length > 0) {
          result.push(footerRow_1);
        }
      }
    }
    return result;
  };
  /**
   * 将DOM样式应用到Excel
   * @param ws 工作表
   * @param data 数据
   * @param element DOM元素
   */
  Exporter.applyDOMStylesToExcel = function (ws, data, element) {
    console.log('开始应用DOM样式到Excel');
    // 使用简化的样式应用方式，提高兼容性
    try {
      // 查找表格元素
      var table = element.querySelector('table');
      if (!table) {
        console.log('未找到表格，使用默认样式');
        applyExcelStyles(ws, data);
        return;
      }
      // 分析DOM结构
      var titleElement = element.querySelector('.ddr-report-header .ddr-header-title');
      var hasTitle = !!titleElement;
      var hasMetadata = element.querySelectorAll('.ddr-header-fields .ddr-header-field').length > 0;
      console.log('DOM结构分析:', {
        hasTitle: hasTitle,
        hasMetadata: hasMetadata
      });
      // 计算各部分在Excel中的行索引
      var currentRowIndex_1 = 0;
      // 简化的样式定义
      var headerStyle_1 = {
        font: {
          bold: true,
          sz: 12,
          color: {
            rgb: "FFFFFF"
          }
        },
        fill: {
          fgColor: {
            rgb: "4472C4"
          }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      };
      var dataStyle_1 = {
        font: {
          sz: 11
        },
        alignment: {
          vertical: "center"
        }
      };
      // 标题行样式
      if (hasTitle) {
        var cellRef = XLSX.utils.encode_cell({
          r: currentRowIndex_1,
          c: 0
        });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: {
              bold: true,
              sz: 16
            },
            alignment: {
              horizontal: "center",
              vertical: "center"
            }
          };
          console.log("\u5E94\u7528\u6807\u9898\u6837\u5F0F\u5230 ".concat(cellRef));
        }
        currentRowIndex_1 += 2; // 标题 + 空行
      }
      // 元数据行样式
      if (hasMetadata) {
        currentRowIndex_1 += 2; // 元数据 + 空行
      }
      // 表格样式 - 简化处理
      var rows = table.querySelectorAll('tr');
      var isFirstRow_1 = true;
      rows.forEach(function (row, rowIndex) {
        var cells = row.querySelectorAll('td, th');
        var isHeader = row.querySelector('th') !== null || isFirstRow_1;
        cells.forEach(function (cell, cellIndex) {
          var excelRowIndex = currentRowIndex_1 + rowIndex;
          var cellRef = XLSXStyle.utils.encode_cell({
            r: excelRowIndex,
            c: cellIndex
          });
          if (!ws[cellRef]) return;
          // 应用简化样式
          if (isHeader) {
            ws[cellRef].s = headerStyle_1;
            console.log("\u5E94\u7528\u8868\u5934\u6837\u5F0F\u5230 ".concat(cellRef));
          } else {
            ws[cellRef].s = dataStyle_1;
          }
        });
        if (isFirstRow_1 && isHeader) {
          isFirstRow_1 = false;
        }
      });
      console.log('DOM样式应用完成');
    } catch (error) {
      console.error('应用DOM样式失败:', error);
      // 降级到默认样式
      applyExcelStyles(ws, data);
    }
  };
  /**
   * 应用基础样式到Excel（兼容性更好的方法）
   */
  Exporter.applyBasicStylesToExcel = function (ws, data) {
    console.log('开始应用基础样式到Excel');
    try {
      // 获取数据范围
      var range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');
      // 应用表头样式（第一行）
      for (var col = range.s.c; col <= range.e.c; col++) {
        var cellRef = XLSXStyle.utils.encode_cell({
          r: 0,
          c: col
        });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: {
              bold: true,
              sz: 12
            },
            fill: {
              fgColor: {
                rgb: "DDDDDD"
              }
            },
            alignment: {
              horizontal: "center",
              vertical: "center"
            }
          };
          console.log("\u5E94\u7528\u8868\u5934\u6837\u5F0F\u5230 ".concat(cellRef));
        }
      }
      // 应用数据行样式
      for (var row = 1; row <= range.e.r; row++) {
        for (var col = range.s.c; col <= range.e.c; col++) {
          var cellRef = XLSXStyle.utils.encode_cell({
            r: row,
            c: col
          });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: {
                sz: 10
              },
              alignment: {
                vertical: "center"
              }
            };
          }
        }
      }
      console.log('基础样式应用完成');
    } catch (error) {
      console.error('应用基础样式失败:', error);
    }
  };
  /**
   * 应用增强样式到Excel（使用更多样式特性）
   */
  Exporter.applyEnhancedStylesToExcel = function (ws, data) {
    console.log('开始应用增强样式到Excel');
    try {
      // 获取数据范围
      var range = XLSXStyle.utils.decode_range(ws['!ref'] || 'A1');
      // 定义样式
      var headerStyle = {
        font: {
          bold: true,
          sz: 12,
          color: {
            rgb: "FFFFFF"
          }
        },
        fill: {
          fgColor: {
            rgb: "4472C4"
          }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        },
        border: {
          top: {
            style: "thin",
            color: {
              rgb: "000000"
            }
          },
          bottom: {
            style: "thin",
            color: {
              rgb: "000000"
            }
          },
          left: {
            style: "thin",
            color: {
              rgb: "000000"
            }
          },
          right: {
            style: "thin",
            color: {
              rgb: "000000"
            }
          }
        }
      };
      var dataStyle = {
        font: {
          sz: 10
        },
        alignment: {
          vertical: "center"
        },
        border: {
          top: {
            style: "thin",
            color: {
              rgb: "CCCCCC"
            }
          },
          bottom: {
            style: "thin",
            color: {
              rgb: "CCCCCC"
            }
          },
          left: {
            style: "thin",
            color: {
              rgb: "CCCCCC"
            }
          },
          right: {
            style: "thin",
            color: {
              rgb: "CCCCCC"
            }
          }
        }
      };
      var alternateRowStyle = {
        font: {
          sz: 10
        },
        fill: {
          fgColor: {
            rgb: "F8F9FA"
          }
        },
        alignment: {
          vertical: "center"
        },
        border: {
          top: {
            style: "thin",
            color: {
              rgb: "CCCCCC"
            }
          },
          bottom: {
            style: "thin",
            color: {
              rgb: "CCCCCC"
            }
          },
          left: {
            style: "thin",
            color: {
              rgb: "CCCCCC"
            }
          },
          right: {
            style: "thin",
            color: {
              rgb: "CCCCCC"
            }
          }
        }
      };
      // 应用表头样式（第一行）
      for (var col = range.s.c; col <= range.e.c; col++) {
        var cellRef = XLSXStyle.utils.encode_cell({
          r: 0,
          c: col
        });
        if (ws[cellRef]) {
          ws[cellRef].s = headerStyle;
          console.log("\u5E94\u7528\u589E\u5F3A\u8868\u5934\u6837\u5F0F\u5230 ".concat(cellRef));
        }
      }
      // 应用数据行样式（交替行颜色）
      for (var row = 1; row <= range.e.r; row++) {
        var isAlternateRow = row % 2 === 0;
        var rowStyle = isAlternateRow ? alternateRowStyle : dataStyle;
        for (var col = range.s.c; col <= range.e.c; col++) {
          var cellRef = XLSXStyle.utils.encode_cell({
            r: row,
            c: col
          });
          if (ws[cellRef]) {
            ws[cellRef].s = rowStyle;
          }
        }
      }
      // 设置列宽
      if (!ws['!cols']) ws['!cols'] = [];
      for (var col = range.s.c; col <= range.e.c; col++) {
        ws['!cols'][col] = {
          wch: 15
        }; // 设置列宽为15字符
      }
      console.log('增强样式应用完成');
    } catch (error) {
      console.error('应用增强样式失败，回退到基础样式:', error);
      // 回退到基础样式
      this.applyBasicStylesToExcel(ws, data);
    }
  };
  /**
   * 将RGB颜色转换为十六进制
   */
  Exporter.rgbToHex = function (rgb) {
    if (!rgb || rgb === 'transparent') return 'FFFFFF';
    var match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      var r = parseInt(match[1]);
      var g = parseInt(match[2]);
      var b = parseInt(match[3]);
      return (r << 16 | g << 8 | b).toString(16).padStart(6, '0').toUpperCase();
    }
    return 'FFFFFF';
  };
  /**
   * 将CSS文本对齐转换为Excel对齐
   */
  Exporter.getExcelAlignment = function (textAlign) {
    switch (textAlign) {
      case 'center':
        return 'center';
      case 'right':
        return 'right';
      case 'justify':
        return 'justify';
      default:
        return 'left';
    }
  };
  /**
   * 导出为PDF
   * @param element 要导出的DOM元素
   * @param config 报表配置
   * @param options 导出选项
   */
  Exporter.toPDF = function (element, config, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (options === void 0) {
      options = {};
    }
    return __awaiter(this, void 0, void 0, function () {
      var _j, fileName, watermark, _k, pdfOptions, configPdfSettings, mergedPdfOptions, finalWatermark, pageSize, orientation_1, quality, multiPage, relayout, margins, originalScrollTop, tempContainer, pdfWidth, contentWidthMm, dpiRatio, contentWidthPx, tableElements, headerElement, footerElement, tableContainer, tableElement, cells, pdf, pageWidth, pageHeight, contentHeight, contentWidth, headerHeight, headerCanvas, headerRect, e_1, footerHeight, footerCanvas, footerRect, e_2, tableElement, tableRect, tableCanvas, tableWidth, tableHeight, rows, totalRows, headerRowCount, i, dataRowCount, actualHeaderHeightMM, actualFooterHeightMM, dataRowHeightMM, avgRowHeightCanvas, configRowHeightPx, configRowHeightMM, pageNumberReserve, contentGap, safetyMargin, baseAvailableHeight, firstPageDataHeight, middlePageDataHeight, lastPageDataHeight, firstPageMaxRows, middlePageMaxRows, lastPageMaxRows, pageBreakPoints, processedRows, pageIndex, maxRowsThisPage, remainingRows, rowsThisPage, headerHeightRatio, dataAreaHeightRatio, processedRowsRatio, breakYPercent, pagesNeeded, headerImgData, footerImgData, lastPageRows, lastPageDataHeightUsed, lastPageRemainingHeight, page, yOffset, repeatTableHeader, headerOnlyCanvas, headerHeightInCanvas, headerCtx, headerHeightInPDF, headerImgData_1, tableStartPercent, tableEndPercent, endRow, startRow, endRow, sourceY, sourceHeight, tablePartHeight, endRow, headerRowHeightCanvas, dataRowHeightCanvas, endRowHeightCanvas, startRow, endRow, rowsThisPage, headerRowHeightCanvas, dataRowHeightCanvas, startRowHeightCanvas, endRowHeightCanvas, endY, maxAllowedHeight, overflow, pageTableCanvas, pageTableCtx, pageTableImgData, contentBottom, minPageNumberY, maxPageNumberY, pageNumberY, minFooterY, maxFooterY, footerY, newPageNumber, pageNumberY, watermarkCanvas, ctx, watermarkImgData, watermarkCanvas, scale, ctx, textLength, fontSize, textMetrics, textWidth, textHeight, spacingX, spacingY, cols, rows_1, row, col, x, y, watermarkImgData, centerX, centerY, e_3, canvas, imgData, canvasAspectRatio, pageAspectRatio, imgWidth, imgHeight, error_1;
      return __generator(this, function (_l) {
        switch (_l.label) {
          case 0:
            _l.trys.push([0, 14,, 15]);
            console.log('PDF导出开始，使用内置jsPDF库');
            _j = options.fileName, fileName = _j === void 0 ? '报表' : _j, watermark = options.watermark, _k = options.pdf, pdfOptions = _k === void 0 ? {} : _k;
            configPdfSettings = ((_a = config === null || config === void 0 ? void 0 : config.features) === null || _a === void 0 ? void 0 : _a.pdfConfig) || {};
            mergedPdfOptions = __assign(__assign({}, configPdfSettings), pdfOptions);
            finalWatermark = watermark !== undefined ? watermark : ((_b = config === null || config === void 0 ? void 0 : config.features) === null || _b === void 0 ? void 0 : _b.watermark) || '';
            // 调试信息：输出PDF配置和水印处理
            console.log('PDF导出配置:', {
              configPdfSettings: configPdfSettings,
              pdfOptions: pdfOptions,
              mergedPdfOptions: mergedPdfOptions
            });
            console.log('水印处理:', {
              '方法参数watermark': watermark,
              '配置中的watermark': (_c = config === null || config === void 0 ? void 0 : config.features) === null || _c === void 0 ? void 0 : _c.watermark,
              '最终使用的watermark': finalWatermark
            });
            pageSize = mergedPdfOptions.pageSize || 'A4';
            orientation_1 = mergedPdfOptions.orientation || 'portrait';
            quality = mergedPdfOptions.quality || 0.95;
            multiPage = mergedPdfOptions.multiPage !== false;
            relayout = mergedPdfOptions.relayout !== false;
            console.log("PDF\u8BBE\u7F6E - \u9875\u9762\u5927\u5C0F: ".concat(pageSize, ", \u65B9\u5411: ").concat(orientation_1, ", \u91CD\u65B0\u6392\u7248: ").concat(relayout));
            margins = {
              top: ((_d = mergedPdfOptions.margins) === null || _d === void 0 ? void 0 : _d.top) || 15,
              right: ((_e = mergedPdfOptions.margins) === null || _e === void 0 ? void 0 : _e.right) || 15,
              bottom: ((_f = mergedPdfOptions.margins) === null || _f === void 0 ? void 0 : _f.bottom) || 15,
              left: ((_g = mergedPdfOptions.margins) === null || _g === void 0 ? void 0 : _g.left) || 15
            };
            originalScrollTop = element.scrollTop;
            tempContainer = element.cloneNode(true);
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.overflow = 'visible';
            tempContainer.style.height = 'auto';
            // 如果启用重新排版，设置PDF适合的宽度
            if (relayout) {
              pdfWidth = orientation_1 === 'landscape' ? pageSize === 'A4' ? 297 : 279 :
              // A4横版297mm, Letter横版279mm
              pageSize === 'A4' ? 210 : 216;
              contentWidthMm = pdfWidth - margins.left - margins.right;
              dpiRatio = orientation_1 === 'landscape' ? 4.0 : 3.78;
              contentWidthPx = Math.floor(contentWidthMm * dpiRatio);
              tempContainer.style.width = contentWidthPx + 'px';
              tempContainer.style.maxWidth = contentWidthPx + 'px';
              tableElements = tempContainer.querySelectorAll('table');
              tableElements.forEach(function (table) {
                var tableElem = table;
                tableElem.style.width = '100%';
                tableElem.style.tableLayout = 'fixed';
                // 横版时特殊处理，使表格更合理利用空间
                if (orientation_1 === 'landscape') {
                  // 横版时调整单元格尺寸，使文本更紧凑
                  var cells = tableElem.querySelectorAll('td, th');
                  cells.forEach(function (cell) {
                    cell.style.padding = '3px 4px'; // 减小内边距
                  });
                }
              });
            } else {
              // 缩放模式：保持原始宽度，但确保等比例缩放
              tempContainer.style.width = element.clientWidth + 'px';
              console.log('使用缩放模式，保持原始宽度:', element.clientWidth + 'px');
            }
            document.body.appendChild(tempContainer);
            headerElement = tempContainer.querySelector('.ddr-report-header');
            footerElement = tempContainer.querySelector('.ddr-report-footer');
            tableContainer = tempContainer.querySelector('.ddr-table-container');
            // 检查必要的元素是否存在
            if (!tableContainer) {
              console.warn('未找到表格容器元素，导出可能不完整');
            }
            // 优化DOM结构以便更好地导出
            if (tableContainer) {
              tableContainer.style.maxHeight = 'none';
              tableContainer.style.height = 'auto';
              tableContainer.style.overflow = 'visible';
              tableElement = tableContainer.querySelector('table');
              if (tableElement) {
                // 确保表格宽度正确
                tableElement.style.width = '100%';
                cells = tableElement.querySelectorAll('td, th');
                cells.forEach(function (cell) {
                  cell.style.border = '1px solid #ddd';
                });
              }
            }
            // 优化表头和表尾
            if (headerElement) {
              headerElement.style.position = 'relative';
              headerElement.style.height = 'auto';
              headerElement.style.overflow = 'visible';
            }
            if (footerElement) {
              footerElement.style.position = 'relative';
              footerElement.style.height = 'auto';
              footerElement.style.overflow = 'visible';
            }
            pdf = new jsPDF({
              orientation: orientation_1,
              unit: 'mm',
              format: pageSize
            });
            // 设置中文支持
            setupChineseSupport(pdf);
            pageWidth = pdf.internal.pageSize.getWidth();
            pageHeight = pdf.internal.pageSize.getHeight();
            contentHeight = pageHeight - margins.top - margins.bottom;
            contentWidth = pageWidth - margins.left - margins.right;
            // 设置字体大小
            pdf.setFontSize(12);
            if (!multiPage) return [3 /*break*/, 13];
            headerHeight = 0;
            headerCanvas = void 0;
            if (!headerElement) return [3 /*break*/, 4];
            _l.label = 1;
          case 1:
            _l.trys.push([1, 3,, 4]);
            headerRect = headerElement.getBoundingClientRect();
            console.log("\uD83D\uDCCF \u62A5\u8868\u5934DOM\u5C3A\u5BF8\uFF1A".concat(Math.round(headerRect.width), "px \u00D7 ").concat(Math.round(headerRect.height), "px"));
            return [4 /*yield*/, html2canvas(headerElement, {
              scale: 2.0,
              useCORS: true,
              logging: false,
              allowTaint: true,
              backgroundColor: '#FFFFFF' // 确保背景色一致
            })];
          case 2:
            headerCanvas = _l.sent();
            // 基于Canvas和DOM的比例关系计算PDF中的实际高度
            // 这样可以避免DPI假设的问题
            headerHeight = headerCanvas.height / headerCanvas.width * contentWidth;
            console.log("\uD83D\uDCCF \u62A5\u8868\u5934Canvas\u5C3A\u5BF8\uFF1A".concat(headerCanvas.width, "px \u00D7 ").concat(headerCanvas.height, "px"));
            console.log("\uD83D\uDCCF \u62A5\u8868\u5934\u5B9E\u9645\u9AD8\u5EA6\uFF1A".concat(Math.round(headerHeight * 100) / 100, "mm"));
            return [3 /*break*/, 4];
          case 3:
            e_1 = _l.sent();
            console.warn('渲染表头时出错:', e_1);
            return [3 /*break*/, 4];
          case 4:
            footerHeight = 0;
            footerCanvas = void 0;
            if (!footerElement) return [3 /*break*/, 8];
            _l.label = 5;
          case 5:
            _l.trys.push([5, 7,, 8]);
            footerRect = footerElement.getBoundingClientRect();
            console.log("\uD83D\uDCCF \u62A5\u8868\u5C3EDOM\u5C3A\u5BF8\uFF1A".concat(Math.round(footerRect.width), "px \u00D7 ").concat(Math.round(footerRect.height), "px"));
            return [4 /*yield*/, html2canvas(footerElement, {
              scale: 2.0,
              useCORS: true,
              logging: false,
              allowTaint: true,
              backgroundColor: '#FFFFFF' // 确保背景色一致
            })];
          case 6:
            footerCanvas = _l.sent();
            // 基于Canvas和DOM的比例关系计算PDF中的实际高度
            // 这样可以避免DPI假设的问题
            footerHeight = footerCanvas.height / footerCanvas.width * contentWidth;
            console.log("\uD83D\uDCCF \u62A5\u8868\u5C3ECanvas\u5C3A\u5BF8\uFF1A".concat(footerCanvas.width, "px \u00D7 ").concat(footerCanvas.height, "px"));
            console.log("\uD83D\uDCCF \u62A5\u8868\u5C3E\u5B9E\u9645\u9AD8\u5EA6\uFF1A".concat(Math.round(footerHeight * 100) / 100, "mm"));
            return [3 /*break*/, 8];
          case 7:
            e_2 = _l.sent();
            console.warn('渲染表尾时出错:', e_2);
            return [3 /*break*/, 8];
          case 8:
            tableElement = (tableContainer === null || tableContainer === void 0 ? void 0 : tableContainer.querySelector('table')) || tableContainer;
            if (!tableElement) {
              throw new Error('找不到表格元素');
            }
            tableRect = tableElement.getBoundingClientRect();
            console.log("\uD83D\uDCCF \u8868\u683CDOM\u5C3A\u5BF8\uFF1A".concat(Math.round(tableRect.width), "px \u00D7 ").concat(Math.round(tableRect.height), "px"));
            tableCanvas = void 0;
            tableWidth = void 0;
            tableHeight = void 0;
            _l.label = 9;
          case 9:
            _l.trys.push([9, 11,, 13]);
            return [4 /*yield*/, html2canvas(tableElement, {
              scale: 2.0,
              useCORS: true,
              logging: false,
              allowTaint: true,
              backgroundColor: '#FFFFFF' // 确保背景色一致
            })];
          case 10:
            tableCanvas = _l.sent();
            // 基于Canvas和DOM的比例关系计算PDF中的实际尺寸
            tableWidth = contentWidth; // PDF内容区域宽度
            tableHeight = tableCanvas.height / tableCanvas.width * tableWidth; // 基于Canvas比例计算
            console.log("\uD83D\uDCCF \u8868\u683CCanvas\u5C3A\u5BF8\uFF1A".concat(tableCanvas.width, "px \u00D7 ").concat(tableCanvas.height, "px"));
            console.log("\uD83D\uDCCF \u8868\u683C\u5B9E\u9645\u9AD8\u5EA6\uFF1A".concat(Math.round(tableHeight * 100) / 100, "mm"));
            rows = tableElement.querySelectorAll('tr');
            totalRows = rows.length;
            headerRowCount = 0;
            for (i = 0; i < rows.length; i++) {
              if (rows[i].querySelector('th')) {
                headerRowCount++;
              } else {
                break; // 遇到第一个非表头行就停止
              }
            }
            dataRowCount = totalRows - headerRowCount;
            console.log("\uD83D\uDCCA \u8868\u683C\u884C\u6570\u7EDF\u8BA1\uFF1A\u603B\u884C\u6570=".concat(totalRows, ", \u8868\u5934\u884C\u6570=").concat(headerRowCount, ", \u6570\u636E\u884C\u6570=").concat(dataRowCount));
            // 重构分页算法 - 精确计算每页可用空间和行数
            console.log("\uD83D\uDD0D \u5F00\u59CB\u91CD\u6784PDF\u5206\u9875\u7B97\u6CD5...");
            actualHeaderHeightMM = 0;
            actualFooterHeightMM = 0;
            if (headerCanvas) {
              actualHeaderHeightMM = headerHeight;
              console.log("\uD83D\uDCCF \u62A5\u8868\u5934\u5B9E\u9645\u9AD8\u5EA6\uFF1A".concat(Math.round(actualHeaderHeightMM), "mm"));
            }
            if (footerCanvas) {
              actualFooterHeightMM = footerHeight;
              console.log("\uD83D\uDCCF \u62A5\u8868\u5C3E\u5B9E\u9645\u9AD8\u5EA6\uFF1A".concat(Math.round(actualFooterHeightMM), "mm"));
            }
            dataRowHeightMM = void 0;
            avgRowHeightCanvas = tableCanvas.height / totalRows;
            dataRowHeightMM = avgRowHeightCanvas / tableCanvas.height * tableHeight;
            console.log("\uD83D\uDCCF Canvas\u884C\u9AD8\u8BA1\u7B97\uFF1A\u603B\u9AD8\u5EA6".concat(tableCanvas.height, "px \u00F7 ").concat(totalRows, "\u884C = ").concat(Math.round(avgRowHeightCanvas * 100) / 100, "px/\u884C"));
            console.log("\uD83D\uDCCF PDF\u884C\u9AD8\uFF1A".concat(Math.round(dataRowHeightMM * 100) / 100, "mm/\u884C"));
            // 如果有配置的行高，进行对比但不直接使用（避免溢出）
            if ((_h = config === null || config === void 0 ? void 0 : config.layout) === null || _h === void 0 ? void 0 : _h.rowHeight) {
              configRowHeightPx = typeof config.layout.rowHeight === 'number' ? config.layout.rowHeight : parseInt(config.layout.rowHeight);
              configRowHeightMM = configRowHeightPx * 25.4 / 96;
              console.log("\uD83D\uDCCF \u914D\u7F6E\u884C\u9AD8\uFF1A".concat(configRowHeightPx, "px \u2192 ").concat(Math.round(configRowHeightMM * 100) / 100, "mm"));
              console.log("\uD83D\uDCCF Canvas\u884C\u9AD8\uFF1A".concat(Math.round(dataRowHeightMM * 100) / 100, "mm"));
              console.log("\uD83D\uDCCF \u4F7F\u7528Canvas\u884C\u9AD8\u4EE5\u786E\u4FDD\u6570\u636E\u5B8C\u6574\u6027");
            }
            pageNumberReserve = 15;
            contentGap = 5;
            safetyMargin = 3;
            console.log("\uD83D\uDCD0 \u9875\u9762\u5E03\u5C40\u53C2\u6570\uFF1A");
            console.log("- \u9875\u9762\u603B\u9AD8\u5EA6\uFF1A".concat(Math.round(pageHeight), "mm"));
            console.log("- \u4E0A\u4E0B\u8FB9\u8DDD\uFF1A".concat(margins.top + margins.bottom, "mm"));
            console.log("- \u9875\u7801\u9884\u7559\uFF1A".concat(pageNumberReserve, "mm"));
            console.log("- \u5B89\u5168\u8FB9\u8DDD\uFF1A".concat(safetyMargin, "mm"));
            baseAvailableHeight = pageHeight - margins.top - margins.bottom - pageNumberReserve - safetyMargin;
            firstPageDataHeight = baseAvailableHeight - actualHeaderHeightMM - contentGap;
            middlePageDataHeight = baseAvailableHeight;
            lastPageDataHeight = baseAvailableHeight - actualFooterHeightMM - contentGap;
            console.log("\uD83D\uDCD0 \u5404\u9875\u53EF\u7528\u6570\u636E\u9AD8\u5EA6\uFF1A");
            console.log("- \u7B2C\u4E00\u9875\u6570\u636E\u533A\uFF1A".concat(Math.round(firstPageDataHeight), "mm"));
            console.log("- \u4E2D\u95F4\u9875\u6570\u636E\u533A\uFF1A".concat(Math.round(middlePageDataHeight), "mm"));
            console.log("- \u6700\u540E\u9875\u6570\u636E\u533A\uFF1A".concat(Math.round(lastPageDataHeight), "mm"));
            firstPageMaxRows = Math.floor(firstPageDataHeight / dataRowHeightMM);
            middlePageMaxRows = Math.floor(middlePageDataHeight / dataRowHeightMM);
            lastPageMaxRows = Math.floor(lastPageDataHeight / dataRowHeightMM);
            console.log("\uD83D\uDCCA \u4FDD\u5B88\u8BA1\u7B97\u7684\u5404\u9875\u6700\u5927\u884C\u6570\uFF1A");
            console.log("- \u7B2C\u4E00\u9875\uFF1A".concat(firstPageMaxRows, "\u884C (").concat(Math.round(firstPageDataHeight), "mm \u00F7 ").concat(Math.round(dataRowHeightMM * 100) / 100, "mm)"));
            console.log("- \u4E2D\u95F4\u9875\uFF1A".concat(middlePageMaxRows, "\u884C (").concat(Math.round(middlePageDataHeight), "mm \u00F7 ").concat(Math.round(dataRowHeightMM * 100) / 100, "mm)"));
            console.log("- \u6700\u540E\u9875\uFF1A".concat(lastPageMaxRows, "\u884C (").concat(Math.round(lastPageDataHeight), "mm \u00F7 ").concat(Math.round(dataRowHeightMM * 100) / 100, "mm)"));
            // 验证计算准确性
            console.log("\uD83D\uDD0D \u7A7A\u95F4\u5229\u7528\u7387\u9A8C\u8BC1\uFF1A");
            console.log("- \u7B2C\u4E00\u9875\uFF1A".concat(firstPageMaxRows, "\u884C \u00D7 ").concat(Math.round(dataRowHeightMM * 100) / 100, "mm = ").concat(Math.round(firstPageMaxRows * dataRowHeightMM), "mm\uFF0C\u53EF\u7528").concat(Math.round(firstPageDataHeight), "mm\uFF0C\u5229\u7528\u7387").concat(Math.round(firstPageMaxRows * dataRowHeightMM / firstPageDataHeight * 100), "%"));
            console.log("- \u4E2D\u95F4\u9875\uFF1A".concat(middlePageMaxRows, "\u884C \u00D7 ").concat(Math.round(dataRowHeightMM * 100) / 100, "mm = ").concat(Math.round(middlePageMaxRows * dataRowHeightMM), "mm\uFF0C\u53EF\u7528").concat(Math.round(middlePageDataHeight), "mm\uFF0C\u5229\u7528\u7387").concat(Math.round(middlePageMaxRows * dataRowHeightMM / middlePageDataHeight * 100), "%"));
            pageBreakPoints = [];
            processedRows = 0;
            pageIndex = 0;
            console.log("\uD83D\uDD04 \u5F00\u59CB\u667A\u80FD\u5206\u9875\u7B97\u6CD5\uFF0C\u603B\u6570\u636E\u884C\u6570\uFF1A".concat(dataRowCount));
            while (processedRows < dataRowCount) {
              maxRowsThisPage = void 0;
              if (pageIndex === 0) {
                // 第一页：包含报表头
                maxRowsThisPage = firstPageMaxRows;
                console.log("\uD83D\uDCC4 \u7B2C".concat(pageIndex + 1, "\u9875\uFF08\u9996\u9875\uFF09\uFF1A\u6700\u5927\u53EF\u5BB9\u7EB3").concat(maxRowsThisPage, "\u884C"));
              } else {
                remainingRows = dataRowCount - processedRows;
                if (remainingRows <= lastPageMaxRows) {
                  // 最后一页：需要容纳报表尾
                  maxRowsThisPage = remainingRows;
                  console.log("\uD83D\uDCC4 \u7B2C".concat(pageIndex + 1, "\u9875\uFF08\u672B\u9875\uFF09\uFF1A\u663E\u793A\u5269\u4F59").concat(remainingRows, "\u884C"));
                } else {
                  // 中间页：全部用于数据
                  maxRowsThisPage = middlePageMaxRows;
                  console.log("\uD83D\uDCC4 \u7B2C".concat(pageIndex + 1, "\u9875\uFF08\u4E2D\u95F4\u9875\uFF09\uFF1A\u6700\u5927\u53EF\u5BB9\u7EB3").concat(maxRowsThisPage, "\u884C"));
                }
              }
              rowsThisPage = Math.min(maxRowsThisPage, dataRowCount - processedRows);
              processedRows += rowsThisPage;
              console.log("\uD83D\uDCCA \u7B2C".concat(pageIndex + 1, "\u9875\u5B9E\u9645\u663E\u793A\uFF1A").concat(rowsThisPage, "\u884C\uFF0C\u7D2F\u8BA1\u5904\u7406\uFF1A").concat(processedRows, "/").concat(dataRowCount, "\u884C"));
              // 如果还有剩余数据，创建分页点
              if (processedRows < dataRowCount) {
                headerHeightRatio = actualHeaderHeightMM / tableHeight;
                dataAreaHeightRatio = 1 - headerHeightRatio - actualFooterHeightMM / tableHeight;
                processedRowsRatio = processedRows / dataRowCount;
                breakYPercent = headerHeightRatio + processedRowsRatio * dataAreaHeightRatio;
                pageBreakPoints.push({
                  yPercent: breakYPercent,
                  endRow: processedRows
                });
                console.log("\uD83D\uDCCD \u521B\u5EFA\u5206\u9875\u70B9".concat(pageIndex + 1, "\uFF1A\u7B2C").concat(processedRows, "\u884C\u7ED3\u675F\uFF0CY=").concat(Math.round(breakYPercent * 100), "%"));
              }
              pageIndex++;
            }
            console.log("\u2705 \u5206\u9875\u7B97\u6CD5\u5B8C\u6210\uFF1A\u5171".concat(pageIndex, "\u9875\uFF0C\u5904\u7406").concat(processedRows, "\u884C\u6570\u636E\uFF0C\u521B\u5EFA").concat(pageBreakPoints.length, "\u4E2A\u5206\u9875\u70B9"));
            pagesNeeded = pageBreakPoints.length + 1;
            console.log("\uD83D\uDCCA \u603B\u8BA1\u9700\u8981 ".concat(pagesNeeded, " \u9875\u663E\u793A ").concat(dataRowCount, " \u884C\u6570\u636E"));
            headerImgData = headerCanvas ? headerCanvas.toDataURL('image/jpeg', quality) : null;
            footerImgData = footerCanvas ? footerCanvas.toDataURL('image/jpeg', quality) : null;
            // 检查最后一页是否需要额外页面显示报表尾
            if (footerImgData) {
              lastPageRows = pageBreakPoints.length > 0 ? dataRowCount - pageBreakPoints[pageBreakPoints.length - 1].endRow : dataRowCount;
              lastPageDataHeightUsed = lastPageRows * dataRowHeightMM;
              lastPageRemainingHeight = lastPageDataHeight - lastPageDataHeightUsed;
              console.log("\uD83D\uDCCB \u62A5\u8868\u5C3E\u68C0\u67E5\uFF1A");
              console.log("- \u6700\u540E\u4E00\u9875\u6570\u636E\u884C\u6570\uFF1A".concat(lastPageRows));
              console.log("- \u6700\u540E\u4E00\u9875\u6570\u636E\u5360\u7528\u9AD8\u5EA6\uFF1A".concat(Math.round(lastPageDataHeightUsed), "mm"));
              console.log("- \u6700\u540E\u4E00\u9875\u5269\u4F59\u9AD8\u5EA6\uFF1A".concat(Math.round(lastPageRemainingHeight), "mm"));
              console.log("- \u62A5\u8868\u5C3E\u9700\u8981\u9AD8\u5EA6\uFF1A".concat(Math.round(actualFooterHeightMM + contentGap), "mm"));
              if (lastPageRemainingHeight < actualFooterHeightMM + contentGap) {
                console.log("\u26A0\uFE0F \u6700\u540E\u4E00\u9875\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u62A5\u8868\u5C3E\u5C06\u5728\u65B0\u9875\u663E\u793A");
              } else {
                console.log("\u2705 \u6700\u540E\u4E00\u9875\u7A7A\u95F4\u5145\u8DB3\uFF0C\u62A5\u8868\u5C3E\u5C06\u5728\u5F53\u524D\u9875\u663E\u793A");
              }
            }
            // 逐页添加内容
            for (page = 0; page < pagesNeeded; page++) {
              // 如果不是第一页，创建新页
              if (page > 0) {
                pdf.addPage();
              }
              yOffset = margins.top;
              // 添加报表头（只在第一页显示）
              if (headerImgData && page === 0) {
                pdf.addImage(headerImgData, 'JPEG', margins.left, yOffset, contentWidth, headerHeight);
                yOffset += headerHeight + 5; // 5mm的间距
              }
              repeatTableHeader = mergedPdfOptions.repeatTableHeader !== false;
              if (repeatTableHeader && page > 0 && headerRowCount > 0) {
                // 在非首页添加表格标题行
                try {
                  console.log("\uD83D\uDCC4 \u7B2C".concat(page + 1, "\u9875\u6DFB\u52A0\u8868\u683C\u6807\u9898\u884C"));
                  headerOnlyCanvas = document.createElement('canvas');
                  headerOnlyCanvas.width = tableCanvas.width;
                  headerHeightInCanvas = headerRowCount / totalRows * tableCanvas.height;
                  headerOnlyCanvas.height = Math.ceil(headerHeightInCanvas);
                  headerCtx = headerOnlyCanvas.getContext('2d');
                  if (headerCtx) {
                    // 设置白色背景
                    headerCtx.fillStyle = '#ffffff';
                    headerCtx.fillRect(0, 0, headerOnlyCanvas.width, headerOnlyCanvas.height);
                    // 从原表格canvas中精确复制表头部分
                    headerCtx.drawImage(tableCanvas, 0, 0, tableCanvas.width, headerHeightInCanvas, 0, 0, headerOnlyCanvas.width, headerOnlyCanvas.height);
                    headerHeightInPDF = headerOnlyCanvas.height / tableCanvas.height * tableHeight;
                    headerImgData_1 = headerOnlyCanvas.toDataURL('image/jpeg', quality);
                    pdf.addImage(headerImgData_1, 'JPEG', margins.left, yOffset, contentWidth, headerHeightInPDF);
                    yOffset += headerHeightInPDF; // 不添加额外间距，确保与数据行紧密连接
                    console.log("\uD83D\uDCC4 \u7B2C".concat(page + 1, "\u9875\u8868\u683C\u6807\u9898\u884C\u6DFB\u52A0\u5B8C\u6210\uFF0C\u9AD8\u5EA6\uFF1A").concat(Math.round(headerHeightInPDF), "mm"));
                  }
                } catch (e) {
                  console.warn("\u7B2C".concat(page + 1, "\u9875\u6DFB\u52A0\u8868\u683C\u6807\u9898\u884C\u5931\u8D25:"), e);
                }
              }
              tableStartPercent = 0;
              tableEndPercent = 1;
              // 根据分页点计算每页内容范围
              if (pageBreakPoints.length > 0) {
                if (page === 0) {
                  // 第一页：从开始到第一个分页点
                  tableStartPercent = 0;
                  tableEndPercent = pageBreakPoints[0].yPercent;
                  endRow = pageBreakPoints[0].endRow;
                  console.log("\uD83D\uDCC4 \u7B2C1\u9875\uFF1A\u663E\u793A\u8868\u5934+\u7B2C1-".concat(endRow, "\u884C\uFF0CY\u8303\u56F4\uFF1A0% \u5230 ").concat(Math.round(pageBreakPoints[0].yPercent * 100), "%"));
                } else {
                  // 后续页：从前一个分页点到当前分页点（或结束）
                  tableStartPercent = pageBreakPoints[page - 1].yPercent;
                  tableEndPercent = page < pageBreakPoints.length ? pageBreakPoints[page].yPercent : 1;
                  startRow = pageBreakPoints[page - 1].endRow + 1;
                  endRow = page < pageBreakPoints.length ? pageBreakPoints[page].endRow : dataRowCount;
                  console.log("\uD83D\uDCC4 \u7B2C".concat(page + 1, "\u9875\uFF1A\u663E\u793A\u7B2C").concat(startRow, "-").concat(endRow, "\u884C\uFF0CY\u8303\u56F4\uFF1A").concat(Math.round(tableStartPercent * 100), "% \u5230 ").concat(Math.round(tableEndPercent * 100), "%"));
                }
              } else {
                // 单页显示所有内容
                console.log("\uD83D\uDCC4 \u7B2C".concat(page + 1, "\u9875\uFF1A\u663E\u793A\u6240\u6709\u5185\u5BB9\uFF08\u5355\u9875\u6A21\u5F0F\uFF09"));
              }
              sourceY = void 0;
              sourceHeight = void 0;
              tablePartHeight = void 0;
              if (pageBreakPoints.length > 0) {
                // 多页模式：基于行边界进行精确裁剪
                if (page === 0) {
                  endRow = pageBreakPoints[0].endRow;
                  sourceY = 0; // 从表头开始
                  headerRowHeightCanvas = headerRowCount / totalRows * tableCanvas.height;
                  dataRowHeightCanvas = tableCanvas.height / totalRows;
                  endRowHeightCanvas = headerRowHeightCanvas + endRow * dataRowHeightCanvas;
                  sourceHeight = Math.floor(endRowHeightCanvas);
                  tablePartHeight = sourceHeight / tableCanvas.height * tableHeight;
                  console.log("\uD83D\uDCD0 \u7B2C1\u9875\u884C\u8FB9\u754C\u88C1\u526A\uFF1A\u8868\u5934".concat(headerRowCount, "\u884C+\u6570\u636E").concat(endRow, "\u884C\uFF0CCanvas\u9AD8\u5EA6=").concat(Math.round(sourceHeight), "px\uFF0CPDF\u9AD8\u5EA6=").concat(Math.round(tablePartHeight), "mm"));
                } else {
                  startRow = pageBreakPoints[page - 1].endRow;
                  endRow = page < pageBreakPoints.length ? pageBreakPoints[page].endRow : dataRowCount;
                  rowsThisPage = endRow - startRow;
                  console.log("\uD83D\uDCD0 \u7B2C".concat(page + 1, "\u9875\u6570\u636E\u884C\uFF1A\u7B2C").concat(startRow + 1, "-").concat(endRow, "\u884C\uFF08").concat(rowsThisPage, "\u884C\uFF09"));
                  headerRowHeightCanvas = headerRowCount / totalRows * tableCanvas.height;
                  dataRowHeightCanvas = tableCanvas.height / totalRows;
                  startRowHeightCanvas = headerRowHeightCanvas + startRow * dataRowHeightCanvas;
                  endRowHeightCanvas = headerRowHeightCanvas + endRow * dataRowHeightCanvas;
                  // 更精确的裁剪位置计算
                  if (startRow === 0) {
                    // 如果是第一批数据行，从表头结束位置开始，但要包含第一行的完整上边框
                    sourceY = Math.floor(headerRowHeightCanvas - 1); // 向前包含1px确保边框完整
                  } else {
                    // 非第一批数据行，精确从行开始位置裁剪
                    sourceY = Math.floor(startRowHeightCanvas);
                  }
                  endY = Math.floor(endRowHeightCanvas);
                  sourceHeight = Math.min(endY - sourceY, tableCanvas.height - sourceY);
                  tablePartHeight = sourceHeight / tableCanvas.height * tableHeight;
                  console.log("\uD83D\uDCD0 \u7B2C".concat(page + 1, "\u9875\u6570\u636E\u884C\u88C1\u526A\uFF1A\u7B2C").concat(startRow + 1, "-").concat(endRow, "\u884C\uFF0CCanvas\u8303\u56F4=").concat(Math.round(sourceY), "-").concat(Math.round(sourceY + sourceHeight), "px\uFF0CPDF\u9AD8\u5EA6=").concat(Math.round(tablePartHeight), "mm"));
                }
              } else {
                // 单页模式：使用原有逻辑
                sourceY = Math.floor(tableStartPercent * tableCanvas.height);
                sourceHeight = Math.ceil((tableEndPercent - tableStartPercent) * tableCanvas.height);
                tablePartHeight = sourceHeight / tableCanvas.height * tableHeight;
                console.log("\uD83D\uDCD0 \u5355\u9875\u6A21\u5F0F\uFF1A\u6E90\u9AD8\u5EA6=".concat(Math.round(sourceHeight), "px\uFF0C\u76EE\u6807\u9AD8\u5EA6=").concat(Math.round(tablePartHeight), "mm"));
              }
              maxAllowedHeight = pageHeight - yOffset - margins.bottom - pageNumberReserve;
              if (tablePartHeight > maxAllowedHeight) {
                console.warn("\u26A0\uFE0F \u7B2C".concat(page + 1, "\u9875\u5185\u5BB9\u9AD8\u5EA6").concat(Math.round(tablePartHeight), "mm\u8D85\u51FA\u53EF\u7528\u7A7A\u95F4").concat(Math.round(maxAllowedHeight), "mm"));
                overflow = tablePartHeight - maxAllowedHeight;
                if (overflow <= 8) {
                  // 如果超出不超过8mm，可以压缩页码空间
                  console.log("\uD83D\uDCD0 \u52A8\u6001\u8C03\u6574\uFF1A\u538B\u7F29\u9875\u7801\u9884\u7559\u7A7A\u95F4".concat(Math.round(overflow), "mm"));
                  // 继续使用原始高度，页码位置会自动调整
                }
              }
              try {
                pageTableCanvas = document.createElement('canvas');
                pageTableCanvas.width = tableCanvas.width;
                pageTableCanvas.height = sourceHeight;
                pageTableCtx = pageTableCanvas.getContext('2d');
                if (pageTableCtx) {
                  // 设置白色背景
                  pageTableCtx.fillStyle = '#ffffff';
                  pageTableCtx.fillRect(0, 0, pageTableCanvas.width, pageTableCanvas.height);
                  // 将表格对应部分裁剪到新canvas
                  pageTableCtx.drawImage(tableCanvas, 0, sourceY, tableCanvas.width, sourceHeight, 0, 0, pageTableCanvas.width, pageTableCanvas.height);
                  // 如果是非首页且没有表头，需要在顶部添加边框线
                  if (page > 0 && (!repeatTableHeader || headerRowCount === 0)) {
                    // 在数据行顶部绘制边框线，补充被裁剪掉的上边框
                    pageTableCtx.strokeStyle = '#ddd';
                    pageTableCtx.lineWidth = 1;
                    pageTableCtx.beginPath();
                    pageTableCtx.moveTo(0, 0.5);
                    pageTableCtx.lineTo(pageTableCanvas.width, 0.5);
                    pageTableCtx.stroke();
                    console.log("\uD83D\uDCC4 \u7B2C".concat(page + 1, "\u9875\u6DFB\u52A0\u9876\u90E8\u8FB9\u6846\u7EBF\uFF08\u65E0\u8868\u5934\u6A21\u5F0F\uFF09"));
                  }
                  pageTableImgData = pageTableCanvas.toDataURL('image/jpeg', quality);
                  // 添加裁剪后的表格部分
                  pdf.addImage(pageTableImgData, 'JPEG', margins.left, yOffset, contentWidth, tablePartHeight);
                  yOffset += tablePartHeight;
                }
              } catch (e) {
                console.warn('处理表格页码时出错:', e);
              }
              // 添加页码（如果页数大于1）
              if (pagesNeeded > 1) {
                // 使用英文格式页码，避免中文乱码问题
                try {
                  pdf.setFontSize(10);
                  pdf.setTextColor(80, 80, 80);
                  contentBottom = yOffset;
                  minPageNumberY = contentBottom + 5;
                  maxPageNumberY = pageHeight - margins.bottom + 3;
                  pageNumberY = Math.min(maxPageNumberY, Math.max(minPageNumberY, pageHeight - 8));
                  pdf.text("Page ".concat(page + 1, " / ").concat(pagesNeeded), pageWidth / 2, pageNumberY, {
                    align: 'center'
                  });
                  console.log("\u7B2C".concat(page + 1, "\u9875\u6DFB\u52A0\u9875\u7801\uFF0C\u5185\u5BB9\u5E95\u90E8\uFF1A").concat(Math.round(contentBottom), "mm\uFF0C\u9875\u7801\u4F4D\u7F6E\uFF1AY=").concat(Math.round(pageNumberY), "mm"));
                } catch (e) {
                  console.warn('页码渲染失败:', e);
                }
              }
              // 添加表尾（只在最后一页显示）
              if (footerImgData && page === pagesNeeded - 1) {
                minFooterY = yOffset + contentGap;
                maxFooterY = pageHeight - margins.bottom - pageNumberReserve - footerHeight;
                footerY = Math.max(minFooterY, maxFooterY);
                // 如果当前页没有足够空间显示表尾，则创建新页
                if (footerY + footerHeight > pageHeight - margins.bottom - pageNumberReserve) {
                  console.log("\uD83D\uDCC4 \u8868\u5C3E\u9700\u8981\u65B0\u9875\u663E\u793A\uFF0C\u5F53\u524D\u9875\u5269\u4F59\u7A7A\u95F4\u4E0D\u8DB3");
                  pdf.addPage();
                  // 在新页添加表尾
                  pdf.addImage(footerImgData, 'JPEG', margins.left, margins.top, contentWidth, footerHeight);
                  // 在新页添加页码
                  if (pagesNeeded > 1) {
                    newPageNumber = pagesNeeded + 1;
                    pdf.setFontSize(10);
                    pdf.setTextColor(80, 80, 80);
                    pageNumberY = pageHeight - margins.bottom + 3;
                    pdf.text("Page ".concat(newPageNumber, " / ").concat(newPageNumber), pageWidth / 2, pageNumberY, {
                      align: 'center'
                    });
                  }
                  // 在新页添加水印
                  if (finalWatermark) {
                    try {
                      watermarkCanvas = document.createElement('canvas');
                      watermarkCanvas.width = 400;
                      watermarkCanvas.height = 100;
                      ctx = watermarkCanvas.getContext('2d');
                      if (ctx) {
                        ctx.font = '40px Arial, sans-serif';
                        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.translate(200, 50);
                        ctx.rotate(45 * Math.PI / 180);
                        ctx.fillText(finalWatermark, 0, 0);
                        watermarkImgData = watermarkCanvas.toDataURL('image/png');
                        pdf.addImage(watermarkImgData, 'PNG', pageWidth / 2 - 50, pageHeight / 2 - 12.5, 100, 25, undefined, 'NONE');
                      }
                    } catch (e) {
                      console.warn('新页水印添加失败:', e);
                    }
                  }
                } else {
                  // 在当前页添加表尾
                  console.log("\uD83D\uDCC4 \u5728\u7B2C".concat(page + 1, "\u9875\u6DFB\u52A0\u8868\u5C3E\uFF0C\u4F4D\u7F6E\uFF1AY=").concat(Math.round(footerY), "mm"));
                  pdf.addImage(footerImgData, 'JPEG', margins.left, footerY, contentWidth, footerHeight);
                }
              }
              // 在每页添加水印 - 改进版：全页面平铺水印
              if (finalWatermark) {
                try {
                  console.log("\u7B2C".concat(page + 1, "\u9875\u5F00\u59CB\u6DFB\u52A0\u5168\u9875\u9762\u6C34\u5370: \"").concat(finalWatermark, "\""));
                  watermarkCanvas = document.createElement('canvas');
                  scale = 2;
                  watermarkCanvas.width = pageWidth * scale * 4; // 转换为像素并放大
                  watermarkCanvas.height = pageHeight * scale * 4;
                  ctx = watermarkCanvas.getContext('2d');
                  if (!ctx) {
                    throw new Error('无法创建canvas上下文');
                  }
                  // 设置透明背景
                  ctx.clearRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);
                  textLength = finalWatermark.length;
                  fontSize = Math.max(24, Math.min(48, 600 / textLength));
                  ctx.font = "".concat(fontSize, "px Arial, sans-serif");
                  ctx.fillStyle = 'rgba(180, 180, 180, 0.15)'; // 更淡的水印
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  textMetrics = ctx.measureText(finalWatermark);
                  textWidth = textMetrics.width;
                  textHeight = fontSize;
                  spacingX = textWidth * 1.8;
                  spacingY = textHeight * 4.5;
                  cols = Math.ceil(watermarkCanvas.width / spacingX) + 2;
                  rows_1 = Math.ceil(watermarkCanvas.height / spacingY) + 2;
                  console.log("\u6C34\u5370\u53C2\u6570: \u5B57\u4F53".concat(fontSize, "px, \u6587\u5B57\u5BBD\u5EA6").concat(Math.round(textWidth), "px, \u95F4\u8DDD").concat(Math.round(spacingX), "x").concat(Math.round(spacingY), "px, \u7F51\u683C").concat(cols, "x").concat(rows_1));
                  // 平铺绘制水印
                  for (row = 0; row < rows_1; row++) {
                    for (col = 0; col < cols; col++) {
                      ctx.save();
                      x = col * spacingX - spacingX / 2;
                      y = row * spacingY - spacingY / 2;
                      // 移动到水印位置
                      ctx.translate(x, y);
                      // 旋转45度
                      ctx.rotate(45 * Math.PI / 180);
                      // 绘制水印文字
                      ctx.fillText(finalWatermark, 0, 0);
                      ctx.restore();
                    }
                  }
                  watermarkImgData = watermarkCanvas.toDataURL('image/png');
                  // 添加水印图像到PDF（覆盖整个页面）
                  pdf.addImage(watermarkImgData, 'PNG', 0,
                  // 从页面左上角开始
                  0, pageWidth,
                  // 覆盖整个页面宽度
                  pageHeight,
                  // 覆盖整个页面高度
                  undefined, 'NONE');
                  console.log("\u7B2C".concat(page + 1, "\u9875\u6210\u529F\u6DFB\u52A0\u5168\u9875\u9762\u5E73\u94FA\u6C34\u5370"));
                } catch (watermarkError) {
                  console.warn("\u7B2C".concat(page + 1, "\u9875\u6DFB\u52A0\u6C34\u5370\u5931\u8D25\uFF0C\u5C1D\u8BD5\u7B80\u5316\u6C34\u5370:"), watermarkError);
                  // 降级方案：使用PDF原生文字水印
                  try {
                    pdf.setTextColor(200, 200, 200);
                    pdf.setFontSize(30);
                    centerX = pageWidth / 2;
                    centerY = pageHeight / 2;
                    pdf.text(finalWatermark, centerX, centerY, {
                      align: 'center',
                      baseline: 'middle',
                      angle: 45
                    });
                    console.log("\u7B2C".concat(page + 1, "\u9875\u6DFB\u52A0\u7B80\u5316\u6C34\u5370: \"").concat(finalWatermark, "\""));
                  } catch (fallbackError) {
                    console.warn("\u7B2C".concat(page + 1, "\u9875\u7B80\u5316\u6C34\u5370\u4E5F\u5931\u8D25:"), fallbackError);
                  }
                }
              }
              // 注意：新页的添加已经在循环开始时处理了，这里不需要重复添加
            }
            return [3 /*break*/, 13];
          case 11:
            e_3 = _l.sent();
            console.warn('处理表格时出错:', e_3);
            return [4 /*yield*/, html2canvas(tempContainer, {
              scale: 1.5,
              useCORS: true,
              logging: false,
              allowTaint: true,
              backgroundColor: '#FFFFFF'
            })];
          case 12:
            canvas = _l.sent();
            imgData = canvas.toDataURL('image/jpeg', quality);
            canvasAspectRatio = canvas.width / canvas.height;
            pageAspectRatio = contentWidth / contentHeight;
            imgWidth = void 0, imgHeight = void 0;
            if (relayout) {
              // 重新排版模式：使用内容区域的完整宽度
              imgWidth = contentWidth;
              imgHeight = canvas.height / canvas.width * imgWidth;
              console.log('重新排版模式 - 图像尺寸:', {
                imgWidth: imgWidth,
                imgHeight: imgHeight
              });
            } else {
              // 缩放模式：等比例缩放以适应页面
              if (canvasAspectRatio > pageAspectRatio) {
                // 图像更宽，以宽度为准
                imgWidth = contentWidth;
                imgHeight = imgWidth / canvasAspectRatio;
              } else {
                // 图像更高，以高度为准
                imgHeight = contentHeight;
                imgWidth = imgHeight * canvasAspectRatio;
              }
              console.log('缩放模式 - 等比例缩放图像尺寸:', {
                imgWidth: imgWidth,
                imgHeight: imgHeight,
                canvasAspectRatio: canvasAspectRatio,
                pageAspectRatio: pageAspectRatio
              });
            }
            pdf.addImage(imgData, 'JPEG', margins.left, margins.top, imgWidth, imgHeight);
            return [3 /*break*/, 13];
          case 13:
            // 水印已在每页循环中添加
            // 清理临时元素
            document.body.removeChild(tempContainer);
            // 恢复原始滚动位置
            element.scrollTop = originalScrollTop;
            // 保存文件
            pdf.save("".concat(fileName, ".pdf"));
            return [2 /*return*/, Promise.resolve()];
          case 14:
            error_1 = _l.sent();
            console.error('PDF导出失败:', error_1);
            return [2 /*return*/, Promise.reject(error_1)];
          case 15:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 打印功能 - 重用PDF绘制逻辑
   * @param element 要打印的DOM元素
   * @param config 报表配置
   * @param options 打印选项
   */
  Exporter.toPrint = function (element, config, options) {
    var _a, _b;
    if (options === void 0) {
      options = {};
    }
    return __awaiter(this, void 0, void 0, function () {
      var watermark, _c, pdfOptions, configPdfSettings, mergedPdfOptions, finalWatermark, orientation_2, pageSize, printContainer_1, printStyle_1, originalElements_1, error_2;
      return __generator(this, function (_d) {
        switch (_d.label) {
          case 0:
            _d.trys.push([0, 3,, 4]);
            console.log('开始打印，重用PDF绘制逻辑');
            watermark = options.watermark, _c = options.pdf, pdfOptions = _c === void 0 ? {} : _c;
            configPdfSettings = ((_a = config === null || config === void 0 ? void 0 : config.features) === null || _a === void 0 ? void 0 : _a.pdfConfig) || {};
            mergedPdfOptions = __assign(__assign({}, configPdfSettings), pdfOptions);
            finalWatermark = watermark !== undefined ? watermark : ((_b = config === null || config === void 0 ? void 0 : config.features) === null || _b === void 0 ? void 0 : _b.watermark) || '';
            orientation_2 = mergedPdfOptions.orientation || 'portrait';
            pageSize = mergedPdfOptions.pageSize || 'A4';
            console.log("\u6253\u5370\u8BBE\u7F6E - \u9875\u9762\u5927\u5C0F: ".concat(pageSize, ", \u65B9\u5411: ").concat(orientation_2));
            return [4 /*yield*/, this._createPrintContainer(element, config, mergedPdfOptions, finalWatermark)];
          case 1:
            printContainer_1 = _d.sent();
            printStyle_1 = this._createPrintStyle(orientation_2, pageSize);
            // 添加样式到页面
            document.head.appendChild(printStyle_1);
            // 将打印容器添加到页面（隐藏）
            printContainer_1.style.position = 'fixed';
            printContainer_1.style.left = '-9999px';
            printContainer_1.style.top = '0';
            printContainer_1.style.zIndex = '9999';
            document.body.appendChild(printContainer_1);
            // 等待内容渲染完成
            return [4 /*yield*/, new Promise(function (resolve) {
              return setTimeout(resolve, 100);
            })];
          case 2:
            // 等待内容渲染完成
            _d.sent();
            // 显示打印容器并隐藏其他内容
            printContainer_1.style.left = '0';
            printContainer_1.style.position = 'absolute';
            originalElements_1 = document.querySelectorAll('body > *:not(.ddr-print-container)');
            originalElements_1.forEach(function (el) {
              el.style.display = 'none';
            });
            // 执行打印
            window.print();
            // 清理：恢复原始内容并移除打印容器和水印
            setTimeout(function () {
              originalElements_1.forEach(function (el) {
                el.style.display = '';
              });
              document.body.removeChild(printContainer_1);
              document.head.removeChild(printStyle_1);
              // 清理打印水印
              var printWatermarks = document.querySelectorAll('[data-ddr-print-watermark="true"]');
              printWatermarks.forEach(function (wm) {
                return wm.remove();
              });
            }, 100);
            console.log('打印完成');
            return [2 /*return*/, Promise.resolve()];
          case 3:
            error_2 = _d.sent();
            console.error('打印失败:', error_2);
            return [2 /*return*/, Promise.reject(error_2)];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 创建打印专用容器
   */
  Exporter._createPrintContainer = function (element, config, pdfOptions, watermark) {
    return __awaiter(this, void 0, void 0, function () {
      var printContainer, existingWatermarks, headerFooterElements, headerElement, footerElement;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            printContainer = element.cloneNode(true);
            printContainer.className = 'ddr-print-container';
            // 设置打印容器样式
            printContainer.style.width = '100%';
            printContainer.style.height = 'auto';
            printContainer.style.overflow = 'visible';
            printContainer.style.backgroundColor = '#ffffff';
            printContainer.style.color = '#000000';
            existingWatermarks = printContainer.querySelectorAll('.ddr-watermark, .ddr-watermark-content');
            existingWatermarks.forEach(function (wm) {
              return wm.remove();
            });
            headerFooterElements = printContainer.querySelectorAll('.ddr-report-header, .ddr-report-footer');
            headerFooterElements.forEach(function (element) {
              // 移除背景水印样式
              var el = element;
              el.style.backgroundImage = 'none';
              el.style.background = 'none';
              // 移除内部的水印元素
              var innerWatermarks = el.querySelectorAll('[class*="watermark"]');
              innerWatermarks.forEach(function (wm) {
                return wm.remove();
              });
            });
            // 重用PDF的列宽重制逻辑
            return [4 /*yield*/, this._applyPrintTableLayout(printContainer, config, pdfOptions)];
          case 1:
            // 重用PDF的列宽重制逻辑
            _a.sent();
            headerElement = printContainer.querySelector('.ddr-report-header');
            if (headerElement) {
              headerElement.style.pageBreakInside = 'avoid';
              headerElement.style.marginBottom = '20px';
            }
            footerElement = printContainer.querySelector('.ddr-report-footer');
            if (footerElement) {
              footerElement.style.pageBreakInside = 'avoid';
              footerElement.style.marginTop = '20px';
            }
            // 添加统一的全页面水印
            if (watermark) {
              this._addPrintWatermark(printContainer, watermark);
            }
            return [2 /*return*/, printContainer];
        }
      });
    });
  };
  /**
   * 应用打印表格布局 - 重用PDF的列宽逻辑
   */
  Exporter._applyPrintTableLayout = function (container, config, pdfOptions) {
    return __awaiter(this, void 0, void 0, function () {
      var tableContainer, tableElement, orientation, pageSize, pageWidthMm, contentWidthMm, contentWidthPx, columns, visibleColumns_1, totalConfigWidth_1, colElements_1, allRows_1, cells, headerCells;
      return __generator(this, function (_a) {
        tableContainer = container.querySelector('.ddr-table-container');
        if (!tableContainer) return [2 /*return*/];
        tableContainer.style.maxHeight = 'none';
        tableContainer.style.height = 'auto';
        tableContainer.style.overflow = 'visible';
        tableElement = tableContainer.querySelector('table');
        if (!tableElement) return [2 /*return*/];
        orientation = pdfOptions.orientation || 'portrait';
        pageSize = pdfOptions.pageSize || 'A4';
        console.log("\uD83D\uDDA8\uFE0F \u5E94\u7528\u6253\u5370\u8868\u683C\u5E03\u5C40\uFF1A".concat(pageSize, " ").concat(orientation));
        pageWidthMm = orientation === 'landscape' ? pageSize === 'A4' ? 297 : 279 :
        // A4横版297mm, Letter横版279mm
        pageSize === 'A4' ? 210 : 216;
        contentWidthMm = pageWidthMm - 30;
        contentWidthPx = Math.floor(contentWidthMm * 3.78);
        console.log("\uD83D\uDDA8\uFE0F \u6253\u5370\u9875\u9762\u5BBD\u5EA6\uFF1A".concat(pageWidthMm, "mm\uFF0C\u5185\u5BB9\u5BBD\u5EA6\uFF1A").concat(contentWidthMm, "mm (").concat(contentWidthPx, "px)"));
        // 设置表格宽度和布局
        tableElement.style.width = '100%';
        tableElement.style.maxWidth = "".concat(contentWidthPx, "px");
        tableElement.style.tableLayout = 'fixed';
        tableElement.style.borderCollapse = 'collapse';
        // 重新计算列宽（类似PDF逻辑）
        if (config === null || config === void 0 ? void 0 : config.columns) {
          columns = this._getFlatColumns(config.columns);
          visibleColumns_1 = columns.filter(function (col) {
            return col.visible !== false;
          });
          totalConfigWidth_1 = 0;
          visibleColumns_1.forEach(function (col) {
            if (col.width) {
              totalConfigWidth_1 += typeof col.width === 'number' ? col.width : parseInt(col.width);
            }
          });
          console.log("\uD83D\uDDA8\uFE0F \u5217\u914D\u7F6E\u603B\u5BBD\u5EA6\uFF1A".concat(totalConfigWidth_1, "px\uFF0C\u76EE\u6807\u5BBD\u5EA6\uFF1A").concat(contentWidthPx, "px"));
          colElements_1 = tableElement.querySelectorAll('col');
          allRows_1 = tableElement.querySelectorAll('tr');
          visibleColumns_1.forEach(function (col, index) {
            var columnWidth;
            if (col.width) {
              var configWidth = typeof col.width === 'number' ? col.width : parseInt(col.width);
              // 按比例缩放到打印页面宽度
              columnWidth = Math.floor(configWidth / totalConfigWidth_1 * contentWidthPx);
            } else {
              // 平均分配剩余宽度
              columnWidth = Math.floor(contentWidthPx / visibleColumns_1.length);
            }
            console.log("\uD83D\uDDA8\uFE0F \u5217 \"".concat(col.key, "\" \u5BBD\u5EA6\uFF1A").concat(columnWidth, "px"));
            // 设置col元素宽度
            if (colElements_1[index]) {
              colElements_1[index].style.width = "".concat(columnWidth, "px");
            }
            // 设置所有行的对应单元格宽度
            allRows_1.forEach(function (row) {
              var cells = row.querySelectorAll('td, th');
              if (cells[index]) {
                var cell = cells[index];
                cell.style.width = "".concat(columnWidth, "px");
                cell.style.maxWidth = "".concat(columnWidth, "px");
                cell.style.minWidth = "".concat(columnWidth, "px");
                cell.style.boxSizing = 'border-box';
              }
            });
          });
        }
        cells = tableElement.querySelectorAll('td, th');
        cells.forEach(function (cell) {
          var cellElement = cell;
          cellElement.style.border = '1px solid #ddd';
          cellElement.style.padding = '6px 8px';
          cellElement.style.fontSize = '11px';
          cellElement.style.lineHeight = '1.3';
          cellElement.style.wordWrap = 'break-word';
          cellElement.style.overflow = 'hidden';
        });
        headerCells = tableElement.querySelectorAll('th');
        headerCells.forEach(function (cell) {
          var cellElement = cell;
          cellElement.style.backgroundColor = '#f5f5f5';
          cellElement.style.fontWeight = 'bold';
          cellElement.style.fontSize = '11px';
        });
        return [2 /*return*/];
      });
    });
  };
  /**
   * 获取扁平化的列配置（重用PDF逻辑）
   */
  Exporter._getFlatColumns = function (columns) {
    var flatColumns = [];
    var flatten = function (cols) {
      cols.forEach(function (col) {
        if (col.children && col.children.length > 0) {
          flatten(col.children);
        } else {
          flatColumns.push(col);
        }
      });
    };
    flatten(columns);
    return flatColumns;
  };
  /**
   * 创建打印样式
   */
  Exporter._createPrintStyle = function (orientation, pageSize) {
    var style = document.createElement('style');
    style.className = 'ddr-print-style';
    // 根据页面方向和大小设置样式
    var pageRule = orientation === 'landscape' ? 'landscape' : 'portrait';
    var sizeRule = pageSize.toLowerCase();
    style.textContent = "\n      @media print {\n        @page {\n          size: ".concat(sizeRule, " ").concat(pageRule, ";\n          margin: 15mm;\n        }\n\n        body {\n          margin: 0;\n          padding: 0;\n          font-family: Arial, sans-serif;\n          font-size: 12px;\n          line-height: 1.4;\n          color: #000;\n          background: #fff;\n        }\n\n        .ddr-print-container {\n          width: 100% !important;\n          height: auto !important;\n          overflow: visible !important;\n          position: relative !important;\n          left: 0 !important;\n          top: 0 !important;\n          margin: 0 !important;\n          padding: 0 !important;\n          box-shadow: none !important;\n          border: none !important;\n        }\n\n        .ddr-table-container {\n          overflow: visible !important;\n          height: auto !important;\n          max-height: none !important;\n        }\n\n        .ddr-table {\n          width: 100% !important;\n          border-collapse: collapse !important;\n          page-break-inside: auto !important;\n        }\n\n        .ddr-table-row {\n          page-break-inside: avoid !important;\n          page-break-after: auto !important;\n        }\n\n        .ddr-header, .ddr-report-header {\n          page-break-inside: avoid !important;\n          page-break-after: avoid !important;\n        }\n\n        .ddr-footer, .ddr-report-footer {\n          page-break-inside: avoid !important;\n          page-break-before: avoid !important;\n        }\n\n        .ddr-print-watermark {\n          position: fixed !important;\n          top: 0 !important;\n          left: 0 !important;\n          width: 100vw !important;\n          height: 100vh !important;\n          pointer-events: none !important;\n          z-index: 999 !important;\n          opacity: 0.15 !important;\n          overflow: hidden !important;\n        }\n\n        .ddr-print-watermark-text {\n          position: absolute !important;\n          font-size: 24px !important;\n          font-weight: bold !important;\n          color: #ccc !important;\n          transform: rotate(-45deg) !important;\n          white-space: nowrap !important;\n          user-select: none !important;\n        }\n\n        /* \u9690\u85CF\u4E0D\u9700\u8981\u6253\u5370\u7684\u5143\u7D20 */\n        .no-print {\n          display: none !important;\n        }\n      }\n    ");
    return style;
  };
  /**
   * 添加统一的全页面打印水印
   */
  Exporter._addPrintWatermark = function (container, watermark) {
    console.log("\uD83D\uDDA8\uFE0F \u6DFB\u52A0\u7EDF\u4E00\u7684\u5168\u9875\u9762\u6253\u5370\u6C34\u5370: \"".concat(watermark, "\""));
    // 创建水印容器，覆盖整个打印容器
    var watermarkContainer = document.createElement('div');
    watermarkContainer.className = 'ddr-print-watermark';
    // 设置水印容器样式 - 覆盖整个容器
    watermarkContainer.style.position = 'fixed'; // 使用fixed定位确保覆盖整个视口
    watermarkContainer.style.top = '0';
    watermarkContainer.style.left = '0';
    watermarkContainer.style.width = '100vw';
    watermarkContainer.style.height = '100vh';
    watermarkContainer.style.pointerEvents = 'none';
    watermarkContainer.style.zIndex = '999'; // 提高z-index确保显示在最上层
    watermarkContainer.style.overflow = 'hidden';
    watermarkContainer.style.opacity = '0.15'; // 设置透明度
    // 计算水印布局 - 更密集的平铺
    var rows = 8; // 增加行数
    var cols = 6; // 增加列数
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var watermarkText = document.createElement('div');
        watermarkText.className = 'ddr-print-watermark-text';
        watermarkText.textContent = watermark;
        // 设置水印文字样式
        watermarkText.style.position = 'absolute';
        watermarkText.style.fontSize = '24px'; // 统一的字体大小
        watermarkText.style.fontWeight = 'bold';
        watermarkText.style.color = '#ccc'; // 调整颜色
        watermarkText.style.opacity = '1'; // 不设置额外透明度，由容器控制
        watermarkText.style.whiteSpace = 'nowrap';
        watermarkText.style.userSelect = 'none';
        watermarkText.style.pointerEvents = 'none';
        // 计算位置 - 均匀分布
        var x = (col + 0.5) * (100 / cols);
        var y = (row + 0.5) * (100 / rows);
        watermarkText.style.left = "".concat(x, "%");
        watermarkText.style.top = "".concat(y, "%");
        watermarkText.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
        watermarkText.style.transformOrigin = 'center';
        watermarkContainer.appendChild(watermarkText);
      }
    }
    // 将水印容器添加到body，确保在打印时覆盖整个页面
    document.body.appendChild(watermarkContainer);
    // 标记水印容器，以便后续清理
    watermarkContainer.setAttribute('data-ddr-print-watermark', 'true');
    console.log("\uD83D\uDDA8\uFE0F \u6C34\u5370\u6DFB\u52A0\u5B8C\u6210\uFF0C\u5171\u521B\u5EFA ".concat(rows * cols, " \u4E2A\u6C34\u5370\u5143\u7D20"));
  };
  return Exporter;
}();

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Exporter: Exporter
});

export { DDRReport, DDRReport as default };
//# sourceMappingURL=ddr-react.js.map
