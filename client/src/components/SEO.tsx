import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SITE_NAME = "International Ritmika Cup";
const DEFAULT_DESCRIPTION =
  "International Ritmika Cup - Ritmik cimnastik branşında uluslararası standartlarda profesyonel yarışma deneyimi. Profesyonel fotoğraf ve video hizmetleri ile performansınızı ölümsüzleştirin.";
const DEFAULT_IMAGE = "/og-image.jpg";
const SITE_URL = "https://ritmikacup.com";

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = "ritmik cimnastik, ritmika cup, cimnastik yarışması, cimnastik fotoğraf, cimnastik video, spor fotoğrafçılığı, profesyonel çekim, range media",
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
      <meta name="author" content="Range Media" />
      <meta name="language" content="Turkish" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
};

export default SEO;
