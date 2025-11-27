import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

async function generateIcons() {
  const projectRoot = process.cwd()
  const source = resolve(projectRoot, 'public/images/icon.png')
  const outputDir = resolve(projectRoot, 'public/icons')
  mkdirSync(outputDir, { recursive: true })

const sizes = [192, 256, 384, 512]
const paddingRatio = 0.05 // 5% de marge sur chaque côté (zone utile 90%)
const backgroundColor = { r: 255, g: 255, b: 255, alpha: 1 } // fond blanc

await Promise.all(
  sizes.map(async size => {
    const output = resolve(outputDir, `icon-${size}x${size}.png`)
    const contentSize = Math.round(size * (1 - paddingRatio * 2))
    const margin = Math.round((size - contentSize) / 2)

    const contentBuffer = await sharp(source)
      .resize(contentSize, contentSize, {
        fit: 'contain',
        background: backgroundColor,
      })
      .png()
      .toBuffer()

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: backgroundColor,
      },
    })
      .composite([{ input: contentBuffer, top: margin, left: margin }])
      .png()
      .toFile(output)

    console.log(`✓ ${size}x${size} (zone utile ${contentSize}px)`)
  }),
)

console.log(`Icônes générées dans public/icons avec padding de sécurité (${paddingRatio * 100}%)`)
}

generateIcons().catch(error => {
  console.error('Erreur génération icônes', error)
  process.exit(1)
})

