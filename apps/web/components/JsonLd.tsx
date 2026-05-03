// Renders JSON-LD via a script tag. Server-component-friendly (no hooks).
// Multiple objects render as an @graph; single objects render as-is.

interface Props {
  data: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>;
}

export function JsonLd({ data }: Props) {
  const payload = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : data;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
