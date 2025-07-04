// @ts-nocheck

import React, { useState } from "react"
import { Search } from "lucide-react"
import EmojiCategory from "./EmojiCategory"
import EmojiTab from "./EmojiTab"
import { frequentlyUsedEmojis, smileysPeopleEmojis } from "../data/emojis"

const EmojiPicker = () => {
   const [searchValue, setSearchValue] = useState("")

   return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
         <div className="w-full max-w-md rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-white">
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "#212121" }}>
               {/* Search Bar */}
               <div className="p-3 flex gap-2">
                  <div className="relative w-full">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                     </div>
                     <input
                        type="text"
                        className="bg-gray-100 w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none"
                        placeholder="Search emoji..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                     />
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-400 rounded">
                     <img
                        src="/lovable-uploads/7155d1ad-fb4d-4657-81c6-78eb9af3290d.png"
                        alt="Skin tone selector"
                        className="w-6 h-6 hidden"
                     />
                  </div>
               </div>

               {/* Emoji Tabs */}
               <div className="flex overflow-x-auto p-2 gap-3 border-t border-gray-700">
                  <EmojiTab icon="🕒" label="Recent" active={true} />
                  <EmojiTab icon="😀" label="Smileys" />
                  <EmojiTab icon="🐱" label="Animals" />
                  <EmojiTab icon="🍔" label="Food" />
                  <EmojiTab icon="🚌" label="Travel" />
                  <EmojiTab icon="⚽" label="Activities" />
                  <EmojiTab icon="👕" label="Objects" />
                  <EmojiTab icon="🎵" label="Symbols" />
                  <EmojiTab icon="🏁" label="Flags" />
               </div>

               {/* Emoji Content Area - Scrollable */}
               <div className="overflow-y-auto h-80 px-3 py-2" style={{ color: "#aaaaaa" }}>
                  {/* Frequently Used Section */}
                  <EmojiCategory title="Frequently Used" emojis={frequentlyUsedEmojis} />

                  {/* Smileys & People Section */}
                  <EmojiCategory title="Smileys & People" emojis={smileysPeopleEmojis} />
               </div>
            </div>
         </div>
      </div>
   )
}

export default EmojiPicker
