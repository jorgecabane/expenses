import Link from 'next/link'
import { Wallet, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function TermsPage() {
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
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Términos y Condiciones</h1>
            <p className="text-white/60 text-sm mt-1">Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80">
          {/* Introducción */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de los Términos</h2>
            <p className="leading-relaxed">
              Al acceder y utilizar Bolsillos, aceptas cumplir con estos Términos y Condiciones. 
              Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestro servicio.
            </p>
          </section>

          {/* Descripción del servicio */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Descripción del Servicio</h2>
            <p className="leading-relaxed mb-4">
              Bolsillos es una plataforma web que te permite organizar y controlar tus gastos 
              mediante el método de bolsillos. El servicio incluye:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Creación y gestión de bolsillos (categorías de gastos)</li>
              <li>Registro de gastos e ingresos</li>
              <li>Compartir espacios financieros con familia o pareja</li>
              <li>Reportes y visualizaciones de tus finanzas</li>
              <li>Metas de ahorro</li>
            </ul>
          </section>

          {/* Uso del servicio */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Uso del Servicio</h2>
            <p className="leading-relaxed mb-4">
              Al utilizar Bolsillos, te comprometes a:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Proporcionar información precisa y actualizada</li>
              <li>Mantener la seguridad de tu cuenta y contraseña</li>
              <li>No utilizar el servicio para actividades ilegales</li>
              <li>No intentar acceder a cuentas de otros usuarios</li>
              <li>No interferir con el funcionamiento del servicio</li>
            </ul>
          </section>

          {/* Cuenta de usuario */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cuenta de Usuario</h2>
            <p className="leading-relaxed mb-4">
              Para utilizar Bolsillos, debes crear una cuenta. Eres responsable de:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Mantener la confidencialidad de tus credenciales de acceso</li>
              <li>Todas las actividades que ocurran bajo tu cuenta</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
            </ul>
          </section>

          {/* Privacidad */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Privacidad</h2>
            <p className="leading-relaxed">
              Tu privacidad es importante para nosotros. El uso de tus datos personales se rige por 
              nuestra <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 underline">Política de Privacidad</Link>, 
              que forma parte de estos Términos y Condiciones.
            </p>
          </section>

          {/* Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Propiedad Intelectual</h2>
            <p className="leading-relaxed">
              Todo el contenido de Bolsillos, incluyendo diseño, logos, textos y funcionalidades, 
              es propiedad de Bolsillos y está protegido por leyes de propiedad intelectual. 
              No puedes copiar, modificar o distribuir nuestro contenido sin autorización.
            </p>
          </section>

          {/* Limitación de responsabilidad */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitación de Responsabilidad</h2>
            <p className="leading-relaxed mb-4">
              Bolsillos se proporciona &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;. No garantizamos que:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>El servicio esté libre de errores o interrupciones</li>
              <li>Los resultados sean precisos o completos</li>
              <li>El servicio satisfaga todas tus necesidades</li>
            </ul>
            <p className="leading-relaxed mt-4">
              No seremos responsables por daños indirectos, incidentales o consecuentes derivados 
              del uso o la imposibilidad de usar el servicio.
            </p>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Modificaciones del Servicio</h2>
            <p className="leading-relaxed">
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto 
              del servicio en cualquier momento, con o sin previo aviso. También podemos actualizar 
              estos Términos y Condiciones, y te notificaremos sobre cambios significativos.
            </p>
          </section>

          {/* Terminación */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Terminación</h2>
            <p className="leading-relaxed">
              Podemos terminar o suspender tu cuenta y acceso al servicio inmediatamente, sin previo 
              aviso, si violas estos Términos y Condiciones. También puedes cerrar tu cuenta en 
              cualquier momento desde la configuración de tu perfil.
            </p>
          </section>

          {/* Ley aplicable */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Ley Aplicable</h2>
            <p className="leading-relaxed">
              Estos Términos y Condiciones se rigen por las leyes de Chile. Cualquier disputa 
              relacionada con estos términos será resuelta en los tribunales competentes de Chile.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Contacto</h2>
            <p className="leading-relaxed">
              Si tienes preguntas sobre estos Términos y Condiciones, puedes contactarnos a través 
              de la aplicación o visitando nuestra página de contacto.
            </p>
          </section>
        </div>

        {/* Footer de la página */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            href="/privacy" 
            className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
          >
            Ver Política de Privacidad
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
