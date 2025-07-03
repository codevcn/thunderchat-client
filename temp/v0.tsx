"use client"

import { useState } from "react"
import { Search } from "lucide-react"

export default function EmojiPicker() {
   const [searchQuery, setSearchQuery] = useState("")
   const [activeCategory, setActiveCategory] = useState("frequently-used")

   // Category icons
   const categories = [
      { id: "recent", icon: "🕒", label: "Recent" },
      { id: "smileys", icon: "😃", label: "Smileys" },
      { id: "animals", icon: "🐱", label: "Animals" },
      { id: "food", icon: "🍔", label: "Food" },
      { id: "travel", icon: "🚌", label: "Travel" },
      { id: "activities", icon: "⚽", label: "Activities" },
      { id: "objects", icon: "👕", label: "Objects" },
      { id: "symbols", icon: "🎵", label: "Symbols" },
      { id: "flags", icon: "🏁", label: "Flags" },
   ]

   // Frequently used emojis
   const frequentlyUsed = [
      { src: "/emojis/grinning-face-with-big-eyes.png", alt: "😃", code: "1f603" },
      { src: "/emojis/face-with-tears-of-joy.png", alt: "😂", code: "1f602" },
      { src: "/emojis/smiling-face.png", alt: "🙂", code: "1f642" },
      { src: "/emojis/slightly-smiling-face.png", alt: "🙂", code: "1f642" },
      { src: "/emojis/neutral-face.png", alt: "😐", code: "1f610" },
      { src: "/emojis/smiling-face-with-heart-eyes.png", alt: "😍", code: "1f60d" },
   ]

   // Smileys & People emojis (multiple rows)
   const smileysAndPeople = [
      { src: "/emojis/grinning-face.png", alt: "😀", code: "1f600" },
      { src: "/emojis/grinning-face-with-big-eyes.png", alt: "😃", code: "1f603" },
      { src: "/emojis/grinning-face-with-smiling-eyes.png", alt: "😄", code: "1f604" },
      { src: "/emojis/beaming-face-with-smiling-eyes.png", alt: "😁", code: "1f601" },
      { src: "/emojis/grinning-squinting-face.png", alt: "😆", code: "1f606" },
      { src: "/emojis/grinning-face-with-sweat.png", alt: "😅", code: "1f605" },
      { src: "/emojis/rolling-on-the-floor-laughing.png", alt: "🤣", code: "1f923" },

      { src: "/emojis/face-with-tears-of-joy.png", alt: "😂", code: "1f602" },
      { src: "/emojis/slightly-smiling-face.png", alt: "🙂", code: "1f642" },
      { src: "/emojis/upside-down-face.png", alt: "🙃", code: "1f643" },
      { src: "/emojis/winking-face.png", alt: "😉", code: "1f609" },
      { src: "/emojis/smiling-face-with-smiling-eyes.png", alt: "😊", code: "1f60a" },
      { src: "/emojis/smiling-face-with-heart-eyes.png", alt: "😍", code: "1f60d" },
      { src: "/emojis/star-struck.png", alt: "🤩", code: "1f929" },

      { src: "/emojis/face-blowing-a-kiss.png", alt: "😘", code: "1f618" },
      { src: "/emojis/kissing-face.png", alt: "😗", code: "1f617" },
      { src: "/emojis/smiling-face.png", alt: "☺️", code: "263a" },
      { src: "/emojis/face-savoring-food.png", alt: "😋", code: "1f60b" },
      { src: "/emojis/face-with-tongue.png", alt: "😛", code: "1f61b" },
      { src: "/emojis/winking-face-with-tongue.png", alt: "😜", code: "1f61c" },
      { src: "/emojis/zany-face.png", alt: "🤪", code: "1f92a" },

      { src: "/emojis/squinting-face-with-tongue.png", alt: "😝", code: "1f61d" },
      { src: "/emojis/money-mouth-face.png", alt: "🤑", code: "1f911" },
      { src: "/emojis/hugging-face.png", alt: "🤗", code: "1f917" },
      { src: "/emojis/face-with-hand-over-mouth.png", alt: "🤭", code: "1f92d" },
      { src: "/emojis/shushing-face.png", alt: "🤫", code: "1f92b" },
      { src: "/emojis/thinking-face.png", alt: "🤔", code: "1f914" },
      { src: "/emojis/zipper-mouth-face.png", alt: "🤐", code: "1f910" },

      { src: "/emojis/face-with-raised-eyebrow.png", alt: "🤨", code: "1f928" },
      { src: "/emojis/neutral-face.png", alt: "😐", code: "1f610" },
      { src: "/emojis/expressionless-face.png", alt: "😑", code: "1f611" },
      { src: "/emojis/face-without-mouth.png", alt: "😶", code: "1f636" },
      { src: "/emojis/smirking-face.png", alt: "😏", code: "1f60f" },
      { src: "/emojis/unamused-face.png", alt: "😒", code: "1f612" },
      { src: "/emojis/face-with-rolling-eyes.png", alt: "🙄", code: "1f644" },

      { src: "/emojis/grimacing-face.png", alt: "😬", code: "1f62c" },
      { src: "/emojis/lying-face.png", alt: "🤥", code: "1f925" },
      { src: "/emojis/relieved-face.png", alt: "😌", code: "1f60c" },
      { src: "/emojis/pensive-face.png", alt: "😔", code: "1f614" },
      { src: "/emojis/sleepy-face.png", alt: "😪", code: "1f62a" },
      { src: "/emojis/drooling-face.png", alt: "🤤", code: "1f924" },
      { src: "/emojis/sleeping-face.png", alt: "😴", code: "1f634" },
   ]

   // For demonstration, we'll use placeholder images
   const getEmojiUrl = (code: any) => `/placeholder.svg?height=36&width=36&text=${code}`

   const handleEmojiClick = (emoji: any) => {
      console.log("Selected emoji:", emoji.alt)
      // Here you would typically add logic to insert the emoji or notify parent component
   }

   return (
      <div className="w-full max-w-md mx-auto">
         <div
            className="rounded-lg overflow-hidden shadow-lg border border-gray-700"
            style={{ backgroundColor: "#212121" }}
         >
            {/* Search bar */}
            <div className="p-2 flex items-center gap-2">
               <div className="flex-1 relative rounded-md overflow-hidden border border-gray-600">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                     type="text"
                     placeholder="Search emoji..."
                     className="block w-full pl-10 pr-3 py-2 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                  {/* This is the yellow square button */}
               </div>
            </div>

            {/* Category icons */}
            <div className="flex overflow-x-auto p-2 border-t border-b border-gray-700">
               {categories.map((category) => (
                  <button
                     key={category.id}
                     className={`flex-shrink-0 w-8 h-8 mx-1 rounded-full flex items-center justify-center ${
                        activeCategory === category.id ? "bg-gray-600" : "bg-gray-700"
                     }`}
                     onClick={() => setActiveCategory(category.id)}
                     aria-label={category.label}
                  >
                     <img
                        src={getEmojiUrl(category.id) || "/placeholder.svg"}
                        alt={category.label}
                        className="w-5 h-5 opacity-60"
                     />
                  </button>
               ))}
            </div>

            {/* Emoji sections with scrollable area */}
            <div className="h-80 overflow-y-auto" style={{ color: "#aaaaaa" }}>
               {/* Frequently Used section */}
               <div className="p-2">
                  <h3 className="text-sm font-medium mb-2">Frequently Used</h3>
                  <div className="grid grid-cols-6 gap-2">
                     {frequentlyUsed.map((emoji, index) => (
                        <button
                           key={`frequent-${index}`}
                           className="w-10 h-10 flex items-center justify-center hover:bg-gray-700 rounded-full"
                           onClick={() => handleEmojiClick(emoji)}
                        >
                           <img
                              src={getEmojiUrl(emoji.code) || "/placeholder.svg"}
                              alt={emoji.alt}
                              className="w-8 h-8"
                           />
                        </button>
                     ))}
                  </div>
               </div>

               {/* Smileys & People section */}
               <div className="p-2 border-t border-gray-700">
                  <h3 className="text-sm font-medium mb-2">Smileys & People</h3>
                  <div className="grid grid-cols-7 gap-1">
                     {smileysAndPeople.map((emoji, index) => (
                        <button
                           key={`smiley-${index}`}
                           className="w-10 h-10 flex items-center justify-center hover:bg-gray-700 rounded-full"
                           onClick={() => handleEmojiClick(emoji)}
                        >
                           <img
                              src={getEmojiUrl(emoji.code) || "/placeholder.svg"}
                              alt={emoji.alt}
                              className="w-8 h-8"
                           />
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   )
}
