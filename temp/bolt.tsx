// @ts-nocheck

import React, { useState } from "react"
import { Send, ChevronDown } from "lucide-react"

function App() {
   const [keepSignedIn, setKeepSignedIn] = useState(true)

   return (
      <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-4">
         {/* Logo and Title */}
         <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-[#2AABEE] rounded-full flex items-center justify-center mb-4">
               <Send className="w-12 h-12 text-white transform rotate-45" />
            </div>
            <h1 className="text-3xl text-white font-bold mb-4">Telegram</h1>
            <p className="text-[#8E8E92] text-center max-w-md">
               Please confirm your country code and enter your phone number.
            </p>
         </div>

         {/* Form */}
         <div className="w-full max-w-md">
            {/* Country Selector */}
            <div className="mb-4">
               <label className="block text-[#8E8E92] text-sm mb-2">Country</label>
               <div className="relative">
                  <button className="w-full bg-[#2C2C2E] text-white py-3 px-4 rounded flex items-center justify-between">
                     <span>Vietnam</span>
                     <ChevronDown className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* Phone Number Input */}
            <div className="mb-6">
               <label className="block text-[#8E8E92] text-sm mb-2">Your phone number</label>
               <input
                  type="text"
                  value="+84"
                  className="w-full bg-[#2C2C2E] text-white py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
               />
            </div>

            {/* Keep Signed In Checkbox */}
            <div className="flex items-center mb-8">
               <div
                  className={`w-5 h-5 rounded ${
                     keepSignedIn ? "bg-[#8E86FF]" : "bg-[#2C2C2E]"
                  } mr-3 cursor-pointer flex items-center justify-center`}
                  onClick={() => setKeepSignedIn(!keepSignedIn)}
               >
                  {keepSignedIn && (
                     <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path d="M20 6L9 17l-5-5" />
                     </svg>
                  )}
               </div>
               <span
                  className="text-white cursor-pointer"
                  onClick={() => setKeepSignedIn(!keepSignedIn)}
               >
                  Keep me signed in
               </span>
            </div>

            {/* QR Code Link */}
            <div className="text-center">
               <a href="#" className="text-[#8E86FF] hover:text-[#7A74E0] transition-colors">
                  LOG IN BY QR CODE
               </a>
            </div>
         </div>
      </div>
   )
}

export default App
