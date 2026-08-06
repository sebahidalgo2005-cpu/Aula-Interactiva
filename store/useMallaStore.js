import { create } from 'zustand'

export const useMallaStore = create((set, get) => ({
  ramos: [],
  semestres: [],
  categorias: [],
  horarios: [],
  filas: 10,
  ramoEnFoco: null,

  // Setters iniciales
  setRamos: (ramos) => set({ ramos }),
  setSemestres: (semestres) => set({ semestres }),
  setCategorias: (categorias) => set({ categorias }),
  setHorarios: (horarios) => set({ horarios }),
  setFilas: (filas) => set({ filas }),
  setRamoEnFoco: (ramo) => set({ ramoEnFoco: ramo }),

  // Funciones de Dimensiones de la Malla (Recuperadas)
  agregarSemestre: () => set((state) => ({
    semestres: [...state.semestres, { id: Date.now().toString(), numero: state.semestres.length + 1 }]
  })),
  eliminarSemestre: () => set((state) => {
    if (state.semestres.length <= 1) return state
    return { semestres: state.semestres.slice(0, -1) }
  }),
  agregarFila: () => set((state) => ({ filas: state.filas + 1 })),
  eliminarFila: () => set((state) => ({ filas: Math.max(1, state.filas - 1) })),

  // CRUD de Ramos
  agregarRamo: (ramo) => set((state) => ({ ramos: [...state.ramos, ramo] })),
  actualizarRamo: (id, datos) => set((state) => ({
    ramos: state.ramos.map(r => r.id === id ? { ...r, ...datos } : r)
  })),
  eliminarRamo: (id) => set((state) => ({
    ramos: state.ramos.filter(r => r.id !== id),
    ramoEnFoco: null
  })),

  // Funciones de Horarios
  agregarHorario: (horario) => set((state) => ({ horarios: [...state.horarios, horario] })),
  eliminarHorario: (id) => set((state) => ({
    horarios: state.horarios.filter(h => h.id !== id)
  }))
}))