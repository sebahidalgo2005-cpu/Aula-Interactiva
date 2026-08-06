'use client'
import { useState, useEffect, useMemo } from 'react'
import { DndContext, useSensor, useSensors, PointerSensor, useDroppable, useDraggable, DragOverlay } from '@dnd-kit/core'
import { useMallaStore } from '@/store/useMallaStore'
import { createClient } from '@/utils/supabase/client'
import { Plus, Lock, Key } from 'lucide-react'

function RamoCardUI({ ramo, esFoco, esPrerrequisito, esAbiertoPorFoco, oscurecer, isDragging, isOverlay, onClick, onPointerEnter, onPointerLeave, setNodeRef, attributes, listeners, style }) {
  let visualClasses = "border-slate-300 text-slate-900 bg-white"
  let iconOverlay = null

  if (esFoco) {
    visualClasses = "ring-4 ring-sky-400 shadow-2xl scale-105 bg-white"
  } else if (esPrerrequisito) {
    visualClasses = "ring-4 ring-orange-400 shadow-lg shadow-orange-500/30 scale-105 bg-orange-50 border-orange-400"
    iconOverlay = <Lock size={16} className="absolute top-2 right-2 text-orange-500" strokeWidth={3} />
  } else if (esAbiertoPorFoco) {
    visualClasses = "ring-4 ring-emerald-400 shadow-lg shadow-emerald-500/30 scale-105 bg-emerald-50 border-emerald-400"
    iconOverlay = <Key size={16} className="absolute top-2 right-2 text-emerald-500" strokeWidth={3} />
  } else if (oscurecer) {
    visualClasses = "opacity-30 grayscale blur-[1px] scale-95"
  } else {
    if (ramo.estado === 'aprobado') visualClasses = "opacity-75 border-slate-400 text-slate-800 bg-slate-100"
    if (ramo.estado === 'cursando') visualClasses = "ring-4 ring-yellow-400 font-bold text-black bg-yellow-50"
  }

  if (isDragging && !isOverlay) {
    visualClasses = "opacity-20 border-dashed bg-slate-100 border-slate-400 scale-95"
  }

  let baseZIndex = ramo.es_anual ? 10 : 1;
  if (esFoco) baseZIndex = 30;
  if (esPrerrequisito || esAbiertoPorFoco) baseZIndex = 20;
  if (isOverlay) baseZIndex = 50;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftColor: ramo.color || '#3b82f6',
        borderLeftWidth: '10px',
        width: ramo.es_anual ? 'calc(200% + 1.5rem)' : '100%',
        zIndex: baseZIndex
      }}
      {...attributes}
      {...listeners}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={(e) => {
        if (!isDragging) onClick(e)
      }}
      className={`absolute inset-0 h-full p-4 rounded-xl shadow-md cursor-grab active:cursor-grabbing text-sm flex flex-col justify-center text-left transition-all duration-300 border-y border-r border-l-0 ${visualClasses} ${isOverlay ? 'shadow-2xl opacity-100 ring-4 ring-blue-400 scale-105 rotate-2 cursor-grabbing' : 'hover:shadow-lg'}`}
    >
      {iconOverlay}
      <span className="font-extrabold text-slate-900 text-[15px] leading-tight line-clamp-2 pr-4">{ramo.nombre}</span>
      <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{ramo.estado}</span>
      
      {ramo.es_anual && <span className="absolute top-2 right-8 text-[10px] font-extrabold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">Anual</span>}
      
      {esPrerrequisito && <span className="absolute bottom-2 left-3 text-[10px] font-extrabold text-orange-600 uppercase">Debes aprobarlo antes</span>}
      {esAbiertoPorFoco && <span className="absolute bottom-2 left-3 text-[10px] font-extrabold text-emerald-600 uppercase">Se desbloqueará</span>}
    </div>
  )
}

function RamoCard({ ramo, dragActivo }) {
  const { setRamoSeleccionado, ramoEnFoco, setRamoEnFoco, ramos } = useMallaStore()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: ramo.id })
  
  const ramoFocoObj = ramos.find(r => r.id === ramoEnFoco)
  const esFoco = ramoEnFoco === ramo.id
  const esPrerrequisito = ramoEnFoco && ramoFocoObj?.prerrequisitos?.includes(ramo.id)
  const esAbiertoPorFoco = ramoEnFoco && ramo.prerrequisitos?.includes(ramoEnFoco)
  const oscurecer = ramoEnFoco && !esFoco && !esPrerrequisito && !esAbiertoPorFoco && !isDragging

  return (
    <RamoCardUI
      ramo={ramo}
      esFoco={esFoco}
      esPrerrequisito={esPrerrequisito}
      esAbiertoPorFoco={esAbiertoPorFoco}
      oscurecer={oscurecer}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      onPointerEnter={() => { if (!dragActivo && !isDragging) setRamoEnFoco(ramo.id) }}
      onPointerLeave={() => { if (!dragActivo && !isDragging) setRamoEnFoco(null) }}
      onClick={() => setRamoSeleccionado(ramo)}
    />
  )
}

function CeldaMalla({ sem, fila, ramo, handleNuevoRamo, dragActivo }) {
  const { setNodeRef, isOver } = useDroppable({ id: `celda-${sem}-${fila}` })

  return (
    <div ref={setNodeRef} className={`relative h-24 mb-4 rounded-xl transition-all border-2 ${isOver && !ramo ? 'bg-blue-100/50 border-blue-400 scale-105 z-10 shadow-lg' : 'border-transparent'} ${!ramo ? 'hover:border-slate-300' : ''}`}>
      {ramo ? (
        <RamoCard ramo={ramo} dragActivo={dragActivo} />
      ) : (
        <button onClick={() => handleNuevoRamo(sem, fila)} className="absolute inset-0 w-full h-full rounded-xl border-2 border-slate-300 border-dashed bg-white/40 hover:bg-white hover:border-blue-500 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors shadow-sm">
          <Plus size={32} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

export default function TableroMalla() {
  const { ramos, moverRamo, agregarRamo, numSemestres, numFilas, setRamoEnFoco } = useMallaStore()
  const [activeId, setActiveId] = useState(null)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  
  useEffect(() => setMounted(true), [])

  const mallaMap = useMemo(() => {
    const map = new Map()
    ramos.forEach(r => {
      map.set(`${r.semestre_columna}-${r.fila_posicion}`, r)
      // FIX PROFESIONAL: Si es anual, "ocupar" lógicamente la celda adyacente para validaciones
      if (r.es_anual) {
        map.set(`${r.semestre_columna + 1}-${r.fila_posicion}`, { ...r, esFantasma: true })
      }
    })
    return map
  }, [ramos])

  const semestresArray = Array.from({ length: numSemestres || 6 }, (_, i) => i + 1)
  const filasArray = Array.from({ length: numFilas || 6 }, (_, i) => i + 1)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event) => {
    setRamoEnFoco(null)
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const ramoId = active.id
    const overId = String(over.id)

    if (overId.startsWith('celda-')) {
      const [, semStr, filaStr] = overId.split('-')
      const nuevoSemestre = parseInt(semStr, 10)
      const nuevaFila = parseInt(filaStr, 10)
      
      const ramoMovido = ramos.find(r => r.id === ramoId)
      if (!ramoMovido) return;

      // FIX PROFESIONAL: Bloquear Ramos Anuales que intenten desbordar la malla
      if (ramoMovido.es_anual && nuevoSemestre >= numSemestres) {
        return alert("Un ramo anual necesita abarcar 2 semestres. No puedes colocarlo en la última columna.")
      }

      // Validar que la celda principal y la celda adyacente (si es anual) estén vacías
      const celdaOcupada = mallaMap.has(`${nuevoSemestre}-${nuevaFila}`) && mallaMap.get(`${nuevoSemestre}-${nuevaFila}`).id !== ramoId
      const celdaSiguienteOcupada = ramoMovido.es_anual ? (mallaMap.has(`${nuevoSemestre + 1}-${nuevaFila}`) && mallaMap.get(`${nuevoSemestre + 1}-${nuevaFila}`).id !== ramoId) : false;

      if (!celdaOcupada && !celdaSiguienteOcupada) {
        
        // Guardamos las posiciones previas por si hay que hacer un "Rollback"
        const prevCol = ramoMovido.semestre_columna
        const prevFila = ramoMovido.fila_posicion

        // UI Optimista (Mueve instantáneamente en el cliente)
        moverRamo(ramoId, nuevoSemestre, nuevaFila) 
        
        // Ejecución en la base de datos
        const { error } = await supabase.from('ramos').update({ semestre_columna: nuevoSemestre, fila_posicion: nuevaFila }).eq('id', ramoId)
        
        // FIX PROFESIONAL: Rollback ante fallo de internet o base de datos
        if (error) {
          console.error("Error al sincronizar con BD:", error)
          moverRamo(ramoId, prevCol, prevFila)
          alert("Error de conexión: No se pudo guardar el cambio en la nube. Se ha deshecho el movimiento.")
        }

      } else {
        alert("La posición seleccionada no tiene espacio suficiente.")
      }
    }
  }

  const handleNuevoRamo = async (semestreColumna, filaPosicion) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return 

    const nuevoRamo = {
      usuario_id: user.id,
      nombre: 'Nuevo Ramo',
      color: '#3b82f6',
      estado: 'pendiente',
      semestre_columna: semestreColumna,
      fila_posicion: filaPosicion,
      prerrequisitos: [],
      es_anual: false
    }
    
    const { data, error } = await supabase.from('ramos').insert(nuevoRamo).select().single()
    if (!error && data) agregarRamo(data)
  }

  const activeRamo = activeId ? ramos.find(r => r.id === activeId) : null

  if (!mounted) return null 

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[800px] p-2 custom-scrollbar">
        {semestresArray.map((sem) => (
          <div key={`col-${sem}`} className="min-w-[240px] flex flex-col">
            <div className="text-center font-extrabold text-slate-800 bg-slate-200 border border-slate-300 py-3 rounded-xl mb-4 text-sm tracking-widest shadow-sm">
              SEMESTRE {sem}
            </div>
            
            <div className="flex-1 bg-slate-200/40 rounded-xl p-3 border-2 border-slate-300 border-dashed relative">
              {filasArray.map((fila) => {
                // Evitamos renderizar objetos fantasmas (utilizados lógicamente para validar espacios de Ramos Anuales)
                const ramoReal = mallaMap.has(`${sem}-${fila}`) && !mallaMap.get(`${sem}-${fila}`).esFantasma ? mallaMap.get(`${sem}-${fila}`) : null
                
                return (
                  <CeldaMalla 
                    key={`celda-${sem}-${fila}`} 
                    sem={sem} 
                    fila={fila} 
                    ramo={ramoReal} 
                    handleNuevoRamo={handleNuevoRamo} 
                    dragActivo={activeId !== null} 
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeRamo ? (
          <div className="relative h-24 w-[240px]">
             <RamoCardUI ramo={activeRamo} isOverlay={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}