import { API_BASE_URL } from '@/lib/constants';
import { NextResponse } from 'next/server';



// Asegúrate de incluir el path completo /api/resources
const NODE_BACKEND_URL = `${API_BASE_URL}/api/resources`;

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
  try {
    const formData = await request.formData();

    // --- LÓGICA DE VALIDACIÓN CORREGIDA ---
    const type = formData.get('type');
    const url = formData.get('url');
    const file = formData.get('file');

    // Solo validamos si es tipo 'link' y realmente NO enviaron nada en la URL
    if (type === 'link' && !url) {
      return NextResponse.json(
        { success: false, message: "Falta la URL para el recurso de tipo enlace" }, 
        { status: 400 }
      );
    }

    // Si no hay archivo ni URL, pero sí un título, el backend de Node 
    // lo creará como un recurso de texto/nota.
    
    const response = await fetch(NODE_BACKEND_URL, {
      method: 'POST',
      body: formData, // Next.js maneja el Boundary del FormData automáticamente
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Error de conexión con el servidor de recursos" + API_BASE_URL }, 
      { status: 500 }
    );
  }
}
