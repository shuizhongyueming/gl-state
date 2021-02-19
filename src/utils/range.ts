// 获取某一个范围（不包含e)内的数字作为数组
export const range = (s: number, e: number) => new Array(e - s).fill('').map((n, i) => s + i);
