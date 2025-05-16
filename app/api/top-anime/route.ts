import { NextResponse } from "next/server"

const BANGUMI_API_BASE = "https://api.bgm.tv"

// 添加缓存控制
export const revalidate = 86400 // 缓存24小时

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get("year")

  if (!year) {
    return NextResponse.json({ error: "缺少年份参数" }, { status: 400 })
  }

  try {
    const headers: HeadersInit = {
      "User-Agent": "whitering/anime-bingo-card (https://github.com/SomiaWhiteRing/anime-bingo-card)",
      "Content-Type": "application/json",
    }

    // 如果环境变量中有 AccessToken，则添加到请求头
    if (process.env.BANGUMI_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.BANGUMI_ACCESS_TOKEN}`
    }

    // 使用搜索API获取特定年份的动画并按热度排序
    const response = await fetch(`${BANGUMI_API_BASE}/v0/search/subjects?limit=20`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        keyword: "",
        sort: "heat",
        meta_tags: ["TV", "日本"],
        filter: {
          type: [2], // 动画类型
          air_date: [`>=${year}-01-01`, `<=${year}-12-31`],
        },
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `获取${year}年热门动画失败: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    // 只返回前20个结果
    data.data = data.data.slice(0, 20)

    return NextResponse.json(data)
  } catch (error) {
    console.error("API错误:", error)
    return NextResponse.json({ error: `获取${year}年热门动画失败` }, { status: 500 })
  }
}
