import { NextResponse } from "next/server"

export const runtime = "nodejs"

const PYTHON_BASE_URLS = ["http://127.0.0.1:5001", "http://localhost:5001"]

async function fetchPython(path, init) {
	let lastError = null

	for (const baseUrl of PYTHON_BASE_URLS) {
		try {
			const response = await fetch(`${baseUrl}${path}`, {
				...init,
				cache: "no-store",
			})
			return { response, baseUrl }
		} catch (error) {
			lastError = error
		}
	}

	throw lastError || new Error("Python backend niet bereikbaar")
}

export async function GET() {
	try {
		const { response, baseUrl } = await fetchPython("/health", {
			method: "GET",
		})

		const data = await response.json().catch(() => ({}))

		if (!response.ok) {
			return NextResponse.json(
				{
					status: "offline",
					success: false,
					error: data?.error || "Python server reageert niet correct",
					pythonBaseUrl: baseUrl,
				},
				{ status: 503 }
			)
		}

		return NextResponse.json({ status: "ok", success: true, pythonBaseUrl: baseUrl })
	} catch (error) {
		return NextResponse.json(
			{
				status: "offline",
				success: false,
				error: "Python backend offline. Start: .\\.venv\\Scripts\\python.exe scripts\\dymo_native_flask_server.py",
				details: error?.message || "connectie mislukt",
			},
			{ status: 503 }
		)
	}
}

export async function POST(request) {
	try {
		const body = await request.json()
		const productName = String(body?.productName ?? "").trim()
		const price = String(body?.price ?? "").trim()
		const sku = String(body?.sku ?? "").trim()

		if (!productName || !price || !sku) {
			return NextResponse.json(
				{
					success: false,
					error: "productName, price en sku zijn verplicht",
					errorCode: null,
				},
				{ status: 400 }
			)
		}

		const { response, baseUrl } = await fetchPython("/print", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ productName, price, sku }),
		})

		const data = await response.json().catch(() => ({}))

		if (response.ok) {
			return NextResponse.json({ success: true, pythonBaseUrl: baseUrl })
		}

		return NextResponse.json(
			{
				success: false,
				error: data?.error || "Print mislukt in Python backend",
				errorCode: data?.errorCode ?? null,
				pythonBaseUrl: baseUrl,
			},
			{ status: response.status || 500 }
		)
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: "Python backend niet bereikbaar. Start: .\\.venv\\Scripts\\python.exe scripts\\dymo_native_flask_server.py",
				details: error?.message || "connectie mislukt",
				errorCode: null,
			},
			{ status: 503 }
		)
	}
}
