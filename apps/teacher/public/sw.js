// Service Worker for offline functionality
const CACHE_NAME = 'tripslip-teacher-v1'
const OFFLINE_URL = '/offline.html'

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip chrome extensions and other non-http requests
  if (!event.request.url.startsWith('http')) return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache successful responses
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', { status: 503 })
        })
    })
  )
})

// Background sync for offline changes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // Get pending changes from IndexedDB
  // Send to server when online
  console.log('Syncing offline data...')
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'TripSlip'
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})
