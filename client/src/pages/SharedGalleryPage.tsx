import { useParams } from "react-router";
import MyGalleryPage from "./MyGalleryPage";

// /paylasim/:token — paylaşılan galeri (girişsiz, salt okunur). Galerim sayfasının
// paylaşım modu; key ile farklı link açılınca durum sıfırlanır.
const SharedGalleryPage = () => {
  const { token = "" } = useParams();
  return <MyGalleryPage key={token} shareToken={token} />;
};

export default SharedGalleryPage;
