import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { TMsgContent } from "@/utils/event-emitter/types"
import { useEffect } from "react"

const EMPTY_PLACEHOLDER_HTML: string = `<span class="QUERY-empty-placeholder"></span>`

type AutoResizeTextFieldProps = {
   textFieldRef: React.RefObject<HTMLDivElement | null>
} & Partial<{
   onContentChange: (textContent: string) => void
   onEnterPress: (textContent: string) => void
   initialValue: string
   placeholder: string
   maxHeight: number
   minHeight: number
   className: string
   id: string
   style: React.CSSProperties
   lineHeight: number
   onBlur: (e: React.FocusEvent<HTMLDivElement>) => void
   initialHeight: number
   textSize: number
   onFocus: (e: React.MouseEvent<HTMLDivElement>) => void
}>

export const AutoResizeTextField: React.FC<AutoResizeTextFieldProps> = ({
   onContentChange,
   onEnterPress,
   initialValue,
   placeholder = "Type something...",
   maxHeight = 300,
   minHeight,
   className,
   id,
   style,
   lineHeight = 1.5,
   onBlur,
   textFieldRef,
   initialHeight,
   textSize = 14,
   onFocus,
}) => {
   const setTextFieldContent = (textContent: string, textFieldEle?: HTMLDivElement) => {
      if (textFieldEle) {
         textFieldEle.innerHTML = textContent
      }
   }

   const getEmptyPlaceholderEle = (textFieldEle: HTMLDivElement) =>
      textFieldEle.querySelector(".QUERY-empty-placeholder")

   // Điều chỉnh chiều cao dựa trên nội dung
   const adjustHeight = (textFieldEle: HTMLDivElement) => {
      setTimeout(() => {
         if (textFieldEle) {
            textFieldEle.style.height = "auto"
            const newHeight = Math.min(
               Math.max(textFieldEle.scrollHeight, lineHeight * textSize, initialHeight || 0),
               maxHeight
            )
            textFieldEle.style.height = `${newHeight}px`
            // Thêm thanh cuộn khi vượt quá maxHeight
            textFieldEle.style.overflowY = textFieldEle.scrollHeight > maxHeight ? "auto" : "hidden"
         }
      }, 0)
   }

   // Xử lý khi nhập liệu
   const handleInput = (textFieldEle: HTMLDivElement) => {
      const content = textFieldEle.innerHTML
      if (content && content.length > 0) {
         // Nếu có nội dung thì xóa placeholder
         textFieldEle.querySelector(".QUERY-empty-placeholder")?.remove()
      }
      // Kiểm tra nội dung có chứa thẻ img hay không
      if (!content.includes("<img")) {
         const tempDiv = document.createElement("div")
         tempDiv.innerHTML = content
         if (tempDiv.innerText.trim().length === 0) {
            // Nếu nội dung không chứa thẻ img và không có nội dung nào khác thì đặt content thành 1 thẻ html (để giữ caret)
            setTextFieldContent(EMPTY_PLACEHOLDER_HTML, textFieldEle)
         }
      }
      if (onContentChange) {
         // Gọi hàm khi có sự thay đổi nội dung (kiểm tra trước xem content có trống không)
         if (getEmptyPlaceholderEle(textFieldEle)) {
            onContentChange("")
         } else {
            onContentChange(textFieldEle.innerHTML.trim())
         }
      }
      adjustHeight(textFieldEle)
   }

   // Xử lý sự kiện nhấn phím
   const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
         e.preventDefault()
         const textFieldEle = e.currentTarget
         if (e.shiftKey) {
            document.execCommand("insertLineBreak")
         } else {
            if (onEnterPress) {
               onEnterPress(textFieldEle.innerHTML) // Lấy text hiện tại
            }
            setTextFieldContent(EMPTY_PLACEHOLDER_HTML, textFieldEle) // Clear nội dung
            if (onContentChange) {
               onContentChange("") // Gọi hàm khi có sự thay đổi nội dung
            }
         }
         adjustHeight(textFieldEle)
      }
   }

   // Xử lý blur
   const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      if (onBlur) {
         onBlur(e)
      }
   }

   // Xử lý focus (onClick)
   const handleFocus = (e: React.MouseEvent<HTMLDivElement>) => {
      if (onFocus) {
         onFocus(e)
      }
   }

   // Xử lý sự kiện chỉnh sửa text field content
   const handleTextFieldEdited = (msgData: TMsgContent) => {
      const textFieldEle = textFieldRef.current
      if (textFieldEle) {
         textFieldEle.innerHTML += msgData.content
         handleInput(textFieldEle)
      }
   }

   // Khởi tạo component
   useEffect(() => {
      const textFieldEle = textFieldRef.current
      if (textFieldEle) {
         eventEmitter.on(EInternalEvents.MSG_TEXTFIELD_EDITED, handleTextFieldEdited)
         if (initialValue) {
            setTextFieldContent(initialValue, textFieldEle)
         } else {
            setTextFieldContent(EMPTY_PLACEHOLDER_HTML, textFieldEle)
         }
         adjustHeight(textFieldEle)
      }
      return () => {
         eventEmitter.off(EInternalEvents.MSG_TEXTFIELD_EDITED, handleTextFieldEdited)
      }
   }, [])

   return (
      <div
         ref={textFieldRef}
         contentEditable
         onInput={(e) => handleInput(e.currentTarget as HTMLDivElement)}
         onKeyDown={handleKeyDown}
         onBlur={handleBlur}
         onClick={handleFocus}
         style={{
            ...(style || {}),
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            lineHeight,
            overflowY: "hidden",
            resize: "none",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            wordBreak: "break-all",
            height: initialHeight,
            fontSize: `${textSize}px`,
         }}
         className={className}
         data-placeholder={placeholder}
         id={id}
      ></div>
   )
}
