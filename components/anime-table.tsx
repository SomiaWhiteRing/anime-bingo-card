interface AnimeTableProps {
  data: Record<number, Record<number, any>>
  years: number[]
  ranks: number[]
}

export function AnimeTable({ data, years, ranks }: AnimeTableProps) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-100">年份\排名</th>
            {ranks.map((rank) => (
              <th key={rank} className="border p-2 bg-gray-100">
                {rank}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <td className="border p-2 font-bold bg-gray-100">{year}</td>
              {ranks.map((rank) => {
                const anime = data[year]?.[rank]
                return (
                  <td
                    key={`${year}-${rank}`}
                    className={`border p-2 text-xs ${anime?.watched ? "bg-orange-400" : "bg-white"}`}
                    title={anime?.name_cn || anime?.name || ""}
                  >
                    {anime?.name_cn || anime?.name || ""}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
