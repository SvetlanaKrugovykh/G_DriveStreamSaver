const axios = require("axios")
const fs = require("fs")
const xlsx = require("xlsx")

function extractFileId(link) {
  const match = link.match(/\/file\/d\/(.*?)\//)
  return match ? match[1] : null
}

async function downloadFile(fileId, outputFileName) {
  try {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`
    const response = await axios.get(url, {
      headers: {
        Cookie: `SID=${process.env.SID_TOKEN}`,
      },
      responseType: "stream",
    })

    const writer = fs.createWriteStream(outputFileName)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`File saved as ${outputFileName}`)
        resolve()
      })
      writer.on("error", reject)
    })
  } catch (error) {
    console.error(`Error downloading file ${fileId}: ${error.message}`)
  }
}

(async () => {
  const inputXls = "./data/names_and_links.xlsx"
  const outputDir = "/data/downloads"

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  const workbook = xlsx.readFile(inputXls)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 })

  for (const [index, row] of rows.entries()) {
    if (index === 0) continue

    const [fileName, link] = row
    if (!fileName || !link) {
      console.error(`Invalid data in row ${index + 1}`)
      continue
    }

    const fileId = extractFileId(link)
    if (!fileId) {
      console.error(`Invalid link in row ${index + 1}: ${link}`)
      continue
    }

    const outputFileName = `${outputDir}/${fileName}.JDG`
    await downloadFile(fileId, outputFileName)
  }
})()
