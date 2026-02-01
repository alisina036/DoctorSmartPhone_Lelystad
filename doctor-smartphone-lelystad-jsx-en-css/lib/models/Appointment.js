import mongoose from "mongoose"

const AppointmentSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    telefoon: { type: String, required: true, trim: true },
    apparaat: { type: String, required: true, trim: true },
    probleem: { type: String, default: "", trim: true },
    bericht: { type: String, required: true, trim: true },

    // Appointment is date-only; we store at start-of-day in server timezone.
    appointmentDate: { type: Date, required: true, index: true },

    // Soft-delete window: set when user deletes in admin.
    deletedAt: { type: Date, default: null, index: true },

    // TTL: after soft delete, deleteAfter = now + 7 days.
    deleteAfter: { type: Date, default: null },

    // TTL: automatically delete 7 days after the appointment date passed.
    expireAfter: { type: Date, default: null },
  },
  { timestamps: true }
)

// TTL indexes (MongoDB will remove documents once the date is reached)
AppointmentSchema.index({ deleteAfter: 1 }, { expireAfterSeconds: 0 })
AppointmentSchema.index({ expireAfter: 1 }, { expireAfterSeconds: 0 })

export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema)

let didEnsureAppointmentIndexes = false

export async function ensureAppointmentIndexes() {
  if (didEnsureAppointmentIndexes) return
  try {
    // Create schema indexes (TTL) best-effort.
    try {
      await Appointment.createIndexes()
    } catch {
      // ignore
    }

    // Drop legacy unique index on `id` if it exists.
    // This index can break inserts with: E11000 ... index: id_1 dup key: { id: null }
    const indexes = await Appointment.collection.indexes()
    const legacy = indexes?.find((ix) => ix?.name === "id_1" || (ix?.key && ix.key.id === 1))
    if (legacy) {
      await Appointment.collection.dropIndex(legacy.name || "id_1")
    }

    didEnsureAppointmentIndexes = true
  } catch {
    // If this fails (permissions, transient), allow retry later.
    didEnsureAppointmentIndexes = false
  }
}
