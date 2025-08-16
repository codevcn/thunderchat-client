import React from "react"
import Linkify from "react-linkify"

interface LinkifyTextProps {
  text: string
  className?: string
  children?: React.ReactNode
}

export const LinkifyText: React.FC<LinkifyTextProps> = ({ text, className = "", children }) => {
  const linkifyProps = {
    componentDecorator: (decoratedHref: string, decoratedText: string, key: number) => (
      <a
        key={key}
        href={decoratedHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-900 cursor-pointer hover:text-purple-800 hover:underline"
        onClick={(e) => {
          e.preventDefault()
          window.open(decoratedHref, "_blank")
        }}
      >
        {decoratedText}
      </a>
    ),
    hrefDecorator: (href: string) => {
      // Thêm protocol nếu cần
      return href.startsWith("http") ? href : `https://${href}`
    },
  }

  if (children) {
    return (
      <Linkify {...linkifyProps}>
        <span className={className}>{children}</span>
      </Linkify>
    )
  }

  return (
    <Linkify {...linkifyProps}>
      <span className={className}>{text}</span>
    </Linkify>
  )
}

export default LinkifyText
