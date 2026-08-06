'use client'
import React, { useState, useEffect } from 'react'
import { DndContext, useDraggable, useDroppable, closestCenter, DragOverlay } from '@dnd-kit/core'
import { useMallaStore } from '@/store/useMallaStore'

// COMPONENTE: Casilla donde se sueltan los ramos (Ahora SIEMPRE visible)
function CeldaDroppable({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div 
      ref={setNodeRef} 
      className={`w-full rounded-xl transition-all border-2 flex items-center justify-center ${
        isOver 
          ? 'bg-blue-50/50 dark:bg-slate-800/80 border-blue-400 border-dashed scale-105 z-10' 
          : 'border-slate-200/60 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/10'
      }`}
      style={{ minHeight: '90px', height: '90px' }}
    >
      {children}
    </div>
  )
}

// COMPONENTE: Tarjeta del Ramo Arrastrable
function RamoCardDraggable({ ramo }) {
  const { setRamoEnFoco, ramos } = useMallaStore()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ramo.id, data: ramo })

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  const color = ramo.color || 'var(--primary-color)'

  const preRequisitosFaltantes = (ramo.prerrequisitos || []).filter(preId => {
    const rPre = ramos.find(r => r.id === preId)
    return rPre && rPre.estado !== 'aprobado'
  })
  const bloqueado = preRequisitosFaltantes.length > 0

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      onDoubleClick={() => setRamoEnFoco(ramo)}
      className={`relative w-full h-full rounded-xl p-3 cursor-grab flex flex-col justify-between shadow-sm border-2 border-transparent transition-opacity ${
        isDragging ? 'opacity-0' : 'opacity-100 hover:shadow-md hover:scale-[1.02]'
      } ${ramo.estado === 'aprobado' ? 'bg-emerald-50 dark:bg-emerald-950/30' : ramo.estado === 'cursando' ? 'bg-blue-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-800'}`}
    >
      <div className="absolute top-0 left-0 bottom-0 w-2 rounded-l-xl opacity-80" style={{ backgroundColor: color }}></div>
      <div className="ml-2">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate pr-1">{ramo.sigla}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">{ramo.creditos || 0}</span>
        </div>
        <h3 className={`text-xs font-extrabold leading-tight line-clamp-2 ${bloqueado ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
          {ramo.nombre}
        </h3>
      </div>
      {bloqueado && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm" title="Faltan pre-requisitos">🔒</div>
      )}
    </div>
  )
}

export default function TableroMalla() {
  const { ramos, semestres, filas, actualizarRamo } = useMallaStore()
  const [ramoArrastrado, setRamoArrastrado] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const handleDragStart = (event) => setRamoArrastrado(event.active.data.current)
  
  const handleDragEnd = (event) => {
    const { active, over } = event
    setRamoArrastrado(null)
    if (!over) return

    const [semestreId, filaIndex] = over.id.split('-')
    actualizarRamo(active.id, { semestre_id: semestreId, fila: parseInt(filaIndex) })
  }

  // PARCHE DE SEGURIDAD: Fuerza siempre a tener mínimo 10 filas para que la malla no colapse.
  const filasArray = Array.from({ length: Math.max(10, filas || 10) })

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex gap-4">
        {semestres.map(sem => (
          <div key={sem.id} className="flex flex-col shrink-0" style={{ minWidth: '200px', width: '200px' }}>
            <div className="bg-slate-900 text-white text-center py-2.5 rounded-xl font-extrabold text-sm mb-4 shadow-sm uppercase tracking-widest">
              Semestre {sem.numero}
            </div>
            <div className="flex flex-col gap-3">
              {filasArray.map((_, i) => {
                const dropId = `${sem.id}-${i}`
                // Uso de "==" en lugar de "===" para evitar errores si la base de datos devuelve números como textos
                const ramoAca = ramos.find(r => r.semestre_id == sem.id && r.fila == i)
                
                return (
                  <CeldaDroppable key={dropId} id={dropId}>
                    {ramoAca && <RamoCardDraggable ramo={ramoAca} />}
                  </CeldaDroppable>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {ramoArrastrado ? (
          <div className="rounded-xl p-3 flex flex-col justify-between shadow-2xl bg-white dark:bg-slate-700 opacity-90 scale-105 rotate-2 cursor-grabbing border border-slate-300" style={{ width: '200px', height: '90px' }}>
            <div className="absolute top-0 left-0 bottom-0 w-2 rounded-l-xl" style={{ backgroundColor: ramoArrastrado.color || 'var(--primary-color)' }}></div>
            <div className="ml-2">
              <span className="text-[10px] font-black uppercase text-slate-500">{ramoArrastrado.sigla}</span>
              <h3 className="text-xs font-extrabold leading-tight text-slate-900 dark:text-white mt-1">{ramoArrastrado.nombre}</h3>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}