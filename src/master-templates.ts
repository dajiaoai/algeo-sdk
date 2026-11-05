import type {
  MasterTemplateCallbacks,
  MasterTemplateOperation,
} from './shared';

/** 校验 iframe 参数和宿主返回值，所有操作只调用已声明的宿主回调。 */
export async function executeMasterTemplateCallback(
  callbacks: MasterTemplateCallbacks,
  operation: MasterTemplateOperation,
  args: string[],
): Promise<unknown> {
  if (operation !== 'listSystem' || !Array.isArray(args) || args.length !== 0) {
    throw new Error('无效的母版请求参数');
  }
  const callback = callbacks[operation];
  if (typeof callback !== 'function')
    throw new Error(`宿主未配置 masterTemplates.${operation}`);
  const result = await callback.call(callbacks);
  const ids = new Set<string>();
  if (
    !Array.isArray(result) ||
    !result.every((item) => {
      if (
        !item ||
        typeof item.id !== 'string' ||
        !item.id.trim() ||
        ids.has(item.id) ||
        typeof item.name !== 'string' ||
        typeof item.content !== 'string' ||
        (item.created_at !== undefined &&
          typeof item.created_at !== 'string') ||
        (item.edited_at != null && typeof item.edited_at !== 'string')
      )
        return false;
      ids.add(item.id);
      return true;
    })
  )
    throw new Error('母版列表必须返回含唯一 id、name、content 的数组');
  return result;
}
