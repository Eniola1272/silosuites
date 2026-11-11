// Uses the same Leaflet/OSM approach as CC Stays' src/PropertyMap.jsx.
// Leaflet 1.9.4 is served locally with its BSD license. Only tiles require a network.
export function initPropertyMap() {
  const host = document.querySelector('[data-property-map]');
  if (!host) return;
  const status = document.querySelector('[data-map-status]');
  const lat = Number(host.dataset.lat), lng = Number(host.dataset.lng);
  if (!host.dataset.lat || !host.dataset.lng || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    host.innerHTML = '<p class="map-fallback">Map location coming soon.</p>';
    return;
  }
  async function mount() {
    observer?.disconnect();
    try {
      await import('./assets/vendor/leaflet/leaflet.js');
      const L = window.L;
      host.replaceChildren();
      const map = L.map(host, {scrollWheelZoom: false, zoom: 13, center: [lat, lng], zoomControl: true});
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      let loaded = false;
      tiles.on('tileload', () => { loaded = true; status.textContent = ''; });
      tiles.on('tileerror', () => { if (!loaded) status.textContent = 'Map tiles could not load. Try opening the area map below.'; });
      const icon = L.divIcon({
        className: 'silo-map-icon', iconSize: [88, 88], iconAnchor: [44, 44],
        html: '<span class="silo-map-marker"><span class="silo-map-ring"></span><span class="silo-map-core"><img src="assets/logo.png" alt="" width="64" height="64"></span></span>'
      });
      L.marker([lat, lng], {icon, title: 'Silo Suites — La Verkin area reference', alt: 'La Verkin area reference; not the exact property location', keyboard: true})
        .addTo(map).bindPopup('<strong>Silo Suites · La Verkin</strong><br>Town area reference only.<br>Property coordinates pending confirmation.');
      new ResizeObserver(() => map.invalidateSize({pan: false})).observe(host);
      host.dataset.mapReady = 'true';
    } catch {
      host.innerHTML = '<p class="map-fallback">The map is unavailable. Open the area map below.</p>';
      status.textContent = 'The interactive map could not load.';
    }
  }
  // Request tiles only as the location section approaches the viewport.
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) mount();
  }, {rootMargin: '300px'}) : null;
  if (observer) observer.observe(host); else mount();
}
