import type { THighlightOffsets } from "./types/global"
import Linkify from "linkify-react"

export function renderHighlightedContent(
  content: string,
  highlights: THighlightOffsets[],
  classNameForHighlights: string = "bg-[#887cd9] text-regular-white-cl px-1"
): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  for (const { start, end } of highlights) {
    if (start > lastIndex) {
      parts.push(content.slice(lastIndex, start))
    }

    parts.push(
      <span className={classNameForHighlights} key={start}>
        {content.slice(start, end)}
      </span>
    )

    lastIndex = end
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts
}

type THighlightUrlsInTextProps = {
  text: string
  className?: string
}

export const HighlightUrlsInText = ({ text, className }: THighlightUrlsInTextProps) => {
  return (
    <Linkify
      options={{
        attributes: {
          class: className,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        defaultProtocol: "https",
      }}
    >
      {text}
    </Linkify>
  )
}
