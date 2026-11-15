'use client'

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

import { useConfig } from '@/contexts/config-context'
import { useIncidents } from '@/contexts/incident-context'

export function useIncidentPolling() {
   const { config, isConfigured, isWebhookMode } = useConfig()
   const { setIncidents, setLoading, setError, page, pageSize } = useIncidents()
   const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
      config.pollInterval
   )
   const mountedRef = useRef(true)
   const isPolling = isConfigured && !isWebhookMode

   const fetchIncidents = useCallback(async () => {
      if (!isConfigured) {
         return
      }

      setLoading(true)
      try {
         const params = new URLSearchParams({
            teamId: config.teamId,
            apiToken: config.apiToken,
            limit: String(pageSize),
            offset: String(page * pageSize),
            statuses: 'triggered,acknowledged,resolved',
         })

         const res = await fetch(`/api/incidents?${params.toString()}`)
         if (!res.ok) {
            const body = await res.json().catch(() => ({ error: res.statusText }))
            throw new Error(body.error || `HTTP ${res.status}`)
         }

         const data = await res.json()
         if (mountedRef.current) {
            setIncidents(data.data, data.total, data.offset)
         }
      } catch (err) {
         if (mountedRef.current) {
            setError(err instanceof Error ? err.message : 'Failed to fetch incidents')
         }
      }
   }, [isConfigured, config.teamId, config.apiToken, page, pageSize, setIncidents, setLoading, setError])

   const refreshOnSchedule = useEffectEvent(() => {
      fetchIncidents()
      setSecondsUntilRefresh(config.pollInterval)
   })

   // Polling interval
   useEffect(() => {
      mountedRef.current = true
      if (!isPolling) {
         return
      }

      const refreshTimer = setInterval(() => refreshOnSchedule(), config.pollInterval * 1000)
      const countdownTimer = setInterval(() => {
         setSecondsUntilRefresh((prev) => Math.max(0, prev - 1))
      }, 1000)

      return () => {
         mountedRef.current = false
         clearInterval(refreshTimer)
         clearInterval(countdownTimer)
      }
   }, [isPolling, config.pollInterval])

   // Initial fetch, and re-fetch on page change
   useEffect(() => {
      if (!isPolling) {
         return
      }
      fetchIncidents()
   }, [isPolling, fetchIncidents])

   return {
      secondsUntilRefresh,
      pollInterval: config.pollInterval,
      isPolling,
      refresh: fetchIncidents,
   }
}
