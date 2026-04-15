import { computed, watch } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import { status, statusLabels } from '../utils/types'

type StatusColorKey = 'tracking' | 'completed' | 'onHold' | 'dropped' | 'planned'
type StatusColorMap = Record<StatusColorKey, string>

const statusColorKeyByStatus: Record<status, StatusColorKey> = {
  [status.tracking]: 'tracking',
  [status.completed]: 'completed',
  [status.onHold]: 'onHold',
  [status.dropped]: 'dropped',
  [status.planned]: 'planned',
}

const defaultStatusColors: StatusColorMap = {
  tracking: '#cdd6f4',
  completed: '#a6e3a1',
  onHold: '#f9e2af',
  dropped: '#f38ba8',
  planned: '#1e1e2e',
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function normalizeStatusColors(input: unknown): StatusColorMap {
  const fallback = { ...defaultStatusColors }
  if (!input || typeof input !== 'object') {
    return fallback
  }

  const parsed = input as Partial<Record<StatusColorKey, unknown>>
  for (const key of Object.keys(defaultStatusColors) as StatusColorKey[]) {
    const value = parsed[key]
    if (isHexColor(value)) {
      fallback[key] = value
    }
  }
  return fallback
}

export function useStatusColors() {
  const statusColors = useLocalStorage<StatusColorMap>('statusColors', defaultStatusColors)

  watch(
    statusColors,
    (value) => {
      const normalized = normalizeStatusColors(value)
      const root = document.documentElement
      for (const key of Object.keys(normalized) as StatusColorKey[]) {
        root.style.setProperty(`--colour-status-${key}`, normalized[key])
      }
    },
    { immediate: true, deep: true }
  )

  const orderedStatuses: status[] = [
    status.tracking,
    status.completed,
    status.onHold,
    status.dropped,
    status.planned,
  ]

  const statusColorOptions = computed(() =>
    orderedStatuses.map((value) => ({
      label: statusLabels[value],
      key: statusColorKeyByStatus[value],
      value,
    }))
  )

  function colorForStatus(value: status): string {
    const normalized = normalizeStatusColors(statusColors.value)
    return normalized[statusColorKeyByStatus[value]]
  }

  return {
    statusColors,
    statusColorOptions,
    colorForStatus,
  }
}
