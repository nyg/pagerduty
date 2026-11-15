import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useIncidentPolling } from '@/hooks/use-incident-polling'

const POLL_INTERVAL = 30

const incidents = vi.hoisted(() => ({
   setIncidents: vi.fn(),
   setLoading: vi.fn(),
   setError: vi.fn(),
   page: 0,
   pageSize: 25,
}))

vi.mock('@/contexts/incident-context', () => ({ useIncidents: () => incidents }))

vi.mock('@/contexts/config-context', () => ({
   useConfig: () => ({
      config: { pollInterval: 30, teamId: 'T1', apiToken: 'token' },
      isConfigured: true,
      isWebhookMode: false,
   }),
}))

const fetchMock = vi.fn(async (_url: string) => ({
   ok: true,
   json: async () => ({ data: [], total: 0, offset: 0 }),
}))

async function advance(seconds: number) {
   await act(async () => {
      await vi.advanceTimersByTimeAsync(seconds * 1000)
   })
}

describe('useIncidentPolling', () => {
   beforeEach(() => {
      vi.useFakeTimers()
      vi.stubGlobal('fetch', fetchMock)
      fetchMock.mockClear()
      incidents.page = 0
   })

   afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
   })

   it('fetches once on mount', async () => {
      // Given
      const { result } = renderHook(() => useIncidentPolling())

      // When
      await advance(0)

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(result.current.secondsUntilRefresh).toBe(POLL_INTERVAL)
   })

   it('counts down and fetches again after the poll interval', async () => {
      // Given
      const { result } = renderHook(() => useIncidentPolling())

      // When
      await advance(10)

      // Then
      expect(result.current.secondsUntilRefresh).toBe(POLL_INTERVAL - 10)

      // When
      await advance(POLL_INTERVAL - 10)

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(result.current.secondsUntilRefresh).toBeGreaterThan(POLL_INTERVAL - 10)
   })

   it('fetches once on page change and keeps the countdown running', async () => {
      // Given
      const { result, rerender } = renderHook(() => useIncidentPolling())
      await advance(10)

      // When
      incidents.page = 1
      rerender()
      await advance(0)

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.lastCall?.[0]).toContain('offset=25')
      expect(result.current.secondsUntilRefresh).toBe(POLL_INTERVAL - 10)
   })
})
