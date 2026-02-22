"use client"

import { useEffect, useState } from "react"

export default function DymoForcePrintClient() {
	const [productName, setProductName] = useState("")
	const [price, setPrice] = useState("")
	const [sku, setSku] = useState("")

	const [isServerReady, setIsServerReady] = useState(false)
	const [resultMessage, setResultMessage] = useState("")
	const [isPrinting, setIsPrinting] = useState(false)

	const checkServer = async () => {
		try {
			const response = await fetch("/api/admin/dymo/python-native-proxy", {
				method: "GET",
				cache: "no-store",
			})

			const data = await response.json().catch(() => ({}))
			setIsServerReady(Boolean(response.ok && data?.status === "ok"))
		} catch {
			setIsServerReady(false)
		}
	}

	useEffect(() => {
		checkServer()
	}, [])

	const handlePrint = async (event) => {
		event.preventDefault()
		setResultMessage("")

		if (!productName.trim() || !price.trim() || !sku.trim()) {
			setResultMessage("Vul productName, price en sku in.")
			return
		}

		setIsPrinting(true)

		try {
			const response = await fetch("/api/admin/dymo/python-native-proxy", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productName, price, sku }),
			})

			const data = await response.json().catch(() => ({}))

			if (response.ok && data?.success) {
				setResultMessage("Print verzonden.")
			} else {
				const code = data?.errorCode ?? "onbekend"
				setResultMessage(`Print mislukt (${code}): ${data?.error || "Onbekende fout"}`)
			}
		} catch {
			setResultMessage("Kan de proxy niet bereiken. Controleer of Next.js draait.")
		} finally {
			setIsPrinting(false)
			checkServer()
		}
	}

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<h1 className="text-2xl font-bold">DYMO Simple Test (Python GDI)</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				{isServerReady ? "Printer Gereed" : "Start Python Server"}
			</p>

			<form onSubmit={handlePrint} className="mt-6 space-y-4 rounded-lg border p-4">
				<div>
					<label htmlFor="productName" className="mb-1 block text-sm font-medium">
						productName
					</label>
					<input
						id="productName"
						value={productName}
						onChange={(event) => setProductName(event.target.value)}
						className="w-full rounded-md border bg-background px-3 py-2 text-sm"
						placeholder="Bijv. iPhone 13 scherm"
					/>
				</div>

				<div>
					<label htmlFor="price" className="mb-1 block text-sm font-medium">
						price
					</label>
					<input
						id="price"
						value={price}
						onChange={(event) => setPrice(event.target.value)}
						className="w-full rounded-md border bg-background px-3 py-2 text-sm"
						placeholder="Bijv. €99,00"
					/>
				</div>

				<div>
					<label htmlFor="sku" className="mb-1 block text-sm font-medium">
						sku
					</label>
					<input
						id="sku"
						value={sku}
						onChange={(event) => setSku(event.target.value)}
						className="w-full rounded-md border bg-background px-3 py-2 text-sm"
						placeholder="Bijv. SKU-123"
					/>
				</div>

				<button
					type="submit"
					disabled={isPrinting}
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
				>
					{isPrinting ? "Bezig met printen..." : "Print"}
				</button>
			</form>

			{resultMessage ? <p className="mt-4 text-sm">{resultMessage}</p> : null}
		</div>
	)
}
