import type L from 'leaflet'

type MarkerClusterGroupLike = {
  zoomToShowLayer(layer: L.Layer, callback: () => void): void
}

type MaybeClusterNode = {
  __parent?: MaybeClusterNode | null
  _group?: MarkerClusterGroupLike
}

/** Walk leaflet.markercluster’s parent pointers until we reach the MarkerClusterGroup. */
function getMarkerClusterGroupForMarker(marker: L.Marker): MarkerClusterGroupLike | undefined {
  let p: unknown = (marker as { __parent?: MaybeClusterNode }).__parent
  for (let i = 0; i < 12 && p && typeof p === 'object'; i++) {
    const node = p as MaybeClusterNode
    const grp = node._group
    if (grp && typeof grp.zoomToShowLayer === 'function') return grp
    p = node.__parent
  }
  return undefined
}

/**
 * `marker.openPopup()` is not enough when the pin is still inside a density cluster: the popup
 * may not open until the cluster zooms or spiderfies. Use the group’s `zoomToShowLayer` API first.
 *
 * @see https://github.com/Leaflet/Leaflet.markercluster/blob/master/src/MarkerClusterGroup.js zoomToShowLayer
 */
export function openExploreMarkerPopup(marker: L.Marker | null | undefined): void {
  if (!marker) return
  const group = getMarkerClusterGroupForMarker(marker)
  if (group) {
    group.zoomToShowLayer(marker as L.Layer, () => marker.openPopup())
    return
  }
  marker.openPopup()
}

export function openExploreMarkerPopupForId(registry: Map<string, L.Marker>, id: string): void {
  openExploreMarkerPopup(registry.get(id))
}
