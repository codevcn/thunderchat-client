export type TDeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? (T[P] extends Function ? T[P] : TDeepPartial<T[P]>) : T[P]
}

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}.${P}`
    : never
  : never

type DeepKeyOf<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]: T[K] extends object ? K | Join<K, DeepKeyOf<T[K], Prev[D]>> : K
      }[keyof T]
    : never

export type THierarchyKeyObject<T> = {
  [K in DeepKeyOf<T>]: any // hoặc bạn thay `any` bằng kiểu bạn muốn
}
