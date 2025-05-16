"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Search, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { exportTableAsImage } from "@/lib/export-utils"
import Image from "next/image"
import { animeData, years, ranks } from "@/lib/anime-data"

// 用户数据类型
interface UserData {
  username: string
  displayName: string
  avatarUrl: string
  watchedAnime: Record<number, Record<number, boolean>>
}

export default function Home() {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [watchedAnime, setWatchedAnime] = useState<Record<number, Record<number, boolean>>>({})
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 从localStorage加载数据
  useEffect(() => {
    const savedData = localStorage.getItem("bangumiAnimeData")
    if (savedData) {
      try {
        const parsedData: UserData = JSON.parse(savedData)
        setUsername(parsedData.username || "")
        setDisplayName(parsedData.displayName || "")
        setAvatarUrl(parsedData.avatarUrl || "")
        setWatchedAnime(parsedData.watchedAnime || {})
      } catch (error) {
        console.error("加载本地数据失败:", error)
      }
    } else {
      // 初始化空的观看数据
      initEmptyWatchedData()
    }
  }, [])

  // 保存数据到localStorage
  const saveToLocalStorage = (data: UserData) => {
    try {
      localStorage.setItem("bangumiAnimeData", JSON.stringify(data))
    } catch (error) {
      console.error("保存数据到本地失败:", error)
      toast({
        title: "保存失败",
        description: "无法保存数据到本地存储",
        variant: "destructive",
      })
    }
  }

  // 初始化空的观看数据
  const initEmptyWatchedData = () => {
    const emptyData: Record<number, Record<number, boolean>> = {}
    years.forEach((year) => {
      emptyData[year] = {}
      ranks.forEach((rank) => {
        emptyData[year][rank] = false
      })
    })
    setWatchedAnime(emptyData)
  }

  // 处理单元格点击
  const handleCellClick = (year: number, rank: number) => {
    if (isLoading) return

    setWatchedAnime((prevData) => {
      const newData = { ...prevData }
      if (!newData[year]) {
        newData[year] = {}
      }
      newData[year][rank] = !newData[year][rank]

      // 保存到localStorage
      saveToLocalStorage({
        username,
        displayName,
        avatarUrl,
        watchedAnime: newData,
      })

      return newData
    })
  }

  // 处理用户搜索
  const handleSearch = async () => {
    if (!username.trim()) {
      toast({
        title: "请输入用户名",
        description: "请输入有效的Bangumi用户名",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 获取用户信息，包括已转换为base64的头像
      const userResponse = await fetch(`/api/user?username=${encodeURIComponent(username)}`)

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || `获取用户信息失败: ${userResponse.statusText}`)
      }

      const userData = await userResponse.json()

      // 设置用户名和头像
      setDisplayName(userData.nickname || username)

      // 如果服务端返回了base64头像，直接使用
      if (userData.avatarBase64) {
        setAvatarUrl(userData.avatarBase64)
      }

      // 获取用户收藏信息
      const collectionsResponse = await fetch(`/api/user-collections?username=${encodeURIComponent(username)}`)

      if (!collectionsResponse.ok) {
        const errorData = await collectionsResponse.json()
        throw new Error(errorData.error || `获取用户收藏失败: ${collectionsResponse.statusText}`)
      }

      const collectionsData = await collectionsResponse.json()

      // 处理用户收藏数据，更新观看状态
      const newWatchedAnime = { ...watchedAnime }

      // 创建一个集合，存储用户已看过的动画ID
      const watchedIds = new Set(collectionsData.data.map((item: any) => item.subject_id))

      // 遍历所有年份和排名
      years.forEach((year) => {
        if (!newWatchedAnime[year]) {
          newWatchedAnime[year] = {}
        }

        ranks.forEach((rank) => {
          const anime =
            animeData[year as keyof typeof animeData]?.[rank as keyof (typeof animeData)[keyof typeof animeData]]
          if (anime && watchedIds.has(anime.id)) {
            newWatchedAnime[year][rank] = true
          } else {
            newWatchedAnime[year][rank] = false
          }
        })
      })

      // 更新观看状态
      setWatchedAnime(newWatchedAnime)

      // 保存到localStorage
      saveToLocalStorage({
        username,
        displayName: userData.nickname || username,
        avatarUrl: userData.avatarBase64 || avatarUrl,
        watchedAnime: newWatchedAnime,
      })

      toast({
        title: "加载完成",
        description: "用户信息和收藏已更新",
      })
    } catch (error) {
      console.error("加载数据失败:", error)
      toast({
        title: "加载失败",
        description: error instanceof Error ? error.message : "获取用户信息时出错",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 导出图片
  const handleExport = () => {
    const tableElement = document.getElementById("anime-table")
    const watermarkElement = document.getElementById("export-watermark")
    if (tableElement && watermarkElement) {
      exportTableAsImage(tableElement, watermarkElement, `bangumi-anime-${displayName || username || "manual"}.png`)
    }
  }

  // 处理头像点击
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // 处理头像变更
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAvatarUrl = event.target.result as string
          setAvatarUrl(newAvatarUrl)

          // 保存到localStorage
          saveToLocalStorage({
            username,
            displayName,
            avatarUrl: newAvatarUrl,
            watchedAnime,
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // 处理显示名称变更
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setDisplayName(newName)

    // 保存到localStorage
    saveToLocalStorage({
      username,
      displayName: newName,
      avatarUrl,
      watchedAnime,
    })
  }

  return (
    <main className="container mx-auto py-8 px-4 min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div
            className="relative w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={handleAvatarClick}
          >
            {avatarUrl ? (
              <Image src={avatarUrl || "/placeholder.svg"} alt="用户头像" fill className="object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="用户名称"
              value={displayName}
              onChange={handleDisplayNameChange}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Bangumi用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button onClick={handleSearch} disabled={isLoading} className="whitespace-nowrap">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                搜索
              </Button>
            </div>
          </div>
        </div>

        <Button onClick={handleExport} className="flex items-center gap-2 w-full md:w-auto">
          <Download size={16} />
          导出为图片
        </Button>
      </div>

      <div className="w-full overflow-auto">
        <table id="anime-table" className="w-full border-collapse">
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <td className="border p-2 font-bold bg-gray-100 sticky left-0 z-10">{year}</td>
                {ranks.map((rank) => {
                  const anime =
                    animeData[year as keyof typeof animeData]?.[
                      rank as keyof (typeof animeData)[keyof typeof animeData]
                    ]
                  const isWatched = watchedAnime[year]?.[rank] || false

                  // 如果没有中文名，则显示原名
                  const displayTitle = anime?.name_cn || anime?.name || ""

                  return (
                    <td
                      key={`${year}-${rank}`}
                      className={`border p-2 text-xs w-[100px] min-w-[100px] ${
                        isWatched ? "bg-orange-400 text-white" : "bg-white"
                      }`}
                      title={anime?.name || ""}
                      onClick={() => handleCellClick(year, rank)}
                    >
                      {displayTitle}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 导出图片时的水印，平时隐藏 */}
      <div id="export-watermark" className="hidden">
        <div className="user-info">
          {avatarUrl && <img src={avatarUrl || "/placeholder.svg"} alt="用户头像" className="avatar" />}
          {displayName && <span className="username">{displayName}的动画生涯宾果卡</span>}
        </div>
        <div className="site-info">动画生涯宾果卡 by 苍旻白轮 (animebingo.shatranj.space)</div>
      </div>

      <footer className="mt-8 text-center text-gray-500 text-sm py-4 border-t">
        <p>© 2025 动画生涯宾果卡 | 数据来源: Bangumi.tv</p>
        <p className="mt-1">本工具仅供学习交流使用，与Bangumi官方无关</p>
        <p className="flex items-center justify-center mt-1">
          <a 
            href="https://github.com/SomiaWhiteRing/anime-bingo-card" 
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
            <img 
              src="https://img.shields.io/github/stars/SomiaWhiteRing/anime-bingo-card?style=social" 
              alt="GitHub Stars" 
              className="align-middle"
            />
          </a>
          <a 
            href="https://hits.sh/github.com/SomiaWhiteRing/anime-bingo-card/"
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center"
          >
            <img 
              src="https://hits.sh/github.com/SomiaWhiteRing/anime-bingo-card.svg?label=visitors&color=007ec6"
              alt="Visitors Count"
              className="align-middle"
            />
          </a>
        </p>
      </footer>
    </main>
  )
}
