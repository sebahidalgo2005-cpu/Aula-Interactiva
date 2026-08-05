import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const pdfFile = formData.get('file'); // El archivo subido desde el frontend

    if (!pdfFile) {
      return NextResponse.json({ error: 'No se detectó ningún archivo' }, { status: 400 });
    }

    // AQUI IRÁ LA LÓGICA DE IA (EJEMPLO CON OPENAI GPT-4o o Tesseract OCR)
    /*
      1. Extraer texto del PDF (usando pdf-parse o similar)
      2. Enviar texto a OpenAI Prompt: "Convierte este texto en un JSON de ramos y semestres"
      3. Insertar el JSON devuelto directamente en Supabase
    */

    return NextResponse.json({ 
      mensaje: 'El backend de IA está listo para ser conectado. Se recibió el archivo: ' + pdfFile.name 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}