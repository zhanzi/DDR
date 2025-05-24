"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.DOMRenderer = void 0;
/**
 * DOM渲染引擎
 * 适合中小数据量的报表渲染
 */
var DOMRenderer = /** @class */ (function () {
    /**
     * 创建DOM渲染引擎
     * @param container 容器元素
     * @param data 报表数据
     * @param columns 列配置
     * @param formatters 格式化函数
     */
    function DOMRenderer(container, data, columns, formatters) {
        if (formatters === void 0) { formatters = {}; }
        this.formatters = {};
        this.container = container;
        this.data = data;
        this.columns = columns;
        this.formatters = formatters;
        // 创建表格结构
        this.tableElement = document.createElement('table');
        this.tableElement.className = 'ddr-table';
        this.headerElement = document.createElement('thead');
        this.headerElement.className = 'ddr-table-header';
        this.bodyElement = document.createElement('tbody');
        this.bodyElement.className = 'ddr-table-body';
        this.tableElement.appendChild(this.headerElement);
        this.tableElement.appendChild(this.bodyElement);
        // 添加到容器
        this.container.appendChild(this.tableElement);
        // 渲染表格
        this.render();
    }
    /**
     * 渲染报表
     */
    DOMRenderer.prototype.render = function () {
        this.renderHeader();
        this.renderBody();
    };
    /**
     * 渲染表头
     */
    DOMRenderer.prototype.renderHeader = function () {
        var _this = this;
        // 清空表头
        this.headerElement.innerHTML = '';
        // 创建表头行
        var headerRow = document.createElement('tr');
        // 创建表头单元格
        this.columns.forEach(function (column) {
            if (column.visible !== false) {
                var th = document.createElement('th');
                th.className = 'ddr-table-cell ddr-table-header-cell';
                th.textContent = column.title;
                // 设置单元格宽度
                if (column.width) {
                    th.style.width = typeof column.width === 'number' ? "".concat(column.width, "px") : column.width;
                }
                // 设置对齐方式
                if (column.align) {
                    th.style.textAlign = column.align;
                }
                // 设置固定列
                if (column.fixed) {
                    th.classList.add("ddr-table-fixed-".concat(column.fixed));
                }
                // 添加排序功能(如果配置了)
                if (column.sort) {
                    th.classList.add('ddr-table-sortable');
                    th.addEventListener('click', function () { return _this.handleSort(column.key); });
                }
                headerRow.appendChild(th);
            }
        });
        this.headerElement.appendChild(headerRow);
    };
    /**
     * 处理排序
     * @param key 排序字段
     */
    DOMRenderer.prototype.handleSort = function (key) {
        // 获取当前排序方向
        var headerCell = Array.from(this.headerElement.querySelectorAll('th'))
            .find(function (th) { return th.getAttribute('data-key') === key; });
        if (!headerCell)
            return;
        var currentDirection = headerCell.getAttribute('data-sort-direction');
        var newDirection = null;
        // 切换排序方向
        if (currentDirection === 'asc') {
            newDirection = 'desc';
        }
        else if (currentDirection === 'desc') {
            newDirection = null;
        }
        else {
            newDirection = 'asc';
        }
        // 重置所有列的排序状态
        this.headerElement.querySelectorAll('th').forEach(function (th) {
            th.removeAttribute('data-sort-direction');
            th.classList.remove('ddr-table-sort-asc', 'ddr-table-sort-desc');
        });
        // 设置当前列的排序状态
        if (newDirection) {
            headerCell.setAttribute('data-sort-direction', newDirection);
            headerCell.classList.add("ddr-table-sort-".concat(newDirection));
            // 排序数据
            this.sortData(key, newDirection);
        }
        else {
            // 恢复原始顺序
            this.restoreOriginalOrder();
        }
    };
    /**
     * 排序数据
     * @param key 排序字段
     * @param direction 排序方向
     */
    DOMRenderer.prototype.sortData = function (key, direction) {
        // 复制数据进行排序
        var sortedData = __spreadArray([], this.data, true).sort(function (a, b) {
            var valueA = a[key];
            var valueB = b[key];
            // 处理null和undefined
            if (valueA == null && valueB == null)
                return 0;
            if (valueA == null)
                return direction === 'asc' ? -1 : 1;
            if (valueB == null)
                return direction === 'asc' ? 1 : -1;
            // 比较值
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction === 'asc' ? valueA - valueB : valueB - valueA;
            }
            else {
                var strA = String(valueA).toLowerCase();
                var strB = String(valueB).toLowerCase();
                return direction === 'asc' ?
                    strA.localeCompare(strB) :
                    strB.localeCompare(strA);
            }
        });
        // 更新数据并重新渲染表格体
        this.data = sortedData;
        this.renderBody();
    };
    /**
     * 恢复原始顺序
     */
    DOMRenderer.prototype.restoreOriginalOrder = function () {
        // 这里需要有原始数据的备份，或者重新获取数据
        // 为简化示例，假设数据会重新加载
        this.renderBody();
    };
    /**
     * 渲染表格体
     */
    DOMRenderer.prototype.renderBody = function () {
        var _this = this;
        // 清空表格体
        this.bodyElement.innerHTML = '';
        // 没有数据时显示空状态
        if (this.data.length === 0) {
            var emptyRow = document.createElement('tr');
            var emptyCell = document.createElement('td');
            emptyCell.className = 'ddr-table-empty';
            emptyCell.colSpan = this.columns.filter(function (col) { return col.visible !== false; }).length;
            emptyCell.textContent = '暂无数据';
            emptyRow.appendChild(emptyCell);
            this.bodyElement.appendChild(emptyRow);
            return;
        }
        // 记录需要合并的单元格
        var merges = new Map();
        // 遍历数据创建行
        this.data.forEach(function (rowData, rowIndex) {
            var row = document.createElement('tr');
            row.className = 'ddr-table-row';
            // 添加斑马纹样式
            if (rowIndex % 2 === 1) {
                row.classList.add('ddr-table-row-striped');
            }
            // 创建单元格
            var colIndex = 0;
            _this.columns.forEach(function (column) {
                var _a, _b;
                if (column.visible !== false) {
                    // 检查是否已经被合并跳过
                    var cellKey = "".concat(rowIndex, "-").concat(colIndex);
                    if (merges.has(cellKey) && ((_a = merges.get(cellKey)) === null || _a === void 0 ? void 0 : _a.rowSpan) === 0) {
                        colIndex++;
                        return;
                    }
                    var cellValue = rowData[column.key];
                    var formattedValue = _this.formatCellValue(cellValue, column);
                    var td = document.createElement('td');
                    td.className = 'ddr-table-cell';
                    td.innerHTML = formattedValue;
                    // 设置对齐方式
                    if (column.align) {
                        td.style.textAlign = column.align;
                    }
                    // 设置固定列
                    if (column.fixed) {
                        td.classList.add("ddr-table-fixed-".concat(column.fixed));
                    }
                    // 处理单元格合并
                    if (column.merge) {
                        _this.handleCellMerge(td, rowData, column, rowIndex, colIndex, merges);
                    }
                    // 应用条件样式
                    if ((_b = column.style) === null || _b === void 0 ? void 0 : _b.conditional) {
                        _this.applyConditionalStyle(td, rowData, column);
                    }
                    row.appendChild(td);
                    colIndex++;
                }
            });
            _this.bodyElement.appendChild(row);
        });
    };
    /**
     * 处理单元格合并
     */
    DOMRenderer.prototype.handleCellMerge = function (td, rowData, column, rowIndex, colIndex, merges) {
        // 只处理垂直合并(相同值的行合并)
        if (column.merge === 'vertical') {
            var currentValue = rowData[column.key];
            var rowSpan = 1;
            // 向下查找相同值的连续单元格
            for (var i = rowIndex + 1; i < this.data.length; i++) {
                var nextValue = this.data[i][column.key];
                if (nextValue === currentValue) {
                    rowSpan++;
                    // 标记被合并的单元格，后面遇到时跳过
                    var skipKey = "".concat(i, "-").concat(colIndex);
                    merges.set(skipKey, { rowSpan: 0, colSpan: 0 });
                }
                else {
                    break;
                }
            }
            if (rowSpan > 1) {
                td.rowSpan = rowSpan;
            }
        }
    };
    /**
     * 应用条件样式
     */
    DOMRenderer.prototype.applyConditionalStyle = function (td, rowData, column) {
        var _a;
        if (!((_a = column.style) === null || _a === void 0 ? void 0 : _a.conditional))
            return;
        for (var _i = 0, _b = column.style.conditional; _i < _b.length; _i++) {
            var condition = _b[_i];
            var when = condition.when, style = condition.style;
            // 简单的条件解析和执行
            try {
                var result = this.evaluateCondition(when, rowData);
                if (result) {
                    // 应用样式
                    Object.entries(style).forEach(function (_a) {
                        var prop = _a[0], value = _a[1];
                        td.style[prop] = value;
                    });
                    break; // 只应用第一个匹配的条件
                }
            }
            catch (error) {
                console.error('条件表达式解析错误:', error);
            }
        }
    };
    /**
     * 评估条件表达式
     * 支持简单的条件语法，如: "amount > 100" 或 "status === 'completed'"
     */ DOMRenderer.prototype.evaluateCondition = function (condition, rowData) {
        // 替换字段名为实际值 - 增强处理，支持字段名称作为变量
        var replacedCondition = condition;
        // 获取所有可能的字段名
        Object.keys(rowData).forEach(function (key) {
            // 创建一个正则表达式匹配整个单词
            var regex = new RegExp("\\b".concat(key, "\\b"), 'g');
            if (rowData[key] !== undefined) {
                if (typeof rowData[key] === 'string') {
                    replacedCondition = replacedCondition.replace(regex, "\"".concat(rowData[key], "\""));
                }
                else {
                    replacedCondition = replacedCondition.replace(regex, rowData[key]);
                }
            }
        });
        try {
            // 使用Function构造函数动态执行条件表达式
            return Function('return ' + replacedCondition)();
        }
        catch (error) {
            console.error('条件表达式执行错误:', error);
            return false;
        }
    };
    /**
     * 格式化单元格值
     */
    DOMRenderer.prototype.formatCellValue = function (value, column) {
        if (value === undefined || value === null) {
            return '';
        }
        // 如果列有格式化配置
        if (column.formatter) {
            if (typeof column.formatter === 'string') {
                // 检查是否有注册的格式化函数
                if (this.formatters[column.formatter]) {
                    return this.formatters[column.formatter](value);
                }
                // 基本内置格式化器
                switch (column.formatter) {
                    case 'date':
                        return new Date(value).toLocaleDateString();
                    case 'currency':
                        return new Intl.NumberFormat('zh-CN', {
                            style: 'currency',
                            currency: 'CNY'
                        }).format(Number(value));
                    case 'number':
                        return new Intl.NumberFormat('zh-CN').format(Number(value));
                    default:
                        return String(value);
                }
            }
            else if (typeof column.formatter === 'object') {
                // 复杂格式化器
                var _a = column.formatter, type = _a.type, params = _a.params;
                switch (type) {
                    case 'date':
                        return new Date(value).toLocaleDateString();
                    case 'currency':
                        return new Intl.NumberFormat('zh-CN', {
                            style: 'currency',
                            currency: (params === null || params === void 0 ? void 0 : params.currency) || 'CNY'
                        }).format(Number(value));
                    case 'number':
                        return new Intl.NumberFormat('zh-CN', {
                            minimumFractionDigits: (params === null || params === void 0 ? void 0 : params.precision) || 0,
                            maximumFractionDigits: (params === null || params === void 0 ? void 0 : params.precision) || 0,
                            useGrouping: (params === null || params === void 0 ? void 0 : params.thousandSeparator) !== false
                        }).format(Number(value));
                    default:
                        return String(value);
                }
            }
        }
        // 默认直接转为字符串
        return String(value);
    };
    /**
     * 设置数据
     * @param data 新数据
     */
    DOMRenderer.prototype.setData = function (data) {
        this.data = data;
        this.renderBody();
    };
    /**
     * 销毁资源
     */
    DOMRenderer.prototype.destroy = function () {
        // 移除表格
        this.tableElement.remove();
    };
    return DOMRenderer;
}());
exports.DOMRenderer = DOMRenderer;
