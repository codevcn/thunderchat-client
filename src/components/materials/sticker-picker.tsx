"use client"

import axiosErrorHandler from "@/utils/axios-error-handler"
import { useEffect, useState } from "react"
import { FixedSizeGrid } from "react-window"
import type { GridChildComponentProps } from "react-window"
import { CustomTooltip } from "./tooltip"
import { Spinner } from "./spinner"
import { expressionService } from "@/services/expression.service"
import type { TSticker, TStickerCategory } from "@/utils/types/be-api"
import Image from "next/image"
import { toast } from "./index"

const GRID_COLUMN_COUNT: number = 4

type StickerTabProps = {
   thumbnailUrl: string
   label: string
   activeCategory: TStickerCategory | undefined
   tabType: TStickerCategory
   onClick: (category: TStickerCategory) => void
}

const StickerTab = ({ thumbnailUrl, label, activeCategory, tabType, onClick }: StickerTabProps) => {
   return (
      <CustomTooltip title={label} placement="bottom">
         <div
            className={`p-2 rounded-full transition-colors cursor-pointer ${
               activeCategory === tabType ? "bg-regular-hover-bgcl" : "hover:bg-regular-hover-bgcl"
            }`}
            onClick={() => {
               onClick(tabType)
            }}
         >
            <Image src={thumbnailUrl} alt={label} width={24} height={24} />
         </div>
      </CustomTooltip>
   )
}

const StickerCell = ({
   data,
   rowIndex,
   columnIndex,
   style,
}: GridChildComponentProps<TSticker[]>) => {
   const index = rowIndex * GRID_COLUMN_COUNT + columnIndex
   if (index >= data.length) return null

   const stickerData = data[index]

   return (
      <button
         className="QUERY-sticker-btn p-1.5 hover:bg-gray-700 rounded-md transition-colors"
         title={stickerData.stickerName}
         style={style}
         data-sticker-data={JSON.stringify(stickerData)}
      >
         <img src={stickerData.imageUrl} alt={stickerData.stickerName} className="w-full h-full" />
      </button>
   )
}

type StickerCategoryProps = {
   title: string
   stickers: TSticker[]
}

const StickersList = ({ title, stickers }: StickerCategoryProps) => {
   const width: number = 300
   const height: number = 265
   const cellSize: number = width / GRID_COLUMN_COUNT

   return (
      <div className="w-full">
         <h3 className="w-full text-sm font-medium mb-2 text-regular-text-secondary-cl">{title}</h3>
         <FixedSizeGrid
            columnCount={GRID_COLUMN_COUNT}
            columnWidth={cellSize}
            height={height}
            rowCount={Math.ceil(stickers.length / GRID_COLUMN_COUNT)}
            rowHeight={cellSize}
            width={width}
            itemData={stickers}
            style={{ overflowX: "hidden", overflowY: "scroll" }}
            className="no-scrollbar"
         >
            {({ columnIndex, rowIndex, style, data }) => (
               <StickerCell
                  data={data}
                  style={style}
                  columnIndex={columnIndex}
                  rowIndex={rowIndex}
               />
            )}
         </FixedSizeGrid>
      </div>
   )
}

type TStickerPickerProps = {
   onSelectSticker: (sticker: TSticker) => void
}

const StickerPicker = ({ onSelectSticker }: TStickerPickerProps) => {
   const [stickers, setStickers] = useState<TSticker[]>()
   const [stickerCategories, setStickerCategories] = useState<TStickerCategory[]>()
   const [activeCategory, setActiveCategory] = useState<TStickerCategory>()

   const fetchAllStickerCategories = () => {
      expressionService
         .fetchAllStickerCategories()
         .then((res) => {
            setStickerCategories(res)
            setActiveCategory(res[0])
         })
         .catch((error) => {
            toast.error(axiosErrorHandler.handleHttpError(error).message)
         })
   }

   const handleStickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLButtonElement
      let stickerData: TSticker | null = null
      if (target.classList.contains("QUERY-sticker-btn")) {
         stickerData = JSON.parse(target.dataset.stickerData!) as TSticker
      } else if (target.closest(".QUERY-sticker-btn")) {
         const stickerBtn = target.closest(".QUERY-sticker-btn") as HTMLButtonElement
         stickerData = JSON.parse(stickerBtn.dataset.stickerData!) as TSticker
      }
      if (stickerData) {
         onSelectSticker(stickerData)
      }
   }

   const fetchStickers = () => {
      if (stickerCategories && stickerCategories.length > 0 && activeCategory) {
         expressionService
            .fetchStickers(activeCategory.id)
            .then((res) => {
               setStickers(res)
            })
            .catch((error) => {
               toast.error(axiosErrorHandler.handleHttpError(error).message)
            })
      }
   }

   useEffect(() => {
      fetchAllStickerCategories()
   }, [])

   useEffect(() => {
      fetchStickers()
   }, [stickerCategories, activeCategory])

   return (
      <div className="overflow-hidden w-full h-inside-expression-picker">
         {/* Sticker Tabs */}
         <div className="flex overflow-x-auto p-2 gap-1 border-t border-gray-700">
            {stickerCategories?.map((category) => (
               <StickerTab
                  key={category.id}
                  thumbnailUrl={category.thumbnailUrl}
                  label={category.name}
                  tabType={category}
                  activeCategory={activeCategory}
                  onClick={setActiveCategory}
               />
            ))}
         </div>

         {/* Stickers */}
         <div className="flex px-3 w-full" onClick={handleStickerClick}>
            {stickers && activeCategory ? (
               <StickersList title={activeCategory.name} stickers={stickers} />
            ) : (
               <div className="m-auto pt-10">
                  <Spinner size="medium" color="text-white" />
               </div>
            )}
         </div>
      </div>
   )
}

export default StickerPicker
