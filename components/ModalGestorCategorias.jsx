'use client'
import { useState } from 'react'
import { useMallaStore } from '@/store/useMallaStore'
import { X, Trash2, Plus } from 'lucide-react'

export default function ModalGestorCategorias({ onClose }) {
  const { categorias, setCategorias, ramos, actualizarRamo } = useMallaStore()
  const [nuevaCat, setNuevaCat] = useState({ nombre: '', color: '#3b82f6' })

  const handleAgregar = () => {
    if (!nuevaCat.nombre) return
    setCategorias([...categorias, { id: Date.now().toString(), ...nuevaCat }])
    setNuevaCat({ nombre: '', color: '#3b82f6' })
  }

  const handleEliminar = (id) => {
    if (!window.confirm("¿Eliminar categoría? Los ramos que la usan volverán a su color por defecto.")) return
    setCategorias(categorias.filter(c => c.id !== id))
    ramos.forEach(r => {
      if (r.categoria_id === id) {
        actualizarRamo(r.id, { categoria_id: '', color: '#3b82f6' })
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gestor de Categorías</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 transition text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Crea etiquetas (ej: Matemáticas, Electivo) y asígnales un color para clasificar visualmente los ramos en la malla.</p>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={nuevaCat.nombre} 
              onChange={e => setNuevaCat({...nuevaCat, nombre: e.target.value})} 
              placeholder="Nueva categoría..." 
              className="flex-1 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2 font-bold outline-none" 
            />
            <input 
              type="color" 
              value={nuevaCat.color} 
              onChange={e => setNuevaCat({...nuevaCat, color: e.target.value})} 
              className="w-12 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600 bg-transparent" 
              style={{ height: '46px', padding: '2px' }} 
            />
            <button onClick={handleAgregar} className="text-white px-4 rounded-lg font-bold flex items-center justify-center transition shadow-sm hover:brightness-110" style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}>
              <Plus size={20}/>
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '300px' }}>
            {categorias.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{cat.nombre}</span>
                </div>
                <button onClick={() => handleEliminar(cat.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg transition hover:bg-red-50 dark:hover:bg-red-900/30">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            {categorias.length === 0 && (
              <div className="text-center text-slate-400 font-bold py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No hay categorías creadas.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}