import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // This is a client-side implementation
          if (typeof document === 'undefined') return undefined
          const cookies = document.cookie.split('; ')
          const cookie = cookies.find(c => c.startsWith(`${name}=`))
          return cookie?.split('=')[1]
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          let cookieString = `${name}=${value}`
          if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
          if (options?.path) cookieString += `; path=${options.path}`
          if (options?.domain) cookieString += `; domain=${options.domain}`
          if (options?.secure) cookieString += '; secure'
          if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`
          document.cookie = cookieString
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          let cookieString = `${name}=; max-age=0`
          if (options?.path) cookieString += `; path=${options.path}`
          if (options?.domain) cookieString += `; domain=${options.domain}`
          document.cookie = cookieString
        },
      },
    }
  )
}



