import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Usamos la Service Role Key para que el servidor de Google pueda consultar los datos 
// sin necesidad de "iniciar sesión" a nivel de navegador.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  const { usuario_id } = await params // Corrección 1: await params obligatorio

  try {
    // 1. Consultar a la DB todos los ramos y horarios del usuario en cuestión
    const { data: ramos, error: errorRamos } = await supabase
      .from('ramos')
      .select('*')
      .eq('usuario_id', usuario_id)
      .eq('estado', 'cursando')

    const { data: horarios, error: errorHorarios } = await supabase
      .from('horarios')
      .select('*')
      .eq('usuario_id', usuario_id)

    if (errorRamos || errorHorarios || !ramos || !horarios) {
      return new NextResponse("Datos no encontrados", { status: 404 })
    }

    const DIAS_ICS = { 
      'lunes': 'MO', 'martes': 'TU', 'miercoles': 'WE', 
      'jueves': 'TH', 'viernes': 'FR', 'sabado': 'SA' 
    }

    // 2. Construir la cabecera del archivo iCalendar (Webcal)
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Mi ERP Universitario//ES\nCALSCALE:GREGORIAN\n"
    ics += "X-WR-CALNAME:Mi Horario Universitario\n" // Nombre del calendario en Google
    ics += "REFRESH-INTERVAL;VALUE=DURATION:PT12H\n" // Se refresca cada 12 horas

    // 3. Iterar cada ramo en estado "Cursando" para agregar sus eventos recurrentes
    ramos.forEach(ramo => {
      // Ignorar ramos que no tienen tramo de fechas definidos
      if (!ramo.fecha_inicio || !ramo.fecha_fin) return
      
      const fFin = ramo.fecha_fin.replace(/-/g, '') + 'T235959Z'
      const fIni = ramo.fecha_inicio.replace(/-/g, '')
      
      const horariosRamo = horarios.filter(h => h.ramo_id === ramo.id)
      
      horariosRamo.forEach(h => {
        const tIni = h.hora_inicio.replace(':', '') + '00'
        const tFin = h.hora_fin.replace(':', '') + '00'
        const diaIcs = DIAS_ICS[h.dia]
        
        ics += `BEGIN:VEVENT\n`
        ics += `UID:${ramo.id}-${h.dia}-${h.hora_inicio}@erp-universitario\n`
        ics += `SUMMARY:${ramo.nombre}\n`
        ics += `DTSTART;TZID=America/Santiago:${fIni}T${tIni}\n`
        ics += `DTEND;TZID=America/Santiago:${fIni}T${tFin}\n`
        // Establecer repetición semanal hasta la fecha de término de clases del ramo
        ics += `RRULE:FREQ=WEEKLY;UNTIL=${fFin};BYDAY=${diaIcs}\n`
        
        if (h.sala) {
          ics += `LOCATION:${h.sala}\n`
        }
        ics += `END:VEVENT\n`
      })
    })

    ics += "END:VCALENDAR"

    // Corrección 2: Reemplazar \n por \r\n para cumplir especificación mundial RFC 5545
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