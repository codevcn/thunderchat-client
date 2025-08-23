import { NextRequest, NextResponse } from "next/server"

const SERVER_ENDPOINT =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SERVER_ENDPOINT
    : process.env.NEXT_PUBLIC_SERVER_ENDPOINT_DEV

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Gửi file lên backend server
    const backendFormData = new FormData()
    backendFormData.append("file", file)

    const backendUrl = SERVER_ENDPOINT + "/upload"

    const response = await fetch(backendUrl, {
      method: "POST",
      body: backendFormData,
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Backend upload error:", errorData)
      return NextResponse.json({ error: "Upload failed" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Upload route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
