import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Función segura para evitar crasheos de SSR en Next.js
const getStorage = () => typeof window !== 'undefined' ? window.localStorage : undefined

export const useMallaStore = create(
  persist(
    (set, get) => ({
      ramos: [],
      horarios: [],
      categorias: [
        { id: 1, nombre: 'Ciencias Básicas', color: '#3b82f6' },
        { id: 2, nombre: 'Ingeniería Aplicada', color: '#ef4444' },
        { id: 3, nombre: 'Formación General', color: '#10b981' },
      ],
      
      temaPlataforma: '#0f172a', // Color dinámico sin restricciones
      
      ramoSeleccionado: null,
      ramoEnFoco: null, 
      modalCategoriasAbierto: false,
      
      numSemestres: 10,
      numFilas: 6,

      setTemaPlataforma: (color) => set({ temaPlataforma: color }),
      setRamos: (ramos) => set({ ramos: ramos || [] }),
      setHorarios: (horarios) => set({ horarios: horarios || [] }),
      setRamoSeleccionado: (ramo) => set({ ramoSeleccionado: ramo }),
      setRamoEnFoco: (id) => set({ ramoEnFoco: id }),
      setCategorias: (categorias) => set({ categorias: categorias || [] }),
      setModalCategoriasAbierto: (isOpen) => set({ modalCategoriasAbierto: isOpen }),

      modificarSemestres: (cantidad) => set((state) => ({
        numSemestres: Math.max(1, state.numSemestres + cantidad)
      })),
      modificarFilas: (cantidad) => set((state) => ({
        numFilas: Math.max(1, state.numFilas + cantidad)
      })),

      agregarRamo: (ramo) => set((state) => ({ ramos: [...state.ramos, ramo] })),
      
      actualizarRamo: (id, data) => set((state) => ({
        ramos: state.ramos.map(r => r.id === id ? { ...r, ...data } : r)
      })),
      
      eliminarRamo: (id) => set((state) => ({
        ramos: state.ramos.filter(r => r.id !== id).map(r => ({
          ...r,
          prerrequisitos: (r.prerrequisitos || []).filter(prereqId => prereqId !== id)
        }))
      })),

      moverRamo: (ramoId, nuevaColumna, nuevaFila) => set((state) => ({
        ramos: state.ramos.map(r => r.id === ramoId ? { 
          ...r, semestre_columna: parseInt(nuevaColumna, 10), fila_posicion: parseInt(nuevaFila, 10) 
        } : r)
      })),

      agregarHorario: (horario) => set((state) => ({ horarios: [...state.horarios, horario] })),
      eliminarHorario: (id) => set((state) => ({ horarios: state.horarios.filter(h => h.id !== id) })),

      agregarCategoria: (categoria) => set((state) => ({ 
        categorias: [...state.categorias, categoria] 
      })),
      eliminarCategoria: (id) => set((state) => ({ 
        categorias: state.categorias.filter(c => c.id !== id) 
      })),
    }),
    {
      name: 'malla-interactiva-storage',
      storage: createJSONStorage(getStorage),
      partialize: (state) => ({ 
        numSemestres: state.numSemestres, 
        numFilas: state.numFilas, 
        categorias: state.categorias,
        temaPlataforma: state.temaPlataforma // Recordar el color del usuario
      }),
    }
  )
)