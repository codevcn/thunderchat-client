import React from "react"
import Linkify from "react-linkify"
import DOMPurify from "dompurify"

// Hàm sanitize nội dung để tránh XSS
export const sanitizeMsgContent = (text: string): string => {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ["img", "link", "span", "div", "p", "br", "strong", "em", "a"],
    ALLOWED_ATTR: ["src", "alt", "class", "href", "rel", "target", "style"],
  })
}

// Custom decorator để thêm style và xử lý deep link
const linkDecorator = (href: string, text: string, key: number) => {
  // Danh sách các deep link nhắn tin
  const messagingPlatforms = ["zalo.me", "t.me", "m.me", "wa.me"]
  const isDeepLink = messagingPlatforms.some((platform) => href.startsWith(`${platform}/`))

  // Giữ nguyên href cho deep link, thêm https:// cho các URL khác
  const finalHref = isDeepLink
    ? href
    : href.startsWith("http") || href.startsWith("ftp")
      ? href
      : `https://${href}`

  return (
    <a
      href={finalHref}
      key={key}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-900 cursor-pointer hover:text-purple-800 hover:underline"
    >
      {text}
    </a>
  )
}

interface HighlightedTextProps {
  text: string
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text }) => {
  // Sanitize nội dung trước để tránh XSS
  const sanitizedText = sanitizeMsgContent(text)

  // Kiểm tra xem text có chứa HTML không
  const hasHtml = /<[^>]+>/i.test(sanitizedText)

  if (hasHtml) {
    // Nếu có HTML (như emoji), render với dangerouslySetInnerHTML
    return (
      <Linkify componentDecorator={linkDecorator}>
        <span dangerouslySetInnerHTML={{ __html: sanitizedText }} />
      </Linkify>
    )
  }

  // Text thuần túy, chỉ cần wrap với Linkify
  return <Linkify componentDecorator={linkDecorator}>{sanitizedText}</Linkify>
}

export default HighlightedText
