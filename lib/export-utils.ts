import html2canvas from "html2canvas"

export async function exportTableAsImage(tableElement: HTMLElement, watermarkElement: HTMLElement, filename: string) {
  try {
    // 创建一个包装容器
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.background = "#ffffff"
    container.style.padding = "20px"
    document.body.appendChild(container)

    // 准备水印 - 用户信息部分
    const watermarkClone = watermarkElement.cloneNode(true) as HTMLElement
    watermarkClone.style.display = "block"
    watermarkClone.style.marginBottom = "20px"

    // 添加水印样式
    const userInfo = watermarkClone.querySelector(".user-info") as HTMLElement
    if (userInfo) {
      userInfo.style.display = "flex"
      userInfo.style.alignItems = "center"
      userInfo.style.justifyContent = "flex-start"
      userInfo.style.marginBottom = "20px"

      const avatar = userInfo.querySelector(".avatar") as HTMLImageElement
      if (avatar) {
        avatar.style.width = "40px"
        avatar.style.height = "40px"
        avatar.style.borderRadius = "50%"
        avatar.style.marginRight = "10px"
      }

      const username = userInfo.querySelector(".username") as HTMLElement
      if (username) {
        username.style.fontSize = "18px"
        username.style.fontWeight = "bold"
      }
    }

    // 先添加用户信息，确保它在左上角
    container.appendChild(userInfo)

    // 克隆表格
    const tableClone = tableElement.cloneNode(true) as HTMLElement

    // 修复表头定位问题
    const yearHeaders = tableClone.querySelectorAll("td.sticky")
    yearHeaders.forEach((header) => {
      const headerElement = header as HTMLElement
      headerElement.style.position = "static" // 移除sticky定位
      headerElement.classList.remove("sticky", "left-0", "z-10") // 移除相关类
    })

    // 增加表格单元格的底部边距
    const cells = tableClone.querySelectorAll("td")
    cells.forEach((cell) => {
      const cellElement = cell as HTMLElement
      cellElement.style.paddingBottom = "8px" // 增加底部边距
    })

    // 添加表格
    container.appendChild(tableClone)

    // 添加网站信息到底部
    const siteInfo = watermarkClone.querySelector(".site-info") as HTMLElement
    if (siteInfo) {
      siteInfo.style.textAlign = "center"
      siteInfo.style.fontSize = "14px"
      siteInfo.style.color = "#666"
      siteInfo.style.marginTop = "20px"
      container.appendChild(siteInfo)
    }

    // 生成图片
    const canvas = await html2canvas(container, {
      backgroundColor: "#ffffff",
      scale: 2, // 提高导出图片的清晰度
      logging: false,
      useCORS: true,
    })

    // 移除临时元素
    document.body.removeChild(container)

    // 创建下载链接
    const link = document.createElement("a")
    link.download = filename
    link.href = canvas.toDataURL("image/png")
    link.click()
  } catch (error) {
    console.error("导出图片失败:", error)
    throw error
  }
}
