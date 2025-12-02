import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { Readable, PassThrough } from "stream";

// ffmpegのパスを設定
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * WebM音声をWAV形式に変換する（サーバーサイド）
 * @param inputBuffer - WebM音声のBuffer
 * @returns WAV形式のBuffer
 */
export async function convertWebMToWav(inputBuffer: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		const inputStream = Readable.from(inputBuffer);
		const outputStream = new PassThrough();

		outputStream.on("data", (chunk: Buffer) => {
			chunks.push(chunk);
		});

		outputStream.on("end", () => {
			const outputBuffer = Buffer.concat(chunks);
			resolve(outputBuffer);
		});

		outputStream.on("error", (err) => {
			reject(err);
		});

		ffmpeg(inputStream)
			.inputFormat("webm")
			.audioCodec("pcm_s16le") // 16-bit PCM
			.audioChannels(1) // モノラル
			.audioFrequency(44100) // 44.1kHz
			.format("wav")
			.on("error", (err) => {
				reject(new Error(`Audio conversion failed: ${err.message}`));
			})
			.pipe(outputStream, { end: true });
	});
}

/**
 * WebM音声をM4A (AAC) 形式に変換する（サーバーサイド）
 * @param inputBuffer - WebM音声のBuffer
 * @returns M4A形式のBuffer
 */
export async function convertWebMToM4A(inputBuffer: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		const inputStream = Readable.from(inputBuffer);
		const outputStream = new PassThrough();

		outputStream.on("data", (chunk: Buffer) => {
			chunks.push(chunk);
		});

		outputStream.on("end", () => {
			const outputBuffer = Buffer.concat(chunks);
			resolve(outputBuffer);
		});

		outputStream.on("error", (err) => {
			reject(err);
		});

		ffmpeg(inputStream)
			.inputFormat("webm")
			.audioCodec("aac") // AAC codec
			.audioBitrate("128k")
			.audioChannels(1)
			.audioFrequency(44100)
			.format("mp4")
			.on("error", (err) => {
				reject(new Error(`Audio conversion failed: ${err.message}`));
			})
			.pipe(outputStream, { end: true });
	});
}
