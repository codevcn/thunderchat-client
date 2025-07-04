import NImage from "next/image"
import { JSX, useEffect, useState } from "react"

type TProgressiveImageProps = {
   src: string
   alt?: string
   className?: string
   textPrgssClassName?: string
   progress?: JSX.Element
   prgssClassName?: string
}

export const ProgressiveImage = ({
   src,
   alt,
   className,
   textPrgssClassName,
   progress,
   prgssClassName,
}: TProgressiveImageProps) => {
   const [imgSrc, setImgSrc] = useState<string>()

   useEffect(() => {
      let mounted: boolean = true
      const image = new Image()
      image.src = src
      image.onload = () => {
         if (mounted) {
            setImgSrc(image.src)
         }
      }
      return () => {
         mounted = false
      }
   }, [src])

   return imgSrc ? (
      <NImage src={imgSrc} alt={alt || "Unknown"} className={className || ""} />
   ) : (
      progress || (
         <div className={`${prgssClassName || ""} flex`}>
            <div className={`${textPrgssClassName || ""} m-auto`}>Loading...</div>
         </div>
      )
   )
}
