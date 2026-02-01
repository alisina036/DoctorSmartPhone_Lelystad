export const dynamic = 'force-dynamic'
import connectDB from '@/lib/mongodb'
import { Brand } from '@/lib/models/Brand'
import { Device } from '@/lib/models/Device'
import { Repair } from '@/lib/models/Repair'

export const metadata = {
  title: 'Database',
}

export default async function DatabasePage() {
  let brands = []
  let devices = []
  let repairs = []
  let dbError = false

  try {
    await connectDB()
    brands = await Brand.find().sort({ name: 1 }).lean()
    devices = await Device.find().sort({ name: 1 }).lean()
    repairs = await Repair.find().sort({ name: 1 }).lean()
  } catch (error) {
    console.error('Database verbinding mislukt in DatabasePage:', error)
    dbError = true
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Database Overzicht</h1>
        {dbError && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Kan geen verbinding maken met MongoDB. Controleer Atlas IP whitelist of MONGODB_URI.
          </div>
        )}

        {/* Brands Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Merken ({brands.length})</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image URL</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{brand.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{brand.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{brand.imageUrl || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Devices Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Toestellen ({devices.length})</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merk ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image URL</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.brandId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {device.type || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.imageUrl || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Repairs Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Reparaties ({repairs.length})</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toestel ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {repairs.map((repair) => (
                  <tr key={repair.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{repair.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{repair.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{repair.deviceId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-bold text-[#3ca0de]">€{repair.price}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-[#3ca0de] hover:underline">← Terug naar home</a>
        </div>
      </div>
    </div>
  )
}
