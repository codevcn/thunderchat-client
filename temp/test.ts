// @ts-nocheck

import dayjs from "dayjs"
import type { TDirectChatCard, TDirectMessage } from "@/utils/types/global"

const getQueryStringWithPathname = () => {
   // Lấy URL hiện tại
   const url = window.location.href

   // Tạo một đối tượng URL từ URL hiện tại
   const urlObject = new URL(url)

   // Lấy pathname
   const pathname = urlObject.pathname

   // Lấy query string
   const queryString = urlObject.search

   console.log(">>> Result >>>", `"${pathname}"`)
   console.log(">>> Result >>>", `"${queryString}"`)
}

function random_text(length: number): string {
   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
   let result: string = ""

   for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      result += characters.charAt(randomIndex)
   }

   return result
}

const random_a_number = (min: number, max: number): number => {
   return Math.floor(Math.random() * (max - min + 1) + min)
}

const generate_messages = (len: number): TDirectMessage[] => {
   const sequence = Array.from(Array(len).keys())
   return sequence.map<TDirectMessage>((_, idx) => ({
      authorId: random_a_number(1, 100),
      content: random_text(20),
      directChatId: random_a_number(1, 100),
      id: random_a_number(1, 100),
      groupChatId: null,
      createdAt: new Date(
         2023,
         random_a_number(1, 11),
         random_a_number(1, 31),
         random_a_number(0, 24),
         random_a_number(0, 60),
         random_a_number(0, 60),
         random_a_number(0, 1000)
      ).toISOString(),
   }))
}

const random_between_two_numbers = (num_1: number, num_2: number) => {
   return Math.floor(Math.random() * (num_2 - num_1 + 1) + num_1)
}

const unsorted_messages: TDirectMessage[] = [
   {
      authorId: 1,
      content: "vpYC0qntcB3yswf9 L8l",
      directChatId: 1,
      id: 0,
      createdAt: "2022-12-06T00:45:25.672Z",
   },
   {
      authorId: 1,
      content: "FrR2N jdchtCXTRIp9 n",
      directChatId: 1,
      id: 1,
      createdAt: "2022-12-07T13:48:34.533Z",
   },
   {
      authorId: 11,
      content: " 90EIMm OA7qXhKKf bH",
      directChatId: 1,
      id: 2,
      createdAt: "2022-12-14T19:33:39.134Z",
   },
   {
      authorId: 1,
      content: " 3XnKCAMaxqiTiAl09M ",
      directChatId: 1,
      id: 3,
      createdAt: "2022-12-15T06:37:16.035Z",
   },
   {
      authorId: 1,
      content: "Jb3a7nR7zrkBLpEsDqqi",
      directChatId: 1,
      id: 4,
      createdAt: "2022-12-20T09:50:39.650Z",
   },
   {
      authorId: 11,
      content: " sLCKmLLq ksMGOKJ3yA",
      directChatId: 1,
      id: 5,
      createdAt: "2023-02-06T16:14:28.343Z",
   },
   {
      authorId: 1,
      content: "uzlkXtJ6XHrv6 K9PyYo",
      directChatId: 1,
      id: 6,
      createdAt: "2023-02-08T09:54:29.207Z",
   },
   {
      authorId: 1,
      content: "H8E 4ZDD0phOz4b1Gr4m",
      directChatId: 1,
      id: 7,
      createdAt: "2023-03-18T03:20:50.145Z",
   },
   {
      authorId: 11,
      content: "  kyPaN Q73ivRF Sibn",
      directChatId: 1,
      id: 8,
      createdAt: "2023-03-18T09:27:47.999Z",
   },
   {
      authorId: 1,
      content: " WRFcy7 xopJkIBOgyCZ",
      directChatId: 1,
      id: 9,
      createdAt: "2023-03-18T10:30:55.378Z",
   },
   {
      authorId: 1,
      content: "9CZNfMGljzWRcv21IwS ",
      directChatId: 1,
      id: 10,
      createdAt: "2023-03-18T10:48:20.338Z",
   },
   {
      authorId: 1,
      content: "duVmu m8T8ll bxfqK y",
      directChatId: 1,
      id: 11,
      createdAt: "2023-04-06T07:25:38.739Z",
   },
   {
      authorId: 1,
      content: "wGgY 696F  XAzSBbqmZ",
      directChatId: 1,
      id: 12,
      createdAt: "2023-04-14T06:24:08.090Z",
   },
   {
      authorId: 11,
      content: "hbSg1 ntu xRWzw sl9B",
      directChatId: 1,
      id: 13,
      createdAt: "2023-04-25T18:01:45.128Z",
   },
   {
      authorId: 1,
      content: " Htzh PSo3ogmiSWbm 6",
      directChatId: 1,
      id: 14,
      createdAt: "2023-05-08T07:57:16.701Z",
   },
   {
      authorId: 11,
      content: "ZPCw2ZrBwME49bR dkDl",
      directChatId: 1,
      id: 15,
      createdAt: "2023-05-12T03:18:36.296Z",
   },
   {
      authorId: 1,
      content: "6QRVesnB6 98wB zLeMo",
      directChatId: 1,
      id: 16,
      createdAt: "2023-06-02T17:18:11.512Z",
   },
   {
      authorId: 11,
      content: "4O7tw Ghjx FTFmauNMO",
      directChatId: 1,
      id: 17,
      createdAt: "2023-06-14T04:44:56.099Z",
   },
   {
      authorId: 1,
      content: "Zf7NJyw3 AqE GCo4hjo",
      directChatId: 1,
      id: 18,
      createdAt: "2023-07-17T09:04:49.225Z",
   },
   {
      authorId: 11,
      content: " L3Fy7v zcxlrshDH79c",
      directChatId: 1,
      id: 19,
      createdAt: "2023-08-03T04:50:05.618Z",
   },
   {
      authorId: 11,
      content: "vOpe ScF0g53r4ksi3Cb",
      directChatId: 1,
      id: 20,
      createdAt: "2023-08-08T07:08:49.407Z",
   },
   {
      authorId: 1,
      content: "kSmysbw AxK orv4mqaW",
      directChatId: 1,
      id: 21,
      createdAt: "2023-08-19T15:43:33.280Z",
   },
   {
      authorId: 1,
      content: "eotV fSKg  zOWkwR Yv",
      directChatId: 1,
      id: 22,
      createdAt: "2023-08-22T08:48:09.034Z",
   },
   {
      authorId: 11,
      content: "eKHdWHCIfilXODMt90mZ",
      directChatId: 1,
      id: 23,
      createdAt: "2023-08-30T09:47:52.109Z",
   },
   {
      authorId: 11,
      content: "HQw05rKZ4RBy5O7 CqF4",
      directChatId: 1,
      id: 24,
      createdAt: "2023-09-11T01:08:00.899Z",
   },
   {
      authorId: 1,
      content: " vDz3g CD8 bs jJLIqU",
      directChatId: 1,
      id: 25,
      createdAt: "2023-11-13T02:37:34.435Z",
   },
   {
      authorId: 11,
      content: "voC  C3WlGE  SbK T  ",
      directChatId: 1,
      id: 26,
      createdAt: "2023-11-13T02:38:42.302Z",
   },
   {
      authorId: 11,
      content: "SsN Lqx 5etM8raVjZ9 ",
      directChatId: 1,
      id: 27,
      createdAt: "2023-11-13T02:39:25.454Z",
   },
   {
      authorId: 1,
      content: "r86QJMK0z3EJy4tUT3WP",
      directChatId: 1,
      id: 28,
      createdAt: "2023-11-13T10:00:26.252Z",
   },
   {
      authorId: 11,
      content: " zlH7h H rVaI  l BhW",
      directChatId: 1,
      id: 29,
      createdAt: "2023-11-13T10:55:40.921Z",
   },
]

unsorted_messages.sort((a, b) => {
   const obj = {
      a: dayjs(a.createdAt).toDate().getTime(),
      b: dayjs(b.createdAt).toDate().getTime(),
   }
   return obj.a - obj.b
})

const messages = unsorted_messages

type TInvalidMessages = {
   success: boolean
   key: string | null
   value: string | number | Date | null
   item: null | object
}

const check_valid_messages = (list: TDirectMessage[]): TInvalidMessages => {
   const valids = new Set()
   const first_item = list[0]

   let count = 0

   for (let key in first_item) {
      for (let item of list) {
         const val = item[key as keyof TDirectMessage]
         if (valids.has(val) && key !== "directChatId") {
            console.log(">>> count:", count)
            return { success: false, key, value: val, item }
         } else {
            valids.add(val)
         }
         count++
      }
      valids.clear()
   }

   return { success: true, key: null, value: null, item: null }
}

type TUser = {
   avatar: string
   name: string
   lastOnline: string
}

const user_1: TUser = {
   avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/8.webp",
   lastOnline: new Date(dayjs().subtract(1, "day").toISOString()).toISOString(),
   name: "Thier Kat Lucas",
}

const user_list: TUser[] = [
   {
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/8.webp",
      lastOnline: new Date(dayjs().subtract(1, "day").toISOString()).toISOString(),
      name: "Thier Kat Lucas",
   },
   {
      avatar:
         "https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/512x512/bookmarks.png",
      lastOnline: new Date(dayjs().subtract(2, "day").toISOString()).toISOString(),
      name: "VonVon",
   },
]

const directChats: TDirectChatCard[] = [
   {
      id: 0,
      avatar: "https://cdn-icons-png.flaticon.com/512/8930/8930382.png",
      lastMessageTime: new Date(dayjs().subtract(0, "day").toISOString()).toISOString(),
      title: "Saved Messages",
      pinIndex: -1,
      subtitle: "Bookmark",
   },
   {
      id: 1,
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/2.webp",
      lastMessageTime: new Date(dayjs().subtract(7, "day").toISOString()).toISOString(),
      title: "Wibu Kingdom",
      pinIndex: -1,
      subtitle: "wibu la tao",
   },
   {
      id: 2,
      avatar:
         "https://d1nhio0ox7pgb.cloudfront.net/_img/g_collection_png/standard/512x512/bookmarks.png",
      lastMessageTime: new Date(dayjs().subtract(8, "day").toISOString()).toISOString(),
      title: "Bem",
      pinIndex: 2,
      subtitle:
         "co ven duong thoi ma lam sao voi dc may, tu sau cau het tu em gai kia chang can bien lon hoac la bao giong",
   },
   {
      id: 3,
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/8.webp",
      lastMessageTime: new Date(dayjs().subtract(9, "day").toISOString()).toISOString(),
      title: "H",
      pinIndex: -1,
      subtitle: "wibu la tao",
   },
   {
      id: 4,
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/5.webp",
      lastMessageTime: new Date(dayjs().subtract(10, "day").toISOString()).toISOString(),
      title: "Okay",
      pinIndex: 1,
      subtitle: "wibu la tao",
   },
   {
      id: 5,
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/2.webp",
      lastMessageTime: new Date(dayjs().subtract(11, "day").toISOString()).toISOString(),
      title: "Daddy Daddy Doo",
      pinIndex: -1,
      subtitle: "Thuong dang",
   },
   {
      id: 6,
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/2.webp",
      lastMessageTime: new Date(dayjs().subtract(12, "day").toISOString()).toISOString(),
      title: "S123",
      pinIndex: 3,
      subtitle:
         "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
   },
   {
      id: 7,
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/2.webp",
      lastMessageTime: new Date(dayjs().subtract(13, "day").toISOString()).toISOString(),
      title: "0 o 0",
      pinIndex: -1,
      subtitle: "wibu la tao",
   },
   {
      id: 8,
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/2.webp",
      lastMessageTime: new Date(dayjs().subtract(14, "day").toISOString()).toISOString(),
      title: "Crying",
      pinIndex: -1,
      subtitle: "wibu la tao",
   },
   {
      id: 9,
      avatar: "https://mdbcdn.b-cdn.net/img/new/avatars/2.webp",
      lastMessageTime: new Date(dayjs().subtract(2, "day").toISOString()).toISOString(),
      title: "Chass2",
      pinIndex: -1,
      subtitle: "123999 diqdhoqdi dqiodqj cadaaddad da dawjddoiann[akclm cnjaldndnqp",
   },
]

const getTestMessages = async (): Promise<TDirectMessage[]> => {
   await new Promise((resolve) => {
      setTimeout(() => {
         resolve("")
      }, 1000)
   })
   return messages
}

export const dev_test_values = {
   user_1,
   user_list,
   directChats,
   messages,
   random_between_two_numbers,
   getTestMessages,
   getQueryStringWithPathname,
}
