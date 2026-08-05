'use client'
import { useState } from 'react'
import { useMallaStore } from '@/store/useMallaStore'
import { X, Plus, Trash2, Tag } from 'lucide-react'

export default function ModalGestorCategorias() {
  const { categorias, agregarCategoria, eliminarCategoria, modalCategoriasAbierto, setModalCategoriasAbierto } = useMallaStore()
  
  const [nuevaCat, setNuevaCat] = useState({ nombre: '', color: '#3b82f6' })

  if (!modalCategoriasAbierto) return null

  const handleCrear = (e) => {
    e.preventDefault()
    if (!nuevaCat.nombre.trim()) return

    const categoriaCompleta = {
      id: Date.now(),
      nombre: nuevaCat.nombre,
      color: nuevaCat.color
    }

    agregarCategoria(categoriaCompleta)
    setNuevaCat({ nombre: '', color: '#3b82f6' })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        <div className="flex justify-between items-center p-5 bg-slate-900 text-white">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Tag size={20} className="text-sky-400" /> Gestor de Categorías
          </h2>
          <button onClick={() => setModalCategoriasAbierto(false)} className="text-slate-400 hover:text-white transition rounded-full p-1.5 hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleCrear} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Crear Nueva Categoría</p>
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Nombre (ej. Matemáticas)" 
                value={nuevaCat.nombre}
                onChange={(e) => setNuevaCat({...nuevaCat, nombre: e.target.value})}
                className="flex-1 border-2 border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 bg-white"
              />
              <input 
                type="color" 
                value={nuevaCat.color}
                onChange={(e) => setNuevaCat({...nuevaCat, color: e.target.value})}
                className="w-12 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1 shadow-md">
                <Plus size={18} /> Agregar
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categorías Existentes</p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {categorias.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center bg-white p-3 rounded-xl border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: cat.color }}></div>
                    <span className="font-extrabold text-slate-900 text-sm">{cat.nombre}</span>
                  </div>
                  <button 
                    onClick={() => eliminarCategoria(cat.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={() => setModalCategoriasAbierto(false)} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm transition">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}