"use client"
console.log("====HEHE FILE direct-chat/type-message-bar.tsx LOADED ====")
import { CustomTooltip, IconButton } from "@/components/materials"
import { Mic, Paperclip, Send, Smile, Sticker } from "lucide-react"
import { chattingService } from "@/services/chatting.service"
import { useUser } from "@/hooks/user"
import { AutoResizeTextField } from "@/components/materials"
import { useAppSelector } from "@/hooks/redux"
import { memo, useEffect, useRef, useState, Suspense, lazy } from "react"
import { useRootLayoutContext } from "@/hooks/layout"
import { createPortal } from "react-dom"
import { renderToStaticMarkup } from "react-dom/server"
import { eventEmitter } from "@/utils/event-emitter/event-emitter"
import { EInternalEvents } from "@/utils/event-emitter/events"
import { clientSocket } from "@/utils/socket/client-socket"
import { ESocketEvents } from "@/utils/socket/events"
import type { TDirectChat, TSticker } from "@/utils/types/be-api"
import type { TEmoji } from "@/utils/types/global"
import { EMessageTypes } from "@/utils/enums"
import { toast } from "sonner"
import { uploadFile } from "@/apis/upload"

const LazyEmojiPicker = lazy(() => import("../../../components/materials/emoji-picker"))
const LazyStickerPicker = lazy(() => import("../../../components/materials/sticker-picker"))

const Fallback = () => (
  <div className="rounded-lg overflow-hidden w-full h-inside-expression-picker"></div>
)

const EmojiImg = ({ name, src }: TEmoji) => {
  return <img className="STYLE-emoji-img" src={src} alt={name} />
}

type TExpressionCategory = "emoji" | "sticker"

type TExpressionPickerProps = {
  textFieldRef: React.RefObject<HTMLDivElement | null>
  expressionPopoverRef: React.RefObject<HTMLDivElement | null>
  directChat: TDirectChat
}

const ExpressionPicker = ({
  textFieldRef,
  expressionPopoverRef,
  directChat,
}: TExpressionPickerProps) => {
  const [showPicker, setShowPicker] = useState<boolean>(false)
  const [category, setCategory] = useState<TExpressionCategory>("emoji")
  const addEmojiBtnRef = useRef<HTMLButtonElement>(null)
  const appRootEle = useRootLayoutContext().appRootRef!.current!
  const user = useUser()!
  const { recipientId, creatorId, id } = directChat
  const handleSelectEmoji = (emojiObject: TEmoji) => {
    const textField = textFieldRef.current
    if (textField) {
      const emojiInString = renderToStaticMarkup(
        <EmojiImg name={emojiObject.name} src={emojiObject.src} />
      )
      eventEmitter.emit(EInternalEvents.MSG_TEXTFIELD_EDITED, { content: emojiInString })
    }
  }

  const handleSelectSticker = (sticker: TSticker) => {
    chattingService.sendMessage(
      EMessageTypes.STICKER,
      {
        content: sticker.imageUrl,
        receiverId: user.id === recipientId ? creatorId : recipientId,
        directChatId: id,
        token: chattingService.getMessageToken(),
        timestamp: new Date(),
      },
      (data) => {
        if ("success" in data && data.success) {
          chattingService.setAcknowledgmentFlag(true)
          chattingService.recursiveSendingQueueMessages()
        } else if ("isError" in data && data.isError) {
          console.log(">>> data err:", data)
          toast.error("Error when sending message")
        }
      }
    )
  }

  const toggleEmojiPicker = () => {
    setShowPicker((prev) => !prev)
  }

  const detectCollisionAndAdjust = () => {
    const addEmojiBtn = addEmojiBtnRef.current
    const addEmojiPopover = expressionPopoverRef.current
    if (addEmojiBtn && addEmojiPopover) {
      const buttonRect = addEmojiBtn.getBoundingClientRect()
      const popoverRect = addEmojiPopover.getBoundingClientRect()

      const conversationsListRect = (
        appRootEle.querySelector("#QUERY-conversations-list") as HTMLElement
      ).getBoundingClientRect()

      let top: number = buttonRect.top - popoverRect.height - 25
      let left: number = buttonRect.left + buttonRect.width / 2 - popoverRect.width / 2
      const conversationsListRight = conversationsListRect.right

      top = top < 0 ? 10 : top
      left = left < conversationsListRight + 10 ? conversationsListRight + 10 : left

      addEmojiPopover.style.cssText = `top: ${top}px; left: ${left}px; position: fixed; z-index: 99;`

      requestAnimationFrame(() => {
        addEmojiPopover.classList.add("animate-scale-up", "origin-bottom")
      })
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    const addEmojiPopover = expressionPopoverRef.current
    if (addEmojiPopover) {
      if (
        !addEmojiPopover.contains(e.target as Node) &&
        !addEmojiBtnRef.current?.contains(e.target as Node)
      ) {
        setShowPicker(false)
      }
    }
  }

  useEffect(() => {
    eventEmitter.on(EInternalEvents.CLICK_ON_LAYOUT, handleClickOutside)
    return () => {
      eventEmitter.off(EInternalEvents.CLICK_ON_LAYOUT, handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (showPicker) {
      detectCollisionAndAdjust()
    }
  }, [showPicker])

  return (
    <div className="flex text-regular-icon-cl hover:text-regular-violet-cl relative bottom-0 left-0 cursor-pointer">
      {showPicker &&
        createPortal(
          <div
            ref={expressionPopoverRef}
            className="fixed top-0 left-0 rounded-lg h-expression-picker w-expression-picker bg-expression-picker-bgcl"
          >
            <Suspense fallback={<Fallback />}>
              {category === "emoji" ? (
                <LazyEmojiPicker onSelectEmoji={handleSelectEmoji} />
              ) : (
                <LazyStickerPicker onSelectSticker={handleSelectSticker} />
              )}
            </Suspense>
            <div className="flex items-center justify-center gap-3 w-full h-nav-expression-picker px-2 pt-0 pb-2.5">
              <IconButton title={{ text: "Emoji" }} onClick={() => setCategory("emoji")}>
                <Smile className="h-6 w-6 text-regular-icon-cl" />
              </IconButton>
              <IconButton title={{ text: "Sticker" }} onClick={() => setCategory("sticker")}>
                <Sticker className="h-6 w-6 text-regular-icon-cl" />
              </IconButton>
            </div>
          </div>,
          document.body
        )}
      <button ref={addEmojiBtnRef} onClick={toggleEmojiPicker}>
        <Smile />
      </button>
    </div>
  )
}

const INDICATE_TYPING_DELAY: number = 200

type TTypingFlags = "typing" | "stop"

// Hàm custom debounce ngăn chặn việc gửi nhiều request trong 1 khoảng thời gian delay
// Sẽ không ngăn chặn nếu 2 request kế tiếp nhau là khác loại với nhau (VD: pre req là "typing" còn next req là "blur")
const useCustomDebounce = (typingFlagRef: React.RefObject<TTypingFlags | undefined>) => {
  const timer = useRef<NodeJS.Timeout>(undefined)
  return (handler: (type: TTypingFlags) => void, delayInMs: number) => {
    return (type: TTypingFlags) => {
      if (!timer.current || typingFlagRef.current !== type) {
        typingFlagRef.current = type
        handler(type)
      }
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = undefined
      }, delayInMs)
    }
  }
}

type TMessageTextFieldProps = {
  directChat: TDirectChat
  setHasContent: (hasContent: boolean) => void
  hasContent: boolean
  textFieldRef: React.RefObject<HTMLDivElement | null>
  textFieldContainerRef: React.RefObject<HTMLDivElement | null>
  expressionPopoverRef: React.RefObject<HTMLDivElement | null>
  replyMessage: any | null
  setReplyMessage: (msg: any | null) => void
}

const MessageTextField = ({
  directChat,
  setHasContent,
  hasContent,
  textFieldRef,
  textFieldContainerRef,
  expressionPopoverRef,
  replyMessage,
  setReplyMessage,
}: TMessageTextFieldProps) => {
  const { recipientId, creatorId, id } = directChat
  const user = useUser()!
  const typingFlagRef = useRef<TTypingFlags | undefined>(undefined)
  const debounce = useCustomDebounce(typingFlagRef)

  const indicateUserIsTyping = debounce((type: TTypingFlags) => {
    clientSocket.socket.emit(ESocketEvents.typing_direct, {
      receiverId: recipientId === user.id ? creatorId : recipientId,
      isTyping: type === "typing",
    })
  }, INDICATE_TYPING_DELAY)

  const handleTyping = (msg: string) => {
    if (msg.trim() && msg.length > 0) {
      setHasContent(true)
    } else {
      setHasContent(false)
    }
    indicateUserIsTyping("typing")
  }

  const sendMessage = (msgToSend: string) => {
    console.log("=== REPLY DEBUG START ===")
    console.log("replyMessage received:", replyMessage)
    console.log("replyMessage type:", typeof replyMessage)
    console.log("replyMessage.id:", replyMessage?.id)
    console.log("replyMessage content:", replyMessage?.content)

    const payload: any = {
      content: msgToSend,
      receiverId: user.id === recipientId ? creatorId : recipientId,
      directChatId: id,
      token: chattingService.getMessageToken(),
      timestamp: new Date(),
    }

    if (replyMessage && replyMessage.id) {
      payload.replyToId = replyMessage.id
      console.log("✅ replyToId SET to:", replyMessage.id)
    } else {
      console.log("❌ replyToId NOT SET - replyMessage is null or has no id")
      console.log("replyMessage exists:", !!replyMessage)
      console.log("replyMessage.id exists:", !!replyMessage?.id)
    }

    console.log("FINAL PAYLOAD:", payload)
    console.log("=== REPLY DEBUG END ===")
    chattingService.sendMessage(EMessageTypes.TEXT, payload, (data) => {
      if ("success" in data && data.success) {
        chattingService.setAcknowledgmentFlag(true)
        chattingService.recursiveSendingQueueMessages()
      } else if ("isError" in data && data.isError) {
        console.log(">>> data err:", data)
        toast.error("Error when sending message")
      }
    })
    console.log("🔄 Clearing replyMessage after sending")
    setReplyMessage(null)
  }

  const handleCatchEnter = (msg: string) => {
    sendMessage(msg)
  }

  const handleBlur = () => {
    textFieldContainerRef.current?.classList.remove("outline-regular-violet-cl")
    if (!textFieldRef.current?.innerHTML) {
      setHasContent(false)
    }
  }

  const handleClickOnLayout = (e: MouseEvent) => {
    if (
      !expressionPopoverRef.current?.contains(e.target as Node) &&
      !textFieldContainerRef.current?.contains(e.target as Node) &&
      typingFlagRef.current === "typing"
    ) {
      indicateUserIsTyping("stop")
    }
  }

  useEffect(() => {
    eventEmitter.on(EInternalEvents.CLICK_ON_LAYOUT, handleClickOnLayout)
    return () => {
      eventEmitter.off(EInternalEvents.CLICK_ON_LAYOUT, handleClickOnLayout)
    }
  }, [])

  return (
    <div className="relative bg-regular-dark-gray-cl grow py-[15.5px] px-2">
      <AutoResizeTextField
        className="block bg-transparent outline-none w-full hover:bg-transparent whitespace-pre-wrap break-all leading-tight focus:bg-transparent z-10 STYLE-styled-scrollbar border-transparent text-white hover:border-transparent focus:border-transparent focus:shadow-none"
        onEnterPress={handleCatchEnter}
        onContentChange={handleTyping}
        maxHeight={300}
        lineHeight={1.5}
        textFieldRef={textFieldRef}
        onBlur={handleBlur}
        initialHeight={21}
        textSize={14}
        id="STYLE-type-msg-bar"
      />
      <span
        className={`${hasContent ? "animate-hide-placeholder" : "animate-grow-placeholder"} leading-tight left-2.5 z-0 absolute top-1/2 -translate-y-1/2 text-regular-placeholder-cl`}
      >
        Message...
      </span>
    </div>
  )
}

const fileOptions = [
  { icon: "🖼️", label: "Photo or video", value: "photo" },
  { icon: "📄", label: "Document", value: "document" },
  { icon: "📊", label: "Create poll", value: "poll" },
  { icon: "📍", label: "Location", value: "location" },
]

function FileTypeMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute bottom-12 left-0 z-50 bg-white shadow-lg rounded-lg p-2 w-56 border border-gray-200">
      {fileOptions.map((opt) => (
        <button
          key={opt.value}
          className="flex items-center w-full px-3 py-2 hover:bg-gray-100 rounded transition text-gray-800"
          onClick={() => {
            onSelect(opt.value)
            onClose()
          }}
        >
          <span className="text-xl mr-3">{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

type TTypeMessageBarProps = {
  directChat: TDirectChat
  replyMessage: any | null
  setReplyMessage: (msg: any | null) => void
}

export const TypeMessageBar = memo(
  ({ directChat, replyMessage, setReplyMessage }: TTypeMessageBarProps) => {
    console.log("🔍 TypeMessageBar rendered with replyMessage:", replyMessage)
    const user = useUser()
    const { fetchedMsgs } = useAppSelector(({ messages }) => messages)
    const textFieldRef = useRef<HTMLDivElement | null>(null)
    const [hasContent, setHasContent] = useState<boolean>(false)
    const textFieldContainerRef = useRef<HTMLDivElement | null>(null)
    const expressionPopoverRef = useRef<HTMLDivElement>(null)
    const [showFileMenu, setShowFileMenu] = useState<boolean>(false)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [fileAccept, setFileAccept] = useState<string>("")
    const [fileMode, setFileMode] = useState<string>("")
    const [fileInputKey, setFileInputKey] = useState<number>(0)

    const handleClickOnTextFieldContainer = (e: React.MouseEvent<HTMLElement>) => {
      const textField = textFieldRef.current
      textFieldContainerRef.current?.classList.add("outline-regular-violet-cl")
      if (textField) {
        if (e.target === textField) return
        textField.focus()
        // Đặt con trỏ ở cuối nội dung
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(textField)
        range.collapse(false) // false để đặt con trỏ ở cuối, true để đặt ở đầu
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    }

    const handleFileMenuSelect = (type: string) => {
      console.log("FileTypeMenu selected:", type, fileInputRef.current)
      if (type === "photo") {
        setFileAccept("image/*,video/*")
        setFileMode("media")
        setFileInputKey((prev) => prev + 1)
        setTimeout(() => {
          console.log("Try to click file input:", fileInputRef.current)
          fileInputRef.current?.click()
        }, 0)
      } else if (type === "document") {
        setFileAccept(
          ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
        )
        setFileMode("document")
        setFileInputKey((prev) => prev + 1)
        setTimeout(() => {
          console.log("Try to click file input:", fileInputRef.current)
          fileInputRef.current?.click()
        }, 0)
      }
      // ... các case khác
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user) return
      const { recipientId, creatorId, id } = directChat
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      // Kiểm tra loại file hợp lệ theo mode
      const validFiles = files.filter((file) => {
        if (fileMode === "media") {
          return file.type.startsWith("image/") || file.type.startsWith("video/")
        }
        if (fileMode === "document") {
          return (
            file.type === "application/pdf" ||
            file.type === "application/msword" ||
            file.type ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.type === "application/vnd.ms-excel" ||
            file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.type === "application/vnd.ms-powerpoint" ||
            file.type ===
              "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
            file.type === "text/plain" ||
            [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"].some((ext) =>
              file.name.endsWith(ext)
            )
          )
        }
        // fallback: cho phép cả hai
        return (
          file.type.startsWith("image/") ||
          file.type.startsWith("video/") ||
          file.type === "application/pdf" ||
          file.type === "application/msword" ||
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.type === "application/vnd.ms-excel" ||
          file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-powerpoint" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
          file.type === "text/plain" ||
          [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"].some((ext) =>
            file.name.endsWith(ext)
          )
        )
      })

      if (validFiles.length === 0) {
        toast.error("Chỉ hỗ trợ file ảnh, video hoặc tài liệu (PDF, Word, Excel, PowerPoint, TXT)")
        return
      }

      if (validFiles.length !== files.length) {
        toast.error(`${files.length - validFiles.length} file không được hỗ trợ`)
      }

      setIsUploading(true)
      try {
        for (const file of validFiles) {
          if (file.size > 50 * 1024 * 1024) {
            toast.error(`File ${file.name} vượt quá 50MB!`)
            continue
          }
          // Upload file lên server
          const { url, fileName, fileType } = await uploadFile(file)
          let messageType = EMessageTypes.IMAGE
          if (file.type.startsWith("image/")) messageType = EMessageTypes.IMAGE
          else if (file.type.startsWith("video/")) messageType = EMessageTypes.VIDEO
          else messageType = EMessageTypes.DOCUMENT

          const msgPayload: any = {
            content: "", // hoặc caption nếu có
            mediaUrl: url,
            fileName,
            fileType,
            receiverId: user.id === recipientId ? creatorId : recipientId,
            directChatId: id,
            token: chattingService.getMessageToken(),
            timestamp: new Date(),
          }
          if (messageType === EMessageTypes.DOCUMENT) {
            msgPayload.fileSize = file.size
          }

          chattingService.sendMessage(messageType, msgPayload, (data) => {
            if ("success" in data && data.success) {
              chattingService.setAcknowledgmentFlag(true)
              chattingService.recursiveSendingQueueMessages()
            } else if ("isError" in data && data.isError) {
              toast.error(`Lỗi khi gửi file ${file.name}`)
            }
          })
        }
        toast.success(`Đã gửi ${validFiles.length} file thành công`)
      } catch (error) {
        console.error("Upload file error:", error)
        toast.error("Lỗi khi upload file")
      } finally {
        setIsUploading(false)
      }
      e.target.value = ""
    }

    // Thêm useEffect để đóng menu khi click outside
    useEffect(() => {
      if (!showFileMenu) return
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setShowFileMenu(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [showFileMenu])

    function keepOnlyImgAndSvgTags(html: string) {
      // Loại bỏ mọi thẻ không phải <img>, <svg> và các thẻ SVG con
      return html.replace(
        /<(?!img\b|svg\b|path\b|rect\b|circle\b|g\b|line\b|ellipse\b|polygon\b|polyline\b|defs\b|linearGradient\b|stop\b|title\b|desc\b)[^>]*>/gi,
        ""
      )
    }

    function renderReplyPreview(msg: any) {
      if (!msg) return "[Không có nội dung]"
      const type = (msg.type || "").toUpperCase()
      switch (type) {
        case "IMAGE":
          if (msg.imageUrl || msg.mediaUrl) {
            return (
              <span>
                [Hình ảnh]
                <img
                  src={msg.imageUrl || msg.mediaUrl}
                  alt="img"
                  style={{
                    width: 24,
                    height: 24,
                    display: "inline",
                    marginLeft: 4,
                    borderRadius: 4,
                  }}
                />
              </span>
            )
          }
          return "[Hình ảnh]"
        case "VIDEO":
          return "[Video]"
        case "DOCUMENT":
          return `[Tài liệu] ${msg.fileName || ""}`
        case "STICKER":
          if (msg.stickerUrl) {
            return (
              <span>
                [Sticker]
                <img
                  src={msg.stickerUrl}
                  alt="sticker"
                  style={{ width: 24, height: 24, display: "inline", marginLeft: 4 }}
                />
              </span>
            )
          }
          return "[Sticker]"
        case "EMOJI":
          if (msg.content && (msg.content.includes("<img") || msg.content.includes("<svg"))) {
            const cleanContent = keepOnlyImgAndSvgTags(msg.content)
            return <span dangerouslySetInnerHTML={{ __html: cleanContent }} />
          }
          return "[Emoji]"
        case "TEXT":
          return msg.content || "[Không có nội dung]"
        default:
          if (
            msg.content &&
            typeof msg.content === "string" &&
            (msg.content.includes("<img") || msg.content.includes("<svg"))
          ) {
            const cleanContent = keepOnlyImgAndSvgTags(msg.content)
            return <span dangerouslySetInnerHTML={{ __html: cleanContent }} />
          }
          return "[Không có nội dung]"
      }
    }

    return (
      <div className="flex gap-2.5 items-end pt-2 pb-4 z-999 box-border w-type-message-bar relative">
        <div className="flex flex-col grow">
          {/* Reply Preview */}
          {replyMessage && (
            <>
              {console.log("DEBUG replyMessage:", replyMessage)}
              <div className="flex items-center bg-blue-50 border-l-4 border-blue-400 rounded-t px-3 py-2 mb-1 text-xs text-gray-700">
                <span className="font-semibold mr-2">Trả lời:</span>
                <div className="truncate flex-1">{renderReplyPreview(replyMessage)}</div>
                <button
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Hủy trả lời"
                  onClick={() => setReplyMessage(null)}
                >
                  &times;
                </button>
              </div>
            </>
          )}
          <div
            onClick={handleClickOnTextFieldContainer}
            ref={textFieldContainerRef}
            className="flex cursor-text grow items-center gap-2 relative z-10 rounded-2xl bg-regular-dark-gray-cl px-3 outline-2 outline outline-regular-dark-gray-cl hover:outline-regular-violet-cl transition-[outline] duration-200"
          >
            <ExpressionPicker
              textFieldRef={textFieldRef}
              expressionPopoverRef={expressionPopoverRef}
              directChat={directChat}
            />
            <MessageTextField
              hasContent={hasContent}
              directChat={directChat}
              setHasContent={setHasContent}
              textFieldRef={textFieldRef}
              textFieldContainerRef={textFieldContainerRef}
              expressionPopoverRef={expressionPopoverRef}
              replyMessage={replyMessage}
              setReplyMessage={setReplyMessage}
            />
            <span
              className={`${isUploading ? "text-gray-400 cursor-not-allowed" : "text-gray-500 hover:text-regular-violet-cl cursor-pointer"} relative bottom-0 right-0`}
              onClick={() => {
                if (!isUploading) setShowFileMenu((v) => !v)
              }}
              role="button"
              tabIndex={0}
              style={{ outline: "none" }}
            >
              {isUploading ? (
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <Paperclip />
              )}
              {showFileMenu && (
                <div ref={menuRef}>
                  <FileTypeMenu
                    onSelect={handleFileMenuSelect}
                    onClose={() => setShowFileMenu(false)}
                  />
                </div>
              )}
            </span>
            <input
              key={fileInputKey}
              type="file"
              accept={fileAccept}
              multiple
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileSelect}
              onClick={() => console.log("Input file clicked")}
            />
          </div>
        </div>
        <CustomTooltip title={hasContent ? "Send message" : "Record voice message"} placement="top">
          <div
            className={`${hasContent ? "text-regular-violet-cl" : "text-gray-500"} bg-regular-dark-gray-cl rounded-full p-[27px] relative hover:text-white flex justify-center items-center cursor-pointer hover:bg-regular-violet-cl`}
          >
            <div className={`${hasContent ? "animate-hide-icon" : "animate-grow-icon"} absolute`}>
              <Mic />
            </div>
            <div className={`${hasContent ? "animate-grow-icon" : "animate-hide-icon"} absolute`}>
              <Send />
            </div>
          </div>
        </CustomTooltip>
      </div>
    )
  }
)
