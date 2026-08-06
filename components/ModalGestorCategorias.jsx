'use client'
import { useState } from 'react'
import { useMallaStore } from '@/store/useMallaStore'
import { X, Plus, Trash2, Tag } from 'lucide-react'

export default function ModalGestorCategorias() {
  // Ahora extraemos exitosamente agregarCategoria y eliminarCategoria del Store
  const { categorias, agregarCategoria, eliminarCategoria, modalCategoriasAbierto, setModalCategoriasAbierto } = useMallaStore()
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', color: '#3b82f6' })

  if (!modalCategoriasAbierto) return null

  const handleAgregar = () => {
    if (!nuevaCategoria.nombre.trim()) return
    
    const nueva = {
      id: Date.now(),
      nombre: nuevaCategoria.nombre.trim(),
      color: nuevaCategoria.color
    }
    
    agregarCategoria(nueva)
    setNuevaCategoria({ nombre: '', color: '#3b82f6' }) // Resetea los campos
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-5 border-b bg-slate-50">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Tag size={20} className="text-blue-600"/> Gestor de Categorías
          </h2>
          <button onClick={() => setModalCategoriasAbierto(false)} className="text-slate-500 hover:text-red-600 transition p-1 bg-white rounded-full shadow-sm border border-slate-200">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-6">
          {/* Añadir nueva categoría */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Nombre</label>
              <input 
                type="text" 
                value={nuevaCategoria.nombre} 
                onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})}
                placeholder="Ej: Ciencias Básicas"
                className="w-full border-2 border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Color</label>
              <input 
                type="color" 
                value={nuevaCategoria.color} 
                onChange={(e) => setNuevaCategoria({...nuevaCategoria, color: e.target.value})}
                className="h-11.5 w-12 border-2 border-slate-300 rounded-lg cursor-pointer p-0.5 bg-white transition focus:border-blue-500"
              />
            </div>
            <button 
              onClick={handleAgregar}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.75 rounded-lg transition font-bold shadow-md h-11.5 flex items-center justify-center"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Lista de Categorías */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {categorias.map(cat => (
              <div key={cat.id} className="flex justify-between items-center bg-white border-2 border-slate-100 p-3 rounded-xl shadow-sm hover:border-slate-300 transition">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full shadow-sm border border-slate-200" style={{ backgroundColor: cat.color }}></div>
                  <span className="font-extrabold text-slate-800 text-sm">{cat.nombre}</span>
                </div>
                <button 
                  onClick={() => eliminarCategoria(cat.id)}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            {categorias.length === 0 && (
              <div className="text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl py-6">
                <p className="text-sm text-slate-500 font-bold">No hay categorías configuradas.</p>
                <p className="text-xs text-slate-400 mt-1">Crea una para organizar tus ramos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie de página */}
        <div className="p-5 border-t bg-slate-50">
          <button 
            onClick={() => setModalCategoriasAbierto(false)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition shadow-md"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}