import { NextResponse } from "next/server"

const BANGUMI_API_BASE = "https://api.bgm.tv"

// 添加缓存控制
export const revalidate = 3600 // 缓存1小时

// 将图片转换为base64
async function convertImageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const mimeType = response.headers.get("content-type") || "image/jpeg"
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error("图片转换失败:", error)
    throw error
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "缺少用户名参数" }, { status: 400 })
  }

  try {
    const headers: HeadersInit = {
      "User-Agent": "whitering/anime-bingo-card (https://github.com/SomiaWhiteRing/anime-bingo-card)",
    }
    // 如果环境变量中有 AccessToken，则添加到请求头
    if (process.env.BANGUMI_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.BANGUMI_ACCESS_TOKEN}`
    }

    const response = await fetch(`${BANGUMI_API_BASE}/v0/users/${username}`, {
      headers,
    })

    if (!response.ok) {
      return NextResponse.json({ error: `获取用户信息失败: ${response.statusText}` }, { status: response.status })
    }

    const data = await response.json()

    // 如果有头像，在服务端将其转换为base64
    if (data.avatar?.large) {
      try {
        data.avatarBase64 = await convertImageToBase64(data.avatar.large)
      } catch (error) {
        console.error("头像转换失败:", error)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API错误:", error)
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 })
  }
}
