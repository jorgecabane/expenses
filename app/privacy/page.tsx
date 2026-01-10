import Link from 'next/link'
import { Wallet, ArrowLeft, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#030712]">
      {/* Header */}
      <nav className="border-b border-white/10 bg-[#030712]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Volver al inicio</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Logo y título */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Política de Privacidad</h1>
            <p className="text-white/60 text-sm mt-1">Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80">
          {/* Introducción */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introducción</h2>
            <p className="leading-relaxed">
              En Bolsillos, nos comprometemos a proteger tu privacidad. Esta Política de Privacidad 
              explica cómo recopilamos, usamos, almacenamos y protegemos tu información personal cuando 
              utilizas nuestro servicio.
            </p>
          </section>

          {/* Información que recopilamos */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Información que Recopilamos</h2>
            <p className="leading-relaxed mb-4">
              Recopilamos la siguiente información cuando utilizas Bolsillos:
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1. Información de Cuenta</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Información de autenticación (manejada por Supabase)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2. Información Financiera</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Gastos e ingresos que registras</li>
              <li>Bolsillos (categorías) que creas</li>
              <li>Límites y presupuestos que defines</li>
              <li>Metas de ahorro</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3. Información Técnica</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Dirección IP</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Fechas y horas de acceso</li>
            </ul>
          </section>

          {/* Cómo usamos tu información */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Cómo Usamos tu Información</h2>
            <p className="leading-relaxed mb-4">
              Utilizamos tu información para:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Proporcionar y mejorar nuestros servicios</li>
              <li>Procesar tus transacciones y gestionar tu cuenta</li>
              <li>Enviar notificaciones importantes sobre tu cuenta</li>
              <li>Enviar invitaciones a espacios compartidos (si las solicitas)</li>
              <li>Detectar y prevenir fraudes o actividades no autorizadas</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          {/* Compartir información */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Compartir tu Información</h2>
            <p className="leading-relaxed mb-4">
              <strong className="text-white">No vendemos tu información personal.</strong> Solo compartimos 
              tu información en las siguientes circunstancias:
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1. Con Otros Usuarios</h3>
            <p className="leading-relaxed mb-4">
              Si compartes un espacio financiero con otros usuarios (pareja, familia), ellos podrán ver:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Gastos e ingresos del espacio compartido</li>
              <li>Bolsillos compartidos y sus límites</li>
              <li>Tu nombre (no tu email) en transacciones que creas</li>
            </ul>
            <p className="leading-relaxed mt-4">
              <strong className="text-white">Tus bolsillos personales son privados</strong> y solo tú puedes verlos.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2. Proveedores de Servicios</h3>
            <p className="leading-relaxed">
              Utilizamos servicios de terceros para operar Bolsillos:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li><strong>Supabase</strong>: Para autenticación y base de datos</li>
              <li><strong>Vercel</strong>: Para hosting y despliegue</li>
              <li><strong>Resend</strong>: Para enviar emails de invitación</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Estos proveedores tienen acceso a tu información solo para proporcionar sus servicios 
              y están obligados a mantenerla confidencial.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3. Requerimientos Legales</h3>
            <p className="leading-relaxed">
              Podemos divulgar tu información si es requerido por ley, orden judicial o proceso legal, 
              o para proteger nuestros derechos, propiedad o seguridad.
            </p>
          </section>

          {/* Seguridad */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Seguridad de tus Datos</h2>
            <p className="leading-relaxed mb-4">
              Implementamos medidas de seguridad para proteger tu información:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Cifrado de datos en tránsito (HTTPS)</li>
              <li>Autenticación segura mediante Supabase</li>
              <li>Acceso restringido a información personal</li>
              <li>Monitoreo regular de seguridad</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Sin embargo, ningún método de transmisión por Internet es 100% seguro. Aunque nos esforzamos 
              por proteger tu información, no podemos garantizar seguridad absoluta.
            </p>
          </section>

          {/* Tus derechos */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Tus Derechos</h2>
            <p className="leading-relaxed mb-4">
              Tienes derecho a:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Acceder</strong> a tu información personal</li>
              <li><strong>Corregir</strong> información inexacta o incompleta</li>
              <li><strong>Solicitar la eliminación</strong> de tu información personal</li>
              <li><strong>Exportar</strong> tus datos en formato legible</li>
              <li><strong>Retirar tu consentimiento</strong> en cualquier momento</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Para ejercer estos derechos, puedes contactarnos a través de la aplicación o eliminar 
              tu cuenta desde la configuración de tu perfil.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Cookies y Tecnologías Similares</h2>
            <p className="leading-relaxed">
              Utilizamos cookies y tecnologías similares para mantener tu sesión activa y mejorar tu 
              experiencia. Puedes configurar tu navegador para rechazar cookies, pero esto puede 
              afectar la funcionalidad del servicio.
            </p>
          </section>

          {/* Retención de datos */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Retención de Datos</h2>
            <p className="leading-relaxed">
              Conservamos tu información mientras tu cuenta esté activa o según sea necesario para 
              proporcionar nuestros servicios. Si eliminas tu cuenta, eliminaremos tu información 
              personal, excepto cuando la ley requiera que la conservemos.
            </p>
          </section>

          {/* Cambios a esta política */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Cambios a esta Política</h2>
            <p className="leading-relaxed">
              Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre 
              cambios significativos mediante un aviso en la aplicación o por correo electrónico. 
              La fecha de "Última actualización" al inicio de esta página indica cuándo se realizó 
              la última modificación.
            </p>
          </section>

          {/* Menores de edad */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Menores de Edad</h2>
            <p className="leading-relaxed">
              Bolsillos no está dirigido a menores de 18 años. No recopilamos intencionalmente información 
              personal de menores. Si descubrimos que hemos recopilado información de un menor, 
              tomaremos medidas para eliminarla.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Contacto</h2>
            <p className="leading-relaxed">
              Si tienes preguntas, preocupaciones o solicitudes relacionadas con esta Política de 
              Privacidad o el manejo de tu información personal, puedes contactarnos a través de 
              la aplicación.
            </p>
          </section>
        </div>

        {/* Footer de la página */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            href="/terms" 
            className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
          >
            Ver Términos y Condiciones
          </Link>
          <Link 
            href="/" 
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
