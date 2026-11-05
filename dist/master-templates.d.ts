import type { MasterTemplateCallbacks, MasterTemplateOperation } from './shared';
/** 校验 iframe 参数和宿主返回值，所有操作只调用已声明的宿主回调。 */
export declare function executeMasterTemplateCallback(callbacks: MasterTemplateCallbacks, operation: MasterTemplateOperation, args: string[]): Promise<unknown>;
