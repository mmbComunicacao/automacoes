import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Protege todas as rotas, EXCETO:
     * - api/cron (para permitir os Cron Jobs da Vercel)
     * - arquivos estáticos do Next.js (_next/static, _next/image)
     * - favicon e extensões de imagem comuns
     */
    '/((?!api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}