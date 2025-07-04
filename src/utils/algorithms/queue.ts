import type { TUniqueObjectQueueItem, TUniqueObjectQueueItems, TObjectQueueItems } from "./types"

export class ObjectQueue<T> {
   private items: TObjectQueueItems<T>
   private head: number
   private tail: number

   constructor() {
      this.items = {}
      this.head = 0
      this.tail = 0
   }

   // Thêm phần tử vào cuối queue
   enqueue(item: T): void {
      this.items[this.tail] = item
      this.tail++
   }

   // Lấy và xóa phần tử đầu tiên
   dequeue(): T | undefined {
      if (this.isEmpty()) {
         return undefined
      }

      const item = this.items[this.head]
      delete this.items[this.head]
      this.head++
      return item
   }

   // Lấy phần tử đầu tiên mà không xóa
   peek(): T | undefined {
      return this.isEmpty() ? undefined : this.items[this.head]
   }

   // Kiểm tra queue rỗng
   isEmpty(): boolean {
      return this.size() === 0
   }

   // Kích thước queue
   size(): number {
      return this.tail - this.head
   }

   // Làm rỗng queue
   clear(): void {
      this.items = {}
      this.head = 0
      this.tail = 0
   }
}

export class UniqueObjectQueue<T extends TUniqueObjectQueueItem> {
   private items: TUniqueObjectQueueItems<T>
   private head: number
   private tail: number

   constructor() {
      this.items = {}
      this.head = 0 // Chỉ số đầu queue
      this.tail = 0 // Chỉ số cuối queue
   }

   // Kiểm tra xem phần tử có trùng id với bất kỳ phần tử nào trong items không
   isDuplicate(itemId: T["id"]): boolean {
      for (let i = this.head; i < this.tail; i++) {
         const item = this.items[i]
         if (item && item.id === itemId) {
            return true // Tìm thấy trùng lặp
         }
      }
      return false // Không có trùng lặp
   }

   // Thêm phần tử vào cuối queue
   enqueue(item: T): void {
      this.items[this.tail] = item
      this.tail++
   }

   // Lấy và xóa phần tử đầu tiên
   dequeue(): T | null {
      if (this.isEmpty()) return null
      const item = this.items[this.head]
      delete this.items[this.head] // Xóa phần tử
      this.head++
      return item
   }

   // Kiểm tra queue rỗng
   isEmpty(): boolean {
      return this.head === this.tail
   }

   // Lấy phần tử đầu tiên mà không xóa
   peek(): T | null {
      if (this.isEmpty()) return null
      return this.items[this.head]
   }

   // Kích thước queue
   size(): number {
      return this.tail - this.head
   }

   // Làm rỗng queue
   clear(): void {
      this.items = {}
      this.head = 0
      this.tail = 0
   }
}
