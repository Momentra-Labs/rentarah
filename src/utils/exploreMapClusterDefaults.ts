/**
 * Explore map tuning shared by `/map`, landing `MapPreview`, and anywhere else the explore map mounts.
 * Clustering is off so every listing is an individual pin (clearer on desktop and avoids spiderfy quirks).
 */
export const EXPLORE_MAP_CLUSTER_TUNING = {
  enableClustering: false,
  clusterChunkDelay: 50,
  clusterAnimations: true,
  clusterRadius: 52,
} as const
