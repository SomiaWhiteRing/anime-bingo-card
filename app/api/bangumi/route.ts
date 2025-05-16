import { NextResponse } from "next/server"

// Bangumi API 基础URL
const BANGUMI_API_BASE = "https://api.bgm.tv"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uid = searchParams.get("uid")
  const accessToken = searchParams.get("accessToken")

  if (!uid) {
    return NextResponse.json({ error: "缺少UID参数" }, { status: 400 })
  }

  try {
    // 1. 获取用户信息
    const userInfo = await fetchUserInfo(uid, accessToken)

    // 2. 获取用户收藏的动画
    const userCollections = await fetchUserCollections(uid, accessToken)

    // 3. 获取每年热度前20的动画
    const topAnimeByYear = await fetchTopAnimeByYear(accessToken)

    // 4. 合并数据
    const result = processData(topAnimeByYear, userCollections)

    return NextResponse.json(result)
  } catch (error) {
    console.error("API错误:", error)
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 })
  }
}

async function fetchUserInfo(username: string, accessToken: string | null) {
  const headers: HeadersInit = {
    "User-Agent": "whitering/anime-bingo-card (https://github.com/SomiaWhiteRing/anime-bingo-card)",
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${BANGUMI_API_BASE}/v0/users/${username}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`获取用户信息失败: ${response.statusText}`)
  }

  return await response.json()
}

async function fetchUserCollections(username: string, accessToken: string | null) {
  const headers: HeadersInit = {
    "User-Agent": "whitering/anime-bingo-card (https://github.com/SomiaWhiteRing/anime-bingo-card)",
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  // 获取用户的动画收藏
  const response = await fetch(`${BANGUMI_API_BASE}/v0/users/${username}/collections?subject_type=2`, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`获取用户收藏失败: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

async function fetchTopAnimeByYear(accessToken: string | null) {
  const headers: HeadersInit = {
    "User-Agent": "whitering/anime-bingo-card (https://github.com/SomiaWhiteRing/anime-bingo-card)",
    "Content-Type": "application/json",
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const years = Array.from({ length: 30 }, (_, i) => 2025 - i)
  const result: Record<number, any[]> = {}

  for (const year of years) {
    // 使用搜索API获取特定年份的动画并按热度排序
    const response = await fetch(`${BANGUMI_API_BASE}/v0/search/subjects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        keyword: "",
        sort: "heat",
        filter: {
          type: [2], // 动画类型
          air_date: [`>=${year}-01-01`, `<=${year}-12-31`],
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`获取${year}年热门动画失败: ${response.statusText}`)
    }

    const data = await response.json()
    result[year] = (data.data || []).slice(0, 20) // 只取前20个
  }

  return result
}

function processData(topAnimeByYear: Record<number, any[]>, userCollections: any[]) {
  const years = Array.from({ length: 30 }, (_, i) => 2025 - i)
  const result: Record<number, Record<number, any>> = {}

  // 创建用户已看动画的ID集合，方便查找
  const watchedAnimeIds = new Set(userCollections.map((collection) => collection.subject_id))

  for (const year of years) {
    result[year] = {}
    const yearTopAnime = topAnimeByYear[year] || []

    for (let rank = 1; rank <= 20; rank++) {
      if (yearTopAnime[rank - 1]) {
        const anime = yearTopAnime[rank - 1]
        // 检查用户是否看过这部动画
        const watched = watchedAnimeIds.has(anime.id)

        result[year][rank] = {
          ...anime,
          watched,
        }
      } else {
        result[year][rank] = null
      }
    }
  }

  return result
}
