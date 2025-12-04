/**
 * Cố gắng lấy file mới nhất từ thư mục người dùng đã cấp (ví dụ Downloads).
 * - Lần đầu: yêu cầu user chọn thư mục (showDirectoryPicker).
 * - Sau đó: tái sử dụng handle đã lưu ở window.__downloadsDirHandle.
 * - Chỉ đọc, không cần xác nhận lại mỗi lần.
 * - Nếu không tìm thấy hoặc chưa cấp quyền -> trả null để fallback sang input file picker.
 *
 * Giới hạn: Browser bắt buộc người dùng chọn thư mục ít nhất 1 lần. Không thể tự động
 * truy cập "Downloads" nếu chưa có quyền. Sau khi cấp, handle có thể dùng lại
 * cho session. Ta cố gắng lưu handle vào IndexedDB để dùng lại sau reload.
 */

export type LatestFileKind = "image" | "document" | "any"

interface CachedHandleWindow extends Window {
  __downloadsDirHandle?: FileSystemDirectoryHandle
}

// IndexedDB helpers để lưu/đọc directory handle (structured clone được hỗ trợ)
const DB_NAME = "voiceAssistantFS"
const STORE_NAME = "handles"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveHandle(key: string, handle: FileSystemDirectoryHandle) {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(handle, key)
  } catch (err) {
    console.warn("⚠️ Không lưu được handle:", err)
  }
}

async function loadHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readonly")
    return await new Promise((resolve) => {
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

function matchesKind(file: File, kind: LatestFileKind): boolean {
  if (kind === "any") return true
  if (kind === "image") return file.type.startsWith("image/")
  if (kind === "document") {
    return /(pdf|msword|officedocument|text|presentation|sheet|excel)/i.test(file.type)
  }
  return true
}

export async function getLatestFileFromDownloads(kind: LatestFileKind): Promise<File | null> {
  try {
    const w = window as CachedHandleWindow
    // Thử load từ IndexedDB nếu chưa có trong RAM
    if (!w.__downloadsDirHandle) {
      const restored = await loadHandle("downloads")
      if (restored) {
        console.log("💾 Phục hồi handle thư mục đã lưu từ IndexedDB")
        w.__downloadsDirHandle = restored
      }
    }
    // Nếu vẫn chưa có -> yêu cầu user chọn
    if (!w.__downloadsDirHandle) {
      if ((window as any).showDirectoryPicker) {
        console.log("📁 Chưa có thư mục được cấp quyền. Yêu cầu chọn (ví dụ Downloads)...")
        const dirHandle = await (window as any).showDirectoryPicker().catch(() => null)
        if (!dirHandle) {
          console.warn("⚠️ User không chọn thư mục")
          return null
        }
        w.__downloadsDirHandle = dirHandle
        await saveHandle("downloads", dirHandle)
        console.log("💾 Đã lưu handle thư mục vào IndexedDB")
      } else {
        console.warn("⚠️ Trình duyệt không hỗ trợ showDirectoryPicker")
        return null
      }
    }

    const dirHandle = w.__downloadsDirHandle
    if (!dirHandle) return null

    // Kiểm tra quyền (API chuẩn: queryPermission / requestPermission)
    try {
      // @ts-ignore: experimental
      if (dirHandle.queryPermission) {
        // @ts-ignore
        const cur = await dirHandle.queryPermission({ mode: "read" })
        if (cur !== "granted") {
          // @ts-ignore
          const perm = await dirHandle.requestPermission({ mode: "read" })
          if (perm !== "granted") {
            console.warn("⚠️ Không có quyền đọc thư mục")
            return null
          }
        }
      }
    } catch (permErr) {
      console.warn("⚠️ Không kiểm tra được quyền thư mục (tiếp tục thử đọc):", permErr)
    }

    let newest: { file: File; ts: number } | null = null
    let count = 0
    // Duyệt các entry (giới hạn số lượng để tránh lag)
    // @ts-ignore: iterate directory entries (File System Access API)
    for await (const entry of dirHandle.values()) {
      if (count > 300) break // an toàn
      count++
      if (!entry || entry.kind !== "file") continue
      let file: File | null = null
      try {
        file = await entry.getFile()
      } catch {
        continue
      }
      if (!file) continue
      if (!matchesKind(file, kind)) continue
      if (!newest || file.lastModified > newest.ts) {
        newest = { file, ts: file.lastModified }
      }
    }

    if (newest) {
      console.log(`📎 ✅ File mới nhất trong thư mục đã cấp: ${newest.file.name}`)
      return newest.file
    }
    console.log("ℹ️ Không tìm thấy file phù hợp trong thư mục đã cấp, sẽ fallback picker")
    return null
  } catch (err) {
    console.warn("⚠️ Lỗi khi đọc thư mục đã cấp quyền:", err)
    return null
  }
}
