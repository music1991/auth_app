import { API_BASE_URL } from '@/lib/constants';
import { NextResponse } from 'next/server';



// Asegúrate de incluir el path completo /api/resources
const NODE_BACKEND_URL = `${API_BASE_URL}/resources`;

export async function GET() {
  try {
    const response = await fetch(NODE_BACKEND_URL, { 
      cache: 'no-store',
      // Agregamos un timeout pequeño por si Node no responde
      signal: AbortSignal.timeout(5000) 
    });

    if (!response.ok) {
       throw new Error(`Backend respondió con status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ Proxy Falló:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Error conectando al backend de Node. ¿Está encendido el puerto 4000?" 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Asegúrate de que NODE_BACKEND_URL esté definida arriba o en el .env
  const API_URL = process.env.NODE_BACKEND_URL || "URL_NO_DEFINIDA";

  try {
    const formData = await request.formData();
    const type = formData.get('type');
    const url = formData.get('url');

    if (type === 'link' && !url) {
      return NextResponse.json({ success: false, message: "Falta la URL" }, { status: 400 });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    // --- AQUÍ CAPTURAMOS EL 404 ---
    if (response.status === 404) {
      return NextResponse.json({
        success: false,
        message: `El backend devolvió 404. La URL intentada fue: ${API_URL}`,
        status: 404
      }, { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    // Esto solo corre si el servidor de Node está APAGADO o la URL está mal formada
    return NextResponse.json({ 
      success: false, 
      message: "Error de conexión o URL mal formada",
      error_url: API_URL 
    }, { status: 500 });
  }
}
