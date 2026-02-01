import "./logo-marquee.css"

export default function LogoMarquee() {
  const logos = [
    { src: "/logos/apple.png", alt: "Apple" },
    { src: "/logos/samsung.png", alt: "Samsung" },
    { src: "/logos/huawei.png", alt: "Huawei" },
    { src: "/logos/xiaomi.png", alt: "Xiaomi" },
    { src: "/logos/oppo.png", alt: "Oppo" },
    { src: "/logos/oneplus.png", alt: "OnePlus" },
  ]

  const items = [...logos, ...logos, ...logos, ...logos]

  return (
    <section className="logo-marquee">
      <div className="logo-marquee__track" aria-label="Merken" role="list">
        {items.map((logo, index) => (
          <div
            className="logo-marquee__item"
            role="img"
            aria-label={logo.alt}
            key={`${logo.src}-${index}`}
          >
            <img src={logo.src} alt="" loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  )
}
