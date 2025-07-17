import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // ファイルサイズ制限（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // ファイルタイプ検証
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ファイル名生成
    const extension = path.extname(file.name)
    const filename = `${uuidv4()}${extension}`
    const filepath = path.join(process.cwd(), 'public/uploads', filename)

    // アップロードディレクトリの作成
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    try {
      await writeFile(path.join(uploadDir, '.gitkeep'), '')
    } catch {
      // ディレクトリが既に存在する場合は無視
    }

    // ファイル保存
    await writeFile(filepath, buffer)

    return NextResponse.json({ 
      success: true, 
      filename,
      url: `/uploads/${filename}` 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
