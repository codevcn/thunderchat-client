/**
 * Lấy file mới nhất từ thiết bị
 * Sử dụng input file picker - dễ dùng cho người mù
 * Tự động chọn file mới nhất nếu user chọn multiple files
 */

export async function getLatestFile(type: "image" | "any" = "any"): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    // Cho phép multiple files để system lấy cái newest
    input.multiple = true
    input.accept = type === "image" ? "image/*" : "*/*"

    input.onchange = () => {
      if (!input.files || input.files.length === 0) {
        resolve(null)
        return
      }

      // Nếu user chọn multiple files, tự động lấy file mới nhất
      let newestFile: File | null = null
      let newestTime = 0

      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i]
        if (file.lastModified > newestTime) {
          if (type === "image" && !file.type.startsWith("image/")) continue
          newestTime = file.lastModified
          newestFile = file
        }
      }

      if (newestFile) {
        console.log(`📎 ✅ Tìm được file mới nhất: ${newestFile.name}`)
        resolve(newestFile)
      } else {
        console.log(`❌ Không tìm thấy ${type === "image" ? "ảnh" : "file"} phù hợp`)
        resolve(null)
      }
    }

    input.click()
  })
}
