import { useEffect, useState } from "react";
import { useParams } from "react-router";
import api from "../lib/api";
import MyGalleryPage from "./MyGalleryPage";

// /galerim/onizleme/:userId — admin "müşteri gözüyle gör": müşterinin Galerim sayfası,
// sitenin normal görünümüyle ama salt okunur (bkz. MyGalleryPage previewUserId). Yalnızca admin.
const CustomerGalleryPreviewPage = () => {
  const { userId = "" } = useParams();
  const [name, setName] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    api
      .get(`/api/users/${userId}`)
      .then(({ data }) => alive && setName(data.user?.name || data.user?.email || undefined))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [userId]);

  return <MyGalleryPage key={userId} previewUserId={userId} previewName={name} />;
};

export default CustomerGalleryPreviewPage;
