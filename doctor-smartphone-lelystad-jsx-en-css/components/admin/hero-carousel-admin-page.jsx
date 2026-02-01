"use client"

import { useEffect, useState, useTransition } from "react"
import { Plus, Trash2, MoveUp, MoveDown, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AdminNav from "@/components/admin/admin-nav"
import AdminHeader from "@/components/admin/admin-header"
import { useToast } from "@/hooks/use-toast"
import ConfirmDialog from "@/components/admin/confirm-dialog"

export default function HeroCarouselAdminPage() {
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Verwijderen",
    onConfirm: null,
  })

  // Form state voor nieuwe items
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newTitle, setNewTitle] = useState("")

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const res = await fetch("/api/hero-carousel")
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Failed to load items:", e)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/hero-carousel-upload", {
        method: "POST",
        body: formData,
      })

      const result = await res.json()
      if (result.ok && result.publicPath) {
        setNewImageUrl(result.publicPath)
      } else {
        toast({
          variant: "destructive",
          title: "Upload mislukt",
          description: result.error || "Upload mislukt",
        })
      }
    } catch (e) {
      console.error("Upload error:", e)
      toast({
        variant: "destructive",
        title: "Upload mislukt",
        description: "Er ging iets mis bij het uploaden.",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = async () => {
    if (!newImageUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Afbeelding ontbreekt",
        description: "Voeg een afbeelding toe om te kunnen opslaan.",
      })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/hero-carousel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: newImageUrl,
            title: newTitle,
            order: items.length,
          }),
        })

        if (res.ok) {
          setNewImageUrl("")
          setNewTitle("")
          await loadItems()
        }
      } catch (e) {
        console.error("Failed to add item:", e)
      }
    })
  }

  const handleDelete = async (id) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/hero-carousel?id=${id}`, {
          method: "DELETE",
        })

        if (res.ok) {
          await loadItems()
          toast({
            title: "Foto verwijderd",
            description: "De foto is verwijderd uit de carousel.",
          })
        }
      } catch (e) {
        console.error("Failed to delete item:", e)
        toast({
          variant: "destructive",
          title: "Verwijderen mislukt",
          description: "Er ging iets mis bij het verwijderen.",
        })
      }
    })
  }

  const confirmDelete = (id) => {
    setConfirmDialog({
      open: true,
      title: "Foto verwijderen",
      description: "Weet je zeker dat je deze foto wilt verwijderen?",
      confirmLabel: "Verwijderen",
      onConfirm: () => handleDelete(id),
    })
  }

  const handleMoveUp = async (index) => {
    if (index === 0) return

    const newItems = [...items]
    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]

    // Update orders
    for (let i = 0; i < newItems.length; i++) {
      newItems[i].order = i
    }

    setItems(newItems)
    await saveOrder(newItems)
  }

  const handleMoveDown = async (index) => {
    if (index === items.length - 1) return

    const newItems = [...items]
    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]

    for (let i = 0; i < newItems.length; i++) {
      newItems[i].order = i
    }

    setItems(newItems)
    await saveOrder(newItems)
  }

  const saveOrder = async (newItems) => {
    startTransition(async () => {
      try {
        for (const item of newItems) {
          await fetch("/api/hero-carousel", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          })
        }
      } catch (e) {
        console.error("Failed to save order:", e)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <AdminHeader title="Hero Carousel" count={`${items.length} foto's`} isPending={isPending} />

        <AdminNav />

        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-1">📸 Hero Carousel Beheer</h2>
          <p className="text-gray-600 text-sm mb-6">
            Upload foto's voor de carousel op de homepage. Sleep ze om de volgorde te wijzigen.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Foto uploaden</Label>
              <div className="flex gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <span className="text-sm text-gray-500">Uploaden...</span>}
              </div>
              {newImageUrl && (
                <div className="mt-2">
                  <img src={newImageUrl} alt="Preview" className="h-20 rounded border" />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="title">Titel (optioneel)</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Beschrijvende titel"
              />
            </div>

            <Button onClick={handleAdd} disabled={!newImageUrl || isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Toevoegen
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Huidige Carousel Foto's</h2>

          {items.length === 0 ? (
            <div className="text-sm text-gray-600">Nog geen foto's toegevoegd.</div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item._id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <img src={item.imageUrl} alt={item.title || "Carousel"} className="w-32 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-medium">{item.title || "Geen titel"}</div>
                    <div className="text-sm text-gray-500">Positie: {index + 1}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || isPending}
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1 || isPending}
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => confirmDelete(item._id)}
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        />
      </div>
    </div>
  )
}
