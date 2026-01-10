import { Resend } from 'resend'

// Validación lazy: solo validar cuando se use, no en tiempo de importación
// Esto evita errores durante el build de Next.js cuando las variables pueden no estar disponibles
// Durante el build, Next.js analiza todas las rutas, pero las variables pueden no estar disponibles aún
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    
    // Solo validar en runtime, no durante el build
    // Durante el build, process.env puede estar vacío pero está bien
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      // En el servidor, validar solo si estamos en producción o si la key está presente
      if (!apiKey && process.env.VERCEL) {
        // En Vercel, la variable debería estar disponible
        throw new Error(
          'RESEND_API_KEY is not set. ' +
          'Please configure it in Vercel Dashboard → Settings → Environment Variables. ' +
          'Make sure it is set for the correct environment (Production, Preview, or Development).'
        )
      }
    }
    
    // Si no hay key, crear un cliente dummy que fallará en runtime
    // Esto permite que el build pase, pero fallará cuando se use
    resendClient = new Resend(apiKey || 'dummy-key-for-build')
  }
  
  return resendClient
}

// Exportar un proxy que inicializa el cliente solo cuando se usa
export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const client = getResendClient()
    const value = client[prop as keyof Resend]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
