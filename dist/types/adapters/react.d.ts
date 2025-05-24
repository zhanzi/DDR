import React from 'react';
import { DDROptions, DDRInstance } from '../types';
interface DDRReactProps extends Omit<DDROptions, 'container'> {
    className?: string;
    style?: React.CSSProperties;
    onDataLoaded?: (data: any) => void;
    onRenderComplete?: () => void;
    onError?: (error: Error) => void;
    _fetchData?: () => Promise<any>;
}
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
export declare const DDRReport: React.ForwardRefExoticComponent<DDRReactProps & React.RefAttributes<DDRReportRef>>;
export default DDRReport;
