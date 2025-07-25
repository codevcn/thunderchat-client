"use client"

import { CustomTooltip, IconButton } from "@/components/materials"
import {
  Download,
  FileVideo,
  Mic,
  Paperclip,
  Reply,
  Send,
  Smile,
  Sticker,
  Trash,
  X,
  Image as ImageIcon,
  FileText,
  BarChart2,
  MapPin,
} from "lucide-react"
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
import type { TEmoji, TStateDirectMessage } from "@/utils/types/global"
import { EMessageTypes } from "@/utils/enums"
import { toast } from "sonner"
import { uploadFile } from "@/apis/upload"
import { santizeMsgContent } from "@/utils/helpers"

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
    if (!msgToSend || !msgToSend.trim()) {
      toast.error("Message cannot be empty")
      return
    }

    const payload: any = {
      content: msgToSend,
      receiverId: user.id === recipientId ? creatorId : recipientId,
      directChatId: id,
      token: chattingService.getMessageToken(),
      timestamp: new Date(),
    }

    if (replyMessage && replyMessage.id) {
      payload.replyToId = replyMessage.id
    }

    chattingService.sendMessage(EMessageTypes.TEXT, payload, (data) => {
      if ("success" in data && data.success) {
        chattingService.setAcknowledgmentFlag(true)
        chattingService.recursiveSendingQueueMessages()
      } else if ("isError" in data && data.isError) {
        console.log(">>> data err:", data)
        toast.error("Error when sending message")
      }
    })
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
  { icon: <ImageIcon size={20} />, label: "Photo or video", value: "photo" },
  { icon: <FileText size={20} />, label: "Document", value: "document" },
  { icon: <BarChart2 size={20} />, label: "Create poll", value: "poll" },
  { icon: <MapPin size={20} />, label: "Location", value: "location" },
]

function FileTypeMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute bottom-12 left-0 z-50 bg-regular-dark-gray-cl shadow-lg rounded-lg p-2 w-56 border border-gray-700">
      {fileOptions.map((opt) => (
        <button
          key={opt.value}
          className="flex items-center w-full px-3 py-2 hover:bg-regular-violet-cl/20 rounded transition text-white hover:text-regular-violet-cl focus:outline-none focus:ring-2 focus:ring-regular-violet-cl"
          onClick={() => {
            onSelect(opt.value)
            onClose()
          }}
        >
          <span className="text-xl mr-3 flex items-center justify-center w-7 h-7 bg-regular-dark-gray-cl rounded-full border border-gray-700">
            {opt.icon}
          </span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

type TTypeMessageBarProps = {
  directChat: TDirectChat
  replyMessage: TStateDirectMessage | null
  setReplyMessage: (msg: any | null) => void
}

export const TypeMessageBar = memo(
  ({ directChat, replyMessage, setReplyMessage }: TTypeMessageBarProps) => {
    const user = useUser()
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
          const { url, fileName, fileType, thumbnailUrl } = await uploadFile(file)
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
          if (messageType === EMessageTypes.VIDEO && thumbnailUrl) {
            msgPayload.thumbnailUrl = thumbnailUrl
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

    function renderReplyPreview(msg: TStateDirectMessage) {
      console.log(">>> reply msg:", msg)
      const type = msg.type.toUpperCase()
      switch (type) {
        case EMessageTypes.IMAGE:
          if (msg.mediaUrl) {
            return (
              <span className="inline-block mt-1">
                <img src={msg.mediaUrl} alt="sticker" className="h-10" />
              </span>
            )
          }
          return "Unknown content"
        case EMessageTypes.VIDEO:
          return (
            <span className="flex items-center gap-2 mt-1 text-sm">
              <FileVideo size={16} />
              <span>{msg.fileName || "File unnamed"}</span>
            </span>
          )
        case EMessageTypes.DOCUMENT:
          return (
            <span className="flex items-center gap-2 mt-1 text-sm">
              <Paperclip size={16} />
              <span>{msg.fileName || "File unnamed"}</span>
            </span>
          )
        case EMessageTypes.STICKER:
          if (msg.stickerUrl) {
            return (
              <span className="inline-block mt-1">
                <img src={msg.stickerUrl} alt="sticker" className="h-8" />
              </span>
            )
          }
          return "Unknown content"
        case EMessageTypes.TEXT:
          return (
            <span
              className="w-full truncate text-sm"
              dangerouslySetInnerHTML={{
                __html: santizeMsgContent(msg.content) || "[Không có nội dung]",
              }}
            />
          )
        case EMessageTypes.AUDIO:
          return <span className="text-sm">Voice message</span>
        default:
          if (
            msg.content &&
            typeof msg.content === "string" &&
            (msg.content.includes("<img") || msg.content.includes("<svg"))
          ) {
            const cleanContent = keepOnlyImgAndSvgTags(msg.content)
            return <span className="" dangerouslySetInnerHTML={{ __html: cleanContent }} />
          }
          return "[Không có nội dung]"
      }
    }

    // voice message
    const [isRecording, setIsRecording] = useState(false)
    const [recordTime, setRecordTime] = useState(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const isCancelledRef = useRef(false)
    const startRecording = async () => {
      setIsRecording(true)
      setRecordTime(0)
      setAudioUrl(null)
      isCancelledRef.current = false
      audioChunksRef.current = []
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
          if (isCancelledRef.current) return
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          setAudioUrl(URL.createObjectURL(blob))
          stream.getTracks().forEach((track) => track.stop())
        }

        recorder.start()
      } catch (err) {
        setIsRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)
        alert("Không thể truy cập microphone!")
      }
    }

    const stopRecording = () => {
      setIsRecording(false)
      setRecordTime(0)
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
    }
    const sendVoice = async () => {
      if (!audioUrl) {
        toast.error("Chưa có dữ liệu ghi âm")
        return
      }
      setIsUploading(true)
      try {
        // Lấy Blob webm từ audioUrl
        const webmBlob = await fetch(audioUrl).then((r) => r.blob())

        // Tạo file object webm
        const webmFile = new File([webmBlob], `voice-userId${user?.id}-${Date.now()}.webm`, {
          type: "audio/webm",
        })

        // Upload lên AWS S3, lấy url về (dùng hàm uploadFile của bạn)
        const { url, fileName, fileType } = await uploadFile(webmFile)

        // Gửi message (BE sẽ nhận type là AUDIO, mediaUrl là link S3 .webm)
        const { recipientId, creatorId, id } = directChat
        const msgPayload = {
          content: "", // hoặc chú thích
          mediaUrl: url,
          fileName,
          fileType,
          receiverId: user!.id === recipientId ? creatorId : recipientId,
          directChatId: id,
          token: chattingService.getMessageToken(),
          timestamp: new Date(),
        }

        console.log("msgPayload", msgPayload)

        chattingService.sendMessage(EMessageTypes.AUDIO, msgPayload, (data) => {
          console.log("data", data)
          if ("success" in data && data.success) {
            chattingService.setAcknowledgmentFlag(true)
            chattingService.recursiveSendingQueueMessages()
            setAudioUrl(null) // reset state
            toast.success("Đã gửi file ghi âm thành công")
          } else if ("isError" in data && data.isError) {
            toast.error(`Lỗi khi gửi file ghi âm`)
          }
        })
      } catch (error) {
        console.error("Upload voice error:", error)
        toast.error("Lỗi khi gửi file ghi âm")
      } finally {
        setIsUploading(false)
        setIsRecording(false)
        setRecordTime(0)
      }
    }

    const cancelRecording = () => {
      isCancelledRef.current = true
      setAudioUrl(null) // clear audioUrl nếu hủy
      stopRecording()
    }

    // Format mm:ss,ms
    const formatTime = (ms: number) => {
      const minutes = Math.floor(ms / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)
      const msPart = Math.floor((ms % 1000) / 10) // lấy 2 số
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")},${msPart.toString().padStart(2, "0")}`
    }

    useEffect(() => {
      if (isRecording) {
        timerRef.current = setInterval(() => {
          setRecordTime((prev) => prev + 10)
        }, 10)
      } else {
        setRecordTime(0) // reset time khi stop
        if (timerRef.current) clearInterval(timerRef.current)
      }
      // Cleanup khi component unmount hoặc isRecording false
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }, [isRecording])
    useEffect(() => {
      if (audioUrl && !isRecording) {
        // Không chạy khi đang ghi, chỉ chạy khi vừa dừng ghi và có file
        sendVoice()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, isRecording])

    return (
      <div className="flex gap-2.5 items-end pt-2 pb-4 z-999 box-border relative">
        <div className="flex flex-col grow">
          {/* Reply Preview */}
          {replyMessage && (
            <div
              id="STYLE-message-reply-preview"
              className="flex items-center w-type-message-bar gap-2 bg-regular-dark-gray-cl border-l-2 border-red-600 rounded-lg px-2 py-2 mb-1 text-xs"
            >
              <div className="w-6 h-6">
                <Reply size={24} className="text-red-600" />
              </div>
              <div className="rounded grow overflow-hidden pl-2 pr-2 text-xs">
                <div className="text-sm text-red-600">
                  <span>Reply to </span>
                  <span className="font-bold">{replyMessage.Author.Profile.fullName}</span>
                </div>
                <div className="mt-0.5 text-regular-icon-cl">
                  {renderReplyPreview(replyMessage)}
                </div>
              </div>
              <button
                className="ml-2 text-regular-icon-cl hover:text-red-600 transition-colors"
                title="Hủy trả lời"
                onClick={() => setReplyMessage(null)}
              >
                <X size={24} />
              </button>
            </div>
          )}
          <div
            onClick={handleClickOnTextFieldContainer}
            ref={textFieldContainerRef}
            className="flex w-type-message-bar cursor-text grow items-center gap-2 relative z-10 rounded-2xl bg-regular-dark-gray-cl px-3 outline-2 outline outline-regular-dark-gray-cl hover:outline-regular-violet-cl transition-[outline] duration-200"
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
            {!isRecording ? (
              <span
                className={`${isUploading ? "text-gray-400 cursor-not-allowed" : "text-gray-500 hover:text-regular-violet-cl cursor-pointer"} relative bottom-0 right-0`}
                onClick={() => {
                  console.log("Paperclip clicked", { isUploading, showFileMenu })
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
            ) : (
              <div className="flex items-center justify-center min-w-[68px] relative bottom-0 right-0">
                <span className="text-lg text-white font-semibold select-none">
                  {formatTime(recordTime)}
                  <span className="ml-2 w-3 h-3 rounded-full bg-red-500 inline-block animate-pulse"></span>
                </span>
              </div>
            )}
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

        {/* Nút gửi/ghi âm: merge từ cả 2 */}
        <div className="relative flex items-center">
          {/* Nút huỷ ghi âm - KHÔNG nằm trong Tooltip */}
          {isRecording && (
            <button
              onClick={cancelRecording}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 mr-2"
              type="button"
            >
              <Trash />
            </button>
          )}

          <CustomTooltip
            title={
              hasContent ? "Send message" : isRecording ? "Send voice" : "Record voice message"
            }
            placement="top"
          >
            <div
              onClick={async () => {
                if (hasContent) {
                  // sendMessage
                } else if (isRecording) {
                  stopRecording() // Dừng ghi âm TRƯỚC
                } else {
                  startRecording()
                }
              }}
              className={`${
                hasContent || isRecording ? "text-regular-violet-cl" : "text-gray-500"
              } bg-regular-dark-gray-cl rounded-full p-[27px] relative hover:text-white flex justify-center items-center cursor-pointer hover:bg-regular-violet-cl`}
              tabIndex={0}
              role="button"
              aria-label={
                hasContent ? "Send message" : isRecording ? "Send voice" : "Record voice message"
              }
              onKeyDown={async (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  if (hasContent) {
                    // sendMessage
                  } else if (isRecording) {
                    stopRecording() // Dừng ghi âm TRƯỚC
                  } else {
                    startRecording()
                  }
                }
              }}
            >
              <div
                className={`${hasContent || isRecording ? "animate-hide-icon" : "animate-grow-icon"} absolute`}
              >
                <Mic />
              </div>
              <div
                className={`${hasContent || isRecording ? "animate-grow-icon" : "animate-hide-icon"} absolute`}
              >
                <Send />
              </div>
            </div>
          </CustomTooltip>
        </div>
      </div>
    )
  }
)
