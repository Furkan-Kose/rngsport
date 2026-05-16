import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SITE_NAME = "RNG Sport";
const DEFAULT_DESCRIPTION =
  "RNG Sport - Ritmik cimnastik başta olmak üzere spor organizasyonları için profesyonel fotoğraf, video ve dijital içerik üretimi sunan spor medya ajansı. Yarışma ve turnuvalarda performansınızı ölümsüzleştirin.";
const DEFAULT_IMAGE = "/og-image.jpg";
const SITE_URL = "https://rngsport.com";

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = "rng sport, spor fotoğrafçılığı, ritmik cimnastik fotoğraf, ritmik cimnastik video, spor video çekim, yarışma fotoğrafı, turnuva çekimi, spor medya ajansı, profesyonel spor çekim",
  image = DEFAULT_IMAGE,
  url = SITE_URL,
  type = "website",
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="tr_TR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content="RNG Sport" />
      <meta name="language" content="Turkish" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
};

export default SEO;
