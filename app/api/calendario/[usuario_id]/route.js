import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Servicio Supabase Service Role para que Google/Apple Calendar lean los datos públicamente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  // Await obligatorio para params en Next.js 15
  const { usuario_id } = await params

  try {
    // 1. Consultar ramos en cursando, horarios y evaluaciones pendientes
    const [ramosRes, horariosRes, evalRes] = await Promise.all([
      supabase.from('ramos').select('*').eq('usuario_id', usuario_id).eq('estado', 'cursando'),
      supabase.from('horarios').select('*').eq('usuario_id', usuario_id),
      supabase.from('evaluaciones').select('*').eq('usuario_id', usuario_id).eq('completada', false)
    ])

    if (ramosRes.error || horariosRes.error) {
      return new NextResponse("Error al consultar datos", { status: 500 })
    }

    const ramos = ramosRes.data || []
    const horarios = horariosRes.data || []
    const evaluaciones = evalRes.data || []

    const DIAS_ICS = { 
      'lunes': 'MO', 'martes': 'TU', 'miercoles': 'WE', 
      'jueves': 'TH', 'viernes': 'FR', 'sabado': 'SA' 
    }

    // Cabecera especificación RFC 5545
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Aula Interactiva ERP//ES\nCALSCALE:GREGORIAN\n"
    ics += "X-WR-CALNAME:Mi Horario Universitario\n"
    ics += "REFRESH-INTERVAL;VALUE=DURATION:PT12H\n"

    // 2. Agregar clases recurrentes
    ramos.forEach(ramo => {
      if (!ramo.fecha_inicio || !ramo.fecha_fin) return
      
      const fFin = ramo.fecha_fin.replace(/-/g, '') + 'T235959Z'
      const fIni = ramo.fecha_inicio.replace(/-/g, '')
      const horariosRamo = horarios.filter(h => h.ramo_id === ramo.id)
      
      horariosRamo.forEach(h => {
        const tIni = h.hora_inicio.replace(':', '') + '00'
        const tFin = h.hora_fin.replace(':', '') + '00'
        const diaIcs = DIAS_ICS[h.dia]
        if (!diaIcs) return
        
        ics += `BEGIN:VEVENT\n`
        ics += `UID:clase-${ramo.id}-${h.dia}-${h.hora_inicio}@aulainteractiva\n`
        ics += `SUMMARY:Clase: ${ramo.nombre}\n`
        ics += `DTSTART;TZID=America/Santiago:${fIni}T${tIni}\n`
        ics += `DTEND;TZID=America/Santiago:${fIni}T${tFin}\n`
        ics += `RRULE:FREQ=WEEKLY;UNTIL=${fFin};BYDAY=${diaIcs}\n`
        if (h.sala) ics += `LOCATION:${h.sala}\n`
        ics += `END:VEVENT\n`
      })
    })

    // 3. Agregar Evaluaciones/Pruebas como eventos de día completo
    evaluaciones.forEach(ev => {
      const ramo = ramos.find(r => r.id === ev.ramo_id)
      const fechaFormat = ev.fecha_entrega.replace(/-/g, '')
      
      ics += `BEGIN:VEVENT\n`
      ics += `UID:eval-${ev.id}@aulainteractiva\n`
      ics += `SUMMARY:📌 [${ev.tipo.toUpperCase()}] ${ev.titulo} (${ramo?.nombre || 'General'})\n`
      ics += `DTSTART;VALUE=DATE:${fechaFormat}\n`
      ics += `DTEND;VALUE=DATE:${fechaFormat}\n`
      ics += `DESCRIPTION:Evaluación o entrega desde Aula Interactiva\n`
      ics += `END:VEVENT\n`
    })

    ics += "END:VCALENDAR"

    // Retorna archivo con saltos de línea CRLF (\r\n) obligatorios
    return new NextResponse(ics.replace(/\n/g, '\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="horario.ics"',
      },
    })
  } catch (error) {
    console.error("Error en API de Calendario:", error)
    return new NextResponse("Error interno del servidor", { status: 500 })
  }
}