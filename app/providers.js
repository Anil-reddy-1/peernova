'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function PageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const client = usePostHog()

  useEffect(() => {
    if (!pathname || !client) return
    let url = window.origin + pathname
    const search = searchParams.toString()
    if (search) url += '?' + search
    client.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, client])

  return null
}

export function PostHogProvider({ children }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false,
      capture_pageleave: true,
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <PageView />
      {children}
    </PHProvider>
  )
}
