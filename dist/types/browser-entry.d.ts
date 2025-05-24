import { DDROptions, DDRInstance } from './types';
declare function DDR(options: DDROptions): DDRInstance;
declare namespace DDR {
    var create: (options: DDROptions) => DDRInstance;
    var registerFormatter: (name: string, formatter: Function) => void;
}
export default DDR;
