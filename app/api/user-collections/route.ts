import { NextResponse } from "next/server"

const BANGUMI_API_BASE = "https://api.bgm.tv"

// 添加缓存控制
export const revalidate = 3600 // 缓存1小时

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

    // 获取用户的动画收藏，使用最大限制
    const response = await fetch(`${BANGUMI_API_BASE}/v0/users/${username}/collections?subject_type=2&limit=50`, {
      headers,
    })

    if (!response.ok) {
      return NextResponse.json({ error: `获取用户收藏失败: ${response.statusText}` }, { status: response.status })
    }

    const data = await response.json()

    // 如果有分页，获取所有页面的数据
    if (data.total > data.limit) {
      const allCollections = [...data.data]
      const totalPages = Math.ceil(data.total / data.limit)

      for (let page = 1; page < totalPages; page++) {
        const offset = page * data.limit
        const pageResponse = await fetch(
          `${BANGUMI_API_BASE}/v0/users/${username}/collections?subject_type=2&limit=${data.limit}&offset=${offset}`,
          { headers },
        )

        if (pageResponse.ok) {
          const pageData = await pageResponse.json()
          allCollections.push(...pageData.data)
        }
      }

      data.data = allCollections
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API错误:", error)
    return NextResponse.json({ error: "获取用户收藏失败" }, { status: 500 })
  }
}
