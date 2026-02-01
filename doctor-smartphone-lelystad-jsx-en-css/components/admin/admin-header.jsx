"use client"

export default function AdminHeader({ title, count, isPending }) {
  return (
    <div className="bg-white border rounded-xl p-6 mb-6">
      <h1 className="text-3xl font-bold mb-2">✅ Admin Dashboard</h1>
      <p className="text-gray-600">{title}: {count}</p>
      {isPending && <div className="mt-2 text-sm text-gray-500">Bezig...</div>}
    </div>
  )
}
