import type { ReactNode } from "react";
import { Card } from "./kit";
import { containerClass, pageClass, pageTitleClass } from "../../lib/siteUi";

interface AuthShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Kartın altındaki satır ("Hesabınız yok mu? Kayıt olun") */
  footer?: ReactNode;
  /** Çok alanlı formlar (kayıt) için geniş kart; giriş / şifre sayfaları dar kalır */
  wide?: boolean;
  children: ReactNode;
}

/** Giriş / kayıt / şifre sayfalarının ortak iskeleti: ortada dar bir kart */
const AuthShell = ({ title, subtitle, footer, wide = false, children }: AuthShellProps) => (
  <div className={pageClass}>
    <div className={containerClass}>
      <div className={`mx-auto ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <header className="text-center mb-6">
          <h1 className={pageTitleClass}>{title}</h1>
          {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
        </header>
        <Card padding="lg">{children}</Card>
        {footer && <p className="text-center text-zinc-400 mt-6">{footer}</p>}
      </div>
    </div>
  </div>
);

export default AuthShell;
