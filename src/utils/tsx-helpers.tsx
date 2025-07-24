import type { THighlightOffsets } from "./types/global"

export function renderHighlightedContent(
  content: string,
  highlights: THighlightOffsets[],
  classNameForHighlights: string = "bg-regular-violet-cl text-regular-white-cl px-1"
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
