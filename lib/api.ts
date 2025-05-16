// 获取用户信息
export async function fetchUserInfo(username: string) {
  try {
    const response = await fetch(`/api/user?username=${encodeURIComponent(username)}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `获取用户信息失败: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("获取用户信息失败:", error)
    throw error
  }
}

// 获取用户收藏
export async function fetchUserCollections(username: string) {
  try {
    const response = await fetch(`/api/collections?username=${encodeURIComponent(username)}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `获取用户收藏失败: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("获取用户收藏失败:", error)
    throw error
  }
}

// 获取特定年份的热门动画
export async function fetchYearTopAnime(year: number) {
  try {
    const response = await fetch(`/api/top-anime?year=${year}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `获取${year}年热门动画失败: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`获取${year}年热门动画失败:`, error)
    throw error
  }
}
