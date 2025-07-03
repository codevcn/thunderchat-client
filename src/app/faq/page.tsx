"use client"

import { clientAxios } from "@/configs/axios"

export default function FAQPage() {
   const todo = () => {
      clientAxios.get("/temp/todo").then((res) => {
         console.log(">>> res:", res)
      })
   }

   return (
      <div>
         <div>
            <button onClick={todo}>todo</button>
         </div>
      </div>
   )
}
