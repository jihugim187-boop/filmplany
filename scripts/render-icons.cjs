// 사용: node scripts/render-icons.cjs public/icons/logo.svg public/icons  (Playwright 필요, 로고를 바꿀 때 Claude가 실행)
// logo.svg → PNG 아이콘들. 일반 아이콘은 꽉 차게, maskable은 안전 영역(80%) 안에 넣는다.
const { chromium } = require('playwright')
const fs = require('fs')
const [svgPath, outDir] = process.argv.slice(2)
const svg = fs.readFileSync(svgPath, 'utf8')
const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ deviceScaleFactor: 1 })
  const jobs = [
    ['apple-touch-icon.png', 180, 1], ['icon-192.png', 192, 1], ['icon-512.png', 512, 1],
    ['icon-maskable-512.png', 512, 0.8], ['favicon-32.png', 32, 1],
  ]
  for (const [name, size, scale] of jobs) {
    await p.setViewportSize({ width: size, height: size })
    const inner = Math.round(size * scale)
    await p.setContent(`<body style="margin:0;background:#2B4C7E;width:${size}px;height:${size}px;display:grid;place-items:center"><img src="${uri}" width="${inner}" height="${inner}"></body>`)
    await p.screenshot({ path: `${outDir}/${name}`, omitBackground: false })
  }
  await b.close()
})()
