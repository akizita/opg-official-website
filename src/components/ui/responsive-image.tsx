import Image, { type ImageProps } from 'next/image'

type BaseResponsiveImageProps = Omit<ImageProps, 'alt'> & {
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/2' | 'auto'
  className?: string
}

type MeaningfulImageProps = BaseResponsiveImageProps & {
  alt: string
  isDecorative?: false
}

type DecorativeImageProps = BaseResponsiveImageProps & {
  alt?: ''
  isDecorative: true
}

export type ResponsiveImageProps = MeaningfulImageProps | DecorativeImageProps

export function ResponsiveImage({
  aspectRatio = 'auto',
  className = '',
  isDecorative,
  ...props
}: ResponsiveImageProps) {
  const altText: string = isDecorative
    ? ''
    : 'alt' in props && typeof props.alt === 'string'
      ? props.alt
      : ''

  const aspectClass =
    aspectRatio !== 'auto'
      ? `responsive-image--aspect-${aspectRatio.replace('/', '-')}`
      : ''

  return (
    <div
      aria-hidden={isDecorative ? 'true' : undefined}
      className={`responsive-image-wrapper ${aspectClass} ${className}`.trim()}
    >
      <Image {...props} alt={altText} className="responsive-image" />
    </div>
  )
}
