interface NwsAlertFeature {
  properties?: {
    headline?: string
    event?: string
  }
}

export default defineCachedEventHandler(
  async () => {
    try {
      const response = await $fetch<{ features?: NwsAlertFeature[] }>(
        "https://api.weather.gov/alerts/active?point=40.14,-97.72",
        {
          headers: {
            Accept: "application/geo+json",
            "User-Agent": "dvfdne.org public safety website",
          },
        },
      )
      return {
        alerts: (response.features || [])
          .map((alert) => alert.properties?.headline || alert.properties?.event)
          .filter((value): value is string => Boolean(value))
          .slice(0, 4),
      }
    } catch {
      return { alerts: [] }
    }
  },
  { maxAge: 300, name: "nws-alerts" },
)
