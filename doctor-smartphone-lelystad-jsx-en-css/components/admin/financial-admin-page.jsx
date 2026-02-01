"use client"

import { useEffect, useMemo, useState } from "react"
import AdminNav from "@/components/admin/admin-nav"
import AdminHeader from "@/components/admin/admin-header"

const STORAGE_KEY = "financialYearData-v1"
const MONTHS = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
]
const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"]

const createEmptyDay = (day) => ({
  day,
  incomePin: 0,
  incomeCash: 0,
  expensePin: 0,
  expenseCash: 0,
  notes: "",
})

const createMonth = (year, monthIndex) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => createEmptyDay(i + 1))
}

const createYearData = (year) => Array.from({ length: 12 }, (_, i) => createMonth(year, i))

const parseNumber = (value) => {
  const normalized = String(value ?? "").replace(",", ".")
  const number = Number.parseFloat(normalized)
  return Number.isFinite(number) ? number : 0
}

const calcVat = (amount) => amount - amount / 1.21

export default function FinancialAdminPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [allYears, setAllYears] = useState({})
  const [selectedDayIndex, setSelectedDayIndex] = useState(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setAllYears(parsed || {})
      } catch {
        setAllYears({})
      }
    }
  }, [])

  useEffect(() => {
    setAllYears((prev) => {
      if (prev?.[selectedYear]) return prev
      return { ...prev, [selectedYear]: createYearData(selectedYear) }
    })
  }, [selectedYear])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allYears))
  }, [allYears])

  const yearData = allYears[selectedYear] || createYearData(selectedYear)
  const monthData = yearData[selectedMonth] || []

  const totals = useMemo(() => {
    const sum = (key) => monthData.reduce((acc, day) => acc + (Number(day[key]) || 0), 0)
    const totalIncomePin = sum("incomePin")
    const totalIncomeCash = sum("incomeCash")
    const totalExpensePin = sum("expensePin")
    const totalExpenseCash = sum("expenseCash")
    const grossRevenue = totalIncomePin + totalIncomeCash
    const grossCosts = totalExpensePin + totalExpenseCash
    const vatIncome = calcVat(totalIncomePin) + calcVat(totalIncomeCash)
    const vatExpense = calcVat(totalExpensePin) + calcVat(totalExpenseCash)

    return {
      totalIncomePin,
      totalIncomeCash,
      totalExpensePin,
      totalExpenseCash,
      grossRevenue,
      grossCosts,
      vatIncome,
      vatExpense,
      vatPayable: vatIncome - vatExpense,
      cashBalance: totalIncomeCash - totalExpenseCash,
      netProfit: (grossRevenue - vatIncome) - (grossCosts - vatExpense),
    }
  }, [monthData])

  const monthLabel = MONTHS[selectedMonth]
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay()
  const startOffset = (firstDay + 6) % 7

  const openDay = (index) => setSelectedDayIndex(index)
  const closeDay = () => setSelectedDayIndex(null)

  const updateDay = (index, patch) => {
    setAllYears((prev) => {
      const baseYear = prev[selectedYear] || createYearData(selectedYear)
      const nextMonth = baseYear[selectedMonth].map((day, i) =>
        i === index ? { ...day, ...patch } : day
      )
      const nextYear = [...baseYear]
      nextYear[selectedMonth] = nextMonth
      return { ...prev, [selectedYear]: nextYear }
    })
  }

  const dayData = selectedDayIndex !== null ? monthData[selectedDayIndex] : null
  const hasData = (day) => {
    return (
      day.incomePin > 0 ||
      day.incomeCash > 0 ||
      day.expensePin > 0 ||
      day.expenseCash > 0 ||
      (day.notes && day.notes.trim().length > 0)
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Financiën" count={daysInMonth} isPending={false} />
        <AdminNav />

        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-1">💼 Financial Management</h2>
          <p className="text-gray-600 text-sm">Dagelijkse inkomsten en uitgaven beheren met BTW & kassaldo.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white border rounded-xl p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Jaar</span>
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(Number(event.target.value))}
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MONTHS.map((month, index) => {
                    const isActive = index === selectedMonth
                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => setSelectedMonth(index)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${
                          isActive
                            ? "bg-[#3ca0de] text-white border-[#3ca0de]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#3ca0de]"
                        }`}
                      >
                        {month}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">📅 {monthLabel} {selectedYear}</h3>
                  <p className="text-sm text-gray-500">Klik op een dag om inkomsten/uitgaven te bewerken.</p>
                </div>
                <div className="text-xs text-gray-500">Gemarkeerde dagen bevatten data</div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 mb-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="font-semibold">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startOffset }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-16" />
                ))}
                {monthData.map((day, index) => {
                  const marked = hasData(day)
                  return (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() => openDay(index)}
                      className={`h-16 rounded-lg border text-left px-2 py-1 transition shadow-sm ${
                        marked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-gray-200 hover:border-[#3ca0de]/50"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-800">{day.day}</div>
                      {marked && (
                        <div className="text-[11px] text-emerald-700">Data</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border rounded-xl p-5">
              <h3 className="text-lg font-semibold mb-4">📊 Maandoverzicht</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Omzet (Bruto)</span>
                  <span className="font-semibold">€ {totals.grossRevenue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kosten (Bruto)</span>
                  <span className="font-semibold">€ {totals.grossCosts.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Belastingdienst (BTW saldo)</span>
                  <span className={`font-semibold ${totals.vatPayable >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    € {totals.vatPayable.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Netto Winst</span>
                  <span className={`font-semibold ${totals.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    € {totals.netProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <h3 className="text-lg font-semibold mb-4">💵 Kassaldo</h3>
              <div className="text-sm text-gray-600">
                Theoretisch kassaldo = Contant inkomsten - Contant uitgaven
              </div>
              <div className="mt-3 text-2xl font-bold text-gray-800">
                € {totals.cashBalance.toFixed(2)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-gray-500">💳 Inkomsten PIN</div>
                  <div className="font-semibold">€ {totals.totalIncomePin.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-gray-500">💵 Inkomsten Contant</div>
                  <div className="font-semibold">€ {totals.totalIncomeCash.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-gray-500">💳 Uitgaven PIN</div>
                  <div className="font-semibold">€ {totals.totalExpensePin.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-gray-500">💵 Uitgaven Contant</div>
                  <div className="font-semibold">€ {totals.totalExpenseCash.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{dayData.day} {monthLabel} {selectedYear}</h3>
                <p className="text-sm text-gray-500">Vul de geldstromen in (bedragen incl. BTW).</p>
              </div>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800"
                onClick={closeDay}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium">💳 Inkomsten PIN</span>
                <input
                  type="number"
                  step="0.01"
                  value={dayData.incomePin}
                  onChange={(event) => updateDay(selectedDayIndex, { incomePin: parseNumber(event.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">💵 Inkomsten Contant</span>
                <input
                  type="number"
                  step="0.01"
                  value={dayData.incomeCash}
                  onChange={(event) => updateDay(selectedDayIndex, { incomeCash: parseNumber(event.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">💳 Uitgaven PIN/Bank</span>
                <input
                  type="number"
                  step="0.01"
                  value={dayData.expensePin}
                  onChange={(event) => updateDay(selectedDayIndex, { expensePin: parseNumber(event.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">💵 Uitgaven Contant</span>
                <input
                  type="number"
                  step="0.01"
                  value={dayData.expenseCash}
                  onChange={(event) => updateDay(selectedDayIndex, { expenseCash: parseNumber(event.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </label>
            </div>

            <label className="block mt-4 text-sm space-y-2">
              <span className="font-medium">Notities</span>
              <textarea
                rows="3"
                value={dayData.notes}
                onChange={(event) => updateDay(selectedDayIndex, { notes: event.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Bijv. pin storing, kasverschil, leveranciersbetaling..."
              />
            </label>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="text-gray-500">BTW Inkomsten</div>
                <div className="font-semibold">€ {(calcVat(dayData.incomePin) + calcVat(dayData.incomeCash)).toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="text-gray-500">BTW Uitgaven</div>
                <div className="font-semibold">€ {(calcVat(dayData.expensePin) + calcVat(dayData.expenseCash)).toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="text-gray-500">Kassaldo (dag)</div>
                <div className="font-semibold">€ {(dayData.incomeCash - dayData.expenseCash).toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                type="button"
                onClick={closeDay}
                className="px-4 py-2 rounded-lg bg-[#3ca0de] text-white hover:bg-[#2d8bc7]"
              >
                Opslaan & sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
