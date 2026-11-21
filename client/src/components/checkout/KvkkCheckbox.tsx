import { useTranslation } from "react-i18next";
import LocalizedLink from "../LocalizedLink";
import { Checkbox } from "../ui/kit";

interface KvkkCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/** KVKK aydınlatma metni onayı (rezervasyon, sepet, kayıt) */
const KvkkCheckbox = ({ checked, onChange, className }: KvkkCheckboxProps) => {
  const { t } = useTranslation();
  return (
    <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} className={className} required>
      <LocalizedLink
        to="/kvkk-aydinlatma-metni"
        target="_blank"
        className="text-emerald-400 hover:text-emerald-300 underline"
      >
        {t("checkout.form.kvkkLinkShort")}
      </LocalizedLink>
      {t("checkout.form.kvkkSuffix")}
      <span className="text-red-400 ml-0.5" aria-hidden>
        *
      </span>
    </Checkbox>
  );
};

export default KvkkCheckbox;
