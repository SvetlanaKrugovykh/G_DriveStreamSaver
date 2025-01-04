const axios = require("axios")
const fs = require("fs")
const links = require("../data/links")

const TOKEN = process.env.TOKEN
const OAUTH_TOKEN = process.env.OAUTH_TOKEN

function extractFileId(link) {
  const match = link.match(/\/file\/d\/(.*?)\//)
  return match ? match[1] : null
}

async function getFileMetadata(fileId) {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name`
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${OAUTH_TOKEN}`,
      },
    })
    return response.data.name
  } catch (error) {
    console.error(`Error fetching file metadata: ${error.message}`)
    return null
  }
}

async function downloadFile(fileId, outputFileName) {
  try {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`
    const response = await axios.get(url, {
      headers: {
        Cookie: `SID=${TOKEN}`,
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
    console.error(`File download error: ${error.message}`)
  }
}

(async () => {
  for (const [index, link] of links.entries()) {
    const fileId = extractFileId(link)
    if (!fileId) {
      console.error(`Unreachable link: ${link}`)
      continue
    }
    const originalFileName = await getFileMetadata(fileId)
    if (!originalFileName) {
      console.error(`Could not retrieve file name for link: ${link}`)
      continue
    }
    await downloadFile(fileId, originalFileName)
  }
})()
