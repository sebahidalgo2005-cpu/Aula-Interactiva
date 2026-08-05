import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
      
      ramoSeleccionado: null,
      ramoEnFoco: null, 
      modalCategoriasAbierto: false,
      
      numSemestres: 10,
      numFilas: 6,

      // Setters Generales
      setRamos: (ramos) => set({ ramos: ramos || [] }),
      setHorarios: (horarios) => set({ horarios: horarios || [] }),
      setRamoSeleccionado: (ramo) => set({ ramoSeleccionado: ramo }),
      setRamoEnFoco: (id) => set({ ramoEnFoco: id }),
      setCategorias: (categorias) => set({ categorias: categorias || [] }),
      setModalCategoriasAbierto: (isOpen) => set({ modalCategoriasAbierto: isOpen }),

      // Control Persistente de la Cuadrícula
      modificarSemestres: (cantidad) => set((state) => ({
        numSemestres: Math.max(1, state.numSemestres + cantidad)
      })),
      modificarFilas: (cantidad) => set((state) => ({
        numFilas: Math.max(1, state.numFilas + cantidad)
      })),

      // Operaciones CRUD de Ramos
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

      // Operaciones CRUD de Horarios
      agregarHorario: (horario) => set((state) => ({ horarios: [...state.horarios, horario] })),
      eliminarHorario: (id) => set((state) => ({ horarios: state.horarios.filter(h => h.id !== id) })),
    }),
    {
      name: 'malla-interactiva-storage', // Clave en localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        numSemestres: state.numSemestres, 
        numFilas: state.numFilas, 
        categorias: state.categorias 
      }), // Solo persiste la configuración y las categorías
    }
  )
)