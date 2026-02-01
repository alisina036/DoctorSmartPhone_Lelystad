import { v2 as cloudinary } from "cloudinary"

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  console.warn("Cloudinary env vars ontbreken. Uploads zullen falen totdat deze zijn ingesteld.")
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
})

export function uploadImageBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
    stream.end(buffer)
  })
}

export function getCloudinaryPublicId(url) {
  try {
    const u = new URL(String(url || ""))
    if (u.hostname !== "res.cloudinary.com") return ""
    const parts = u.pathname.split("/").filter(Boolean)
    const uploadIndex = parts.indexOf("upload")
    if (uploadIndex === -1) return ""
    let rest = parts.slice(uploadIndex + 1)
    if (rest[0] && /^v\d+/.test(rest[0])) rest = rest.slice(1)
    const withExt = rest.join("/")
    if (!withExt) return ""
    return withExt.replace(/\.[^/.]+$/, "")
  } catch {
    return ""
  }
}

export async function deleteCloudinaryImageByUrl(url) {
  const publicId = getCloudinaryPublicId(url)
  if (!publicId) return null
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" })
}
