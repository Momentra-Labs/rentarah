import 'leaflet'

declare module 'leaflet' {
  interface MarkerOptions {
    /** Used by explore map clusters to summarize car vs two-wheeler mix. */
    exploreVehicleBucket?: 'car' | 'two_wheeler'
    /** Lowest daily rate among cluster children (single listing = that listing’s price). */
    explorePricePerDay?: number
    /** Resolved pickup hub key + short area line for cluster badge copy. */
    explorePickupHubKey?: string
    explorePickupAreaLabel?: string
  }
}
