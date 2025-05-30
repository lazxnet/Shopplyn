"use client"
import React, { useState, useEffect } from "react"
import { Category } from "./types"
import CreateCategoryForm from "./CreateCategoryForm"

const CATEGORIES_CACHE_KEY = "cached_categories"
const CACHE_EXPIRATION = 3600000 // 1 hora en milisegundos

export default function CategoryModal({
  show,
  onClose,
  categoriesList,
  loading,
  error,
  loadCategories
}: {
  show: boolean
  onClose: () => void
  categoriesList: Category[]
  loading: boolean
  error: string
  loadCategories: () => Promise<void>
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (show) loadCategories()
  }, [show])

  const handleDelete = async (categoryId: string) => {
    try {
      setDeleteError("")
      setDeletingId(categoryId)
      
      const userAdminId = sessionStorage.getItem("userAdminId")
      if (!userAdminId) throw new Error("Acceso no autorizado")

      const url = new URL(
        `http://localhost:8080/category/delete_category/${categoryId}`
      )
      url.searchParams.append("UserAdminId", userAdminId)

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Error al eliminar la categoría")
      }

      sessionStorage.removeItem(CATEGORIES_CACHE_KEY)
      await loadCategories()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error en el servidor")
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateSuccess = async () => {
    sessionStorage.removeItem(CATEGORIES_CACHE_KEY)
    await loadCategories()
    setShowCreateForm(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {showCreateForm ? "Nueva categoría" : "Todas las categorías"}
            </h3>
            <div className="flex gap-2">
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Nueva categoría
                </button>
              )}
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>
          </div>

          {showCreateForm ? (
            <CreateCategoryForm
              onCancel={() => setShowCreateForm(false)}
              onCreateSuccess={handleCreateSuccess}
            />
          ) : (
            <>
              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  Error: {deleteError}
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2">Cargando categorías...</p>
                </div>
              ) : error ? (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  Error: {error}
                </div>
              ) : categoriesList.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay categorías registradas
                </div>
              ) : (
                <div className="grid gap-4">
                  {categoriesList.map(category => (
                    <div 
                      key={category.categoryId} 
                      className="border rounded-lg p-4 relative hover:bg-gray-50 transition-colors"
                    >
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => handleDelete(category.categoryId)}
                          disabled={deletingId === category.categoryId}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Eliminar categoría"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      <h4 className="font-semibold text-lg pr-6">{category.name}</h4>
                      <p className="text-gray-600 mt-1">{category.description}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Creado por: {category.userAdmin.fullName}</p>
                        <p>Email: {category.userAdmin.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}