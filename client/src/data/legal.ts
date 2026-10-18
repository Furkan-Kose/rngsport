/**
 * Yasal metinlerin İngilizce ve Rusça çevirileri (bilgi amaçlı).
 *
 * Türkçe sayfalar (pages/legal/*.tsx) asıl ve bağlayıcı metindir; burada onların
 * birebir karşılıkları durur. Türkçe metin değişirse buradaki çeviriler de
 * güncellenmeli. Metin içinde **kalın** ve [bağlantı](/yol) desteklenir.
 */

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; title?: string; items: string[]; tone?: "default" | "danger" }
  | { type: "note"; text: string; tone?: "info" | "warning" | "success" | "danger" }
  | { type: "numbered"; items: { n: string; text: string }[] }
  | { type: "fields"; title?: string; rows: { label: string; value: string; href?: string }[]; footnote?: string };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  seoTitle: string;
  seoDescription: string;
  title: string;
  subtitle?: string;
  intro?: string;
  sections: LegalSection[];
  footer?: string[];
}

export type LegalKey = "privacy" | "kvkk" | "distanceSales" | "refund";

const PHONE = { value: "+90 539 844 45 21", href: "tel:+905398444521" };
const EMAIL = { value: "hakankose5534@gmail.com", href: "mailto:hakankose5534@gmail.com" };
const ADDRESS = "Başıbüyük Mah. Aydınlılar Sk. No: 39 Maltepe/İstanbul";
const COMPANY = "Hakan Köse - Range Media";

export const LEGAL_UI = {
  en: {
    backHome: "Back to Home",
    notice:
      "This is an English translation provided for information only. The Turkish version is the legally binding text.",
    viewTurkish: "View the Turkish original",
  },
  ru: {
    backHome: "На главную",
    notice:
      "Это перевод на русский язык, предоставленный исключительно для информации. Юридическую силу имеет текст на турецком языке.",
    viewTurkish: "Открыть оригинал на турецком",
  },
} as const;

export const LEGAL_DOCS: Record<"en" | "ru", Record<LegalKey, LegalDoc>> = {
  en: {
    privacy: {
      seoTitle: "Privacy Policy",
      seoDescription:
        "RNG Sport privacy policy. How your personal data is collected, used and protected.",
      title: "Privacy and Security Policy",
      intro:
        "As **Range Media - Hakan Köse**, we attach great importance to the security of the personal data and especially the payment information of customers who use and shop on www.rngsport.com.",
      sections: [
        {
          title: "1. Credit Card Security and iyzico Infrastructure",
          blocks: [
            { type: "p", text: "The security of your credit card information is kept at the highest level for purchases made on our site." },
            {
              type: "list",
              items: [
                "**Card details are not stored:** Sensitive payment information such as your card number, expiry date and CVC code is never stored on our servers, in our database or in browser cookies.",
                "**iyzico assurance:** Payments are processed through the infrastructure of iyzico (iyzico Ödeme Hizmetleri A.Ş.), one of Türkiye's leading payment institutions. Your card details are transmitted directly and encrypted to the banking system, independently of our site. We only see whether the payment succeeded and cannot access your card details.",
                "**3D Secure:** The 3D Secure system is used for your transactions, so a payment is not completed without entering the SMS code sent to your mobile phone. This prevents unauthorised use of your card.",
                "**SSL certificate:** All data flow on our site is protected with 256-bit SSL (Secure Sockets Layer) encryption. The padlock icon in your browser's address bar on the payment page shows that your connection is encrypted and secure.",
              ],
            },
          ],
        },
        {
          title: "2. Privacy of Personal Data",
          blocks: [
            { type: "p", text: "We request some personal information (name, surname, email, phone, etc.) in order to deliver your orders and provide our service." },
            {
              type: "list",
              items: [
                "This information is used only to process your order, send you your photo/video links and contact you when necessary.",
                "Except for legal obligations (requests from official authorities) and payment security (limited data sharing with iyzico), your personal information is **never shared with, sold to or used for commercial purposes by third parties or other companies.**",
              ],
            },
          ],
        },
        {
          title: "3. Email Security",
          blocks: [
            {
              type: "note",
              tone: "warning",
              text: "In email correspondence with our customer service or about your order, **never write your credit card number or passwords.** Information in emails may be seen by third parties. We cannot guarantee the security of information sent by email; therefore enter sensitive financial information only on the secure payment page of our site.",
            },
          ],
        },
        {
          title: "4. Use of Cookies",
          blocks: [
            { type: "p", text: "Our site uses cookies to improve the user experience and ensure the site works efficiently. These cookies are used not to collect your personal data but to maintain session continuity (for example, remembering the items in your cart). You can block cookies at any time in your browser settings." },
          ],
        },
        {
          title: "5. Contact",
          blocks: [
            { type: "p", text: "You can contact us with any questions about our privacy and security policy." },
            {
              type: "fields",
              rows: [
                { label: "Company", value: COMPANY },
                { label: "Phone", ...PHONE },
                { label: "Email", ...EMAIL },
                { label: "Address", value: ADDRESS },
              ],
            },
          ],
        },
      ],
      footer: ["This policy has been prepared for the security of our customers.", "Last updated: January 2026"],
    },
    kvkk: {
      seoTitle: "KVKK Privacy Notice",
      seoDescription: "RNG Sport privacy notice and explicit consent text under the Turkish Personal Data Protection Law (KVKK).",
      title: "Under the Turkish Personal Data Protection Law (KVKK)",
      subtitle: "Privacy Notice and Explicit Consent",
      sections: [
        {
          title: "1. Data Controller and Processor",
          blocks: [
            { type: "p", text: "This text has been prepared in accordance with the Personal Data Protection Law No. 6698 (the \"Law\") to inform you about, and obtain your explicit consent for, the personal data and image recordings that will be processed within the scope of the **International Ritmika Cup** event by the event owner **Ritmika Cimnastik** and the authorised imaging partner **Range Media (Hakan Köse)**." },
          ],
        },
        {
          title: "2. Personal Data Processed and Purposes of Processing",
          blocks: [
            { type: "p", text: "During the event, the following data of participating athletes:" },
            {
              type: "list",
              title: "Data processed:",
              items: [
                "**Identity information:** Name, surname, date of birth, club information",
                "**Visual and audio recordings:** Photos, videos, competition performance footage",
                "**Contact information:** Parent's email, phone",
              ],
            },
            {
              type: "list",
              title: "Purposes of processing:",
              items: [
                "Running and archiving the competition",
                "Professionally recording athletes' performances and offering them for sale to parents/athletes who request them",
                "Use as event news and marketing material on social media accounts (Instagram, YouTube, etc.), websites and promotional films belonging to Ritmika Cimnastik and Range Media",
                "Creating a customer account in your name with the email address you provide during booking/ordering, so that purchased photos and videos can be delivered only to the person concerned, and storing your files in this private gallery",
              ],
            },
          ],
        },
        {
          title: "3. Transfer of Personal Data",
          blocks: [
            { type: "p", text: "The visual and audio recordings obtained may be shared publicly on the social media accounts of Ritmika Cimnastik and Range Media for the promotion of the event, the encouragement of the sport and the performance of the service, and may be shared with business partners and competent authorities in accordance with **Articles 8 and 9** of the Law." },
          ],
        },
        {
          title: "4. Your Rights",
          blocks: [
            { type: "p", text: "Under **Article 11** of the KVKK, you have the following rights:" },
            {
              type: "list",
              items: [
                "To learn whether your data is being processed",
                "To request information if it has been processed",
                "To learn whether it is used in accordance with its purpose",
                "To request the deletion or destruction of the images (subject to legal retention obligations and the technical irreversibility of published content)",
              ],
            },
          ],
        },
        {
          title: "5. Explicit Consent Statement",
          blocks: [
            {
              type: "note",
              tone: "success",
              text: "I have read and understood the privacy notice above. Without being under any pressure, **I GIVE MY EXPLICIT CONSENT** to photo and video recordings of the athlete of whom I am the parent/guardian being made by Range Media within the scope of the **International Ritmika Cup**, and to these images being used, reproduced and published by Ritmika Cimnastik and Range Media on social media, websites and promotional materials for commercial or non-commercial purposes.",
            },
          ],
        },
      ],
      footer: [
        "This text has been prepared under the Personal Data Protection Law No. 6698.",
        "For questions, you can reach us by phone at +90 (539) 844 45 21.",
      ],
    },
    distanceSales: {
      seoTitle: "Distance Sales Agreement",
      seoDescription: "RNG Sport distance sales agreement. Information on online ordering and terms of sale.",
      title: "Distance Sales Agreement",
      subtitle: "Under the Consumer Protection Law No. 6502 and the Distance Contracts Regulation",
      sections: [
        {
          title: "ARTICLE 1 – PARTIES",
          blocks: [
            {
              type: "fields",
              title: "1.1. SELLER (Service Provider)",
              rows: [
                { label: "Title", value: COMPANY },
                { label: "Phone", ...PHONE },
                { label: "Email", ...EMAIL },
                { label: "Address", value: ADDRESS },
              ],
              footnote: "(Hereinafter referred to as the \"SELLER\")",
            },
            {
              type: "list",
              title: "1.2. BUYER (Customer)",
              items: [
                "Within the scope of this agreement, the natural or legal person who places an order, purchases the service and makes the payment through www.rngsport.com. The name, surname and contact details declared by that person during payment are taken as the basis. (Hereinafter referred to as the \"BUYER\")",
              ],
            },
          ],
        },
        {
          title: "ARTICLE 2 – SUBJECT",
          blocks: [
            { type: "p", text: "The subject of this agreement is to determine the rights and obligations of the parties, in accordance with the **Consumer Protection Law No. 6502** and the **Distance Contracts Regulation**, regarding the sale and performance of the service described below, ordered electronically by the BUYER through the SELLER's website." },
          ],
        },
        {
          title: "ARTICLE 3 – SERVICE SUBJECT TO THE AGREEMENT",
          blocks: [
            {
              type: "list",
              items: [
                "**Name of the service:** International Ritmika Cup - Photo and Video Digital Content Package",
                "**Nature of the service:** Personalised photo and video shooting, editing and digital delivery carried out within the scope of a sports event.",
                "**Delivery method:** Digital delivery (via email or download link)",
                "**Total amount:** The amount stated on the payment page and approved by the BUYER.",
                "**Payment method:** Cash / Credit card / Debit card (virtual POS)",
              ],
            },
          ],
        },
        {
          title: "ARTICLE 4 – GENERAL PROVISIONS",
          blocks: [
            {
              type: "numbered",
              items: [
                { n: "4.1.", text: "The BUYER declares that they have read and are informed of the preliminary information on the website regarding the essential characteristics, sale price, payment method and performance of the service, and have given the necessary confirmation electronically." },
                { n: "4.2.", text: "The service will be delivered as a digital link to the email address or GSM number provided by the BUYER. The SELLER cannot be held responsible for problems arising from incorrect contact information provided by the BUYER." },
                { n: "4.3.", text: "The service is deemed performed when the digital content is delivered to the BUYER at the end of the reasonable period (editing process) following the event, as committed by the SELLER." },
              ],
            },
          ],
        },
        {
          title: "ARTICLE 5 – RIGHT OF WITHDRAWAL AND EXCEPTIONS",
          blocks: [
            {
              type: "numbered",
              items: [
                { n: "5.1.", text: "The service subject to this agreement falls within the scope of \"contracts for services performed instantly in electronic form or intangible goods delivered instantly to the consumer\" under **subparagraph (ğ) of Article 15**, titled \"Exceptions to the Right of Withdrawal\", of the Distance Contracts Regulation dated 27.11.2014." },
                { n: "5.2.", text: "Since the purchased photo and video packages are personalised content (relating to the athlete's performance) produced and made accessible digitally, **the BUYER has no right of withdrawal or refund after the service has been performed (after the content link has been sent).**" },
                { n: "5.3.", text: "For cancellation requests made before the event takes place, the cancellation terms set by the SELLER apply. No refund is made after the event has taken place or the shoot has been carried out." },
              ],
            },
          ],
        },
        {
          title: "ARTICLE 6 – PROTECTION OF PERSONAL DATA",
          blocks: [
            { type: "p", text: "The BUYER consents to the personal information and image recordings provided under this agreement being recorded and stored by the SELLER for the purposes of performing the service, issuing an invoice and delivering the order, and being processed under the conditions set out in the [KVKK Privacy Notice](/kvkk-aydinlatma-metni)." },
          ],
        },
        {
          title: "ARTICLE 7 – COMPETENT COURT",
          blocks: [
            { type: "p", text: "In disputes arising from the application of this agreement, Consumer Arbitration Committees up to the value announced by the Ministry of Trade, and the Consumer Courts and Enforcement Offices at the SELLER's place of residence **(Istanbul/Maltepe)** are competent." },
          ],
        },
        {
          title: "ARTICLE 8 – ENTRY INTO FORCE",
          blocks: [
            { type: "p", text: "The BUYER is deemed to have accepted all terms of this agreement when they make the payment for the order placed through the site." },
          ],
        },
      ],
      footer: ["SELLER: HAKAN KÖSE - RANGE MEDIA · BUYER: The consumer placing the order", "DATE: Transaction date"],
    },
    refund: {
      seoTitle: "Cancellation and Refund Policy",
      seoDescription: "RNG Sport refund terms and right of withdrawal information.",
      title: "Cancellation and Refund Policy",
      subtitle: "Under the Consumer Protection Law No. 6502 and the Distance Contracts Regulation",
      sections: [
        {
          title: "1. General Principles",
          blocks: [
            { type: "p", text: "For services purchased through www.rngsport.com, the Customer (BUYER) is deemed to have accepted the provisions of the **Consumer Protection Law No. 6502** and the **Distance Contracts Regulation**, together with the cancellation/refund terms set out below." },
          ],
        },
        {
          title: "2. Exceptions to the Right of Withdrawal (Non-Refundable Cases)",
          blocks: [
            { type: "p", text: "The purchased service covers **\"personalised photo/video shooting and digital delivery within the scope of a sports event\"**. Under **subparagraph (ğ) of Article 15** of the Distance Contracts Regulation, \"services performed instantly in electronic form or intangible goods delivered instantly to the consumer\" are an exception to the right of withdrawal." },
            {
              type: "list",
              tone: "danger",
              title: "Therefore no refund is made in the following cases:",
              items: [
                "After the competition has taken place and the shoot has been carried out",
                "After the photo/video download link has been sent to the BUYER",
                "On subjective grounds such as \"not liking\" or \"not meeting expectations\"",
              ],
            },
            { type: "note", tone: "danger", text: "**The service fee refund (right of withdrawal) cannot be exercised.**" },
          ],
        },
        {
          title: "3. Cases Where Cancellation and Refund Are Accepted",
          blocks: [
            { type: "p", text: "The BUYER is refunded in the following cases:" },
            {
              type: "list",
              items: [
                "**Cancellation before the competition:** If the BUYER applies to us in writing at least **24 hours before** the competition date to cancel the order, the full amount is refunded without deduction.",
                "**Cancellation of the event:** If the event is cancelled by the organiser or official authorities, the fees received are refunded as the shoot cannot take place.",
                "**Technical failures:** If the athlete's footage cannot be recorded or delivered due to a technical problem caused by the SELLER (camera failure, data loss, etc.), the full amount is refunded.",
              ],
            },
          ],
        },
        {
          title: "4. Refund Procedure",
          blocks: [
            { type: "p", text: "In cases eligible for a refund:" },
            {
              type: "list",
              items: [
                "Refunds are made to the credit card/bank account used by the BUYER at the time of purchase.",
                "After the SELLER issues the refund instruction, it may take **3 to 7 business days** for the amount to appear in the BUYER's account, depending on bank processes. The SELLER is not responsible for delays caused by the bank.",
              ],
            },
          ],
        },
        {
          title: "5. Faulty or Missing Content",
          blocks: [
            { type: "note", tone: "warning", text: "If there is a technical error in the delivered digital files (not opening, corrupted file, etc.), upon notification by the BUYER the SELLER **will correct the error and resend the files as soon as possible.**" },
          ],
        },
        {
          title: "Contact",
          blocks: [
            {
              type: "fields",
              rows: [
                { label: "Company", value: COMPANY },
                { label: "Email", ...EMAIL },
                { label: "Address", value: ADDRESS },
              ],
            },
          ],
        },
      ],
      footer: ["You can send your cancellation and refund requests to hakankose5534@gmail.com.", "Last updated: January 2026"],
    },
  },
  ru: {
    privacy: {
      seoTitle: "Политика конфиденциальности",
      seoDescription: "Политика конфиденциальности RNG Sport: как собираются, используются и защищаются ваши персональные данные.",
      title: "Политика конфиденциальности и безопасности",
      intro:
        "Мы, **Range Media - Hakan Köse**, придаём большое значение безопасности персональных данных и особенно платёжной информации клиентов, которые пользуются сайтом www.rngsport.com и совершают на нём покупки.",
      sections: [
        {
          title: "1. Безопасность банковских карт и инфраструктура iyzico",
          blocks: [
            { type: "p", text: "Безопасность данных вашей банковской карты при покупках на нашем сайте обеспечивается на самом высоком уровне." },
            {
              type: "list",
              items: [
                "**Данные карты не хранятся:** номер карты, срок действия, CVC-код и другие конфиденциальные платёжные данные никогда не хранятся на наших серверах, в базе данных или в cookie браузера.",
                "**Гарантия iyzico:** платежи проводятся через инфраструктуру iyzico (iyzico Ödeme Hizmetleri A.Ş.) — одной из ведущих платёжных организаций Турции. Данные карты передаются в банковскую систему напрямую и в зашифрованном виде, независимо от нашего сайта. Мы видим только, прошла ли оплата, и не имеем доступа к данным карты.",
                "**3D Secure:** при оплате используется система 3D Secure — платёж не завершится без ввода SMS-кода, отправленного на ваш телефон. Это защищает карту от несанкционированного использования.",
                "**SSL-сертификат:** весь обмен данными на сайте защищён 256-битным шифрованием SSL (Secure Sockets Layer). Значок замка в адресной строке на странице оплаты означает, что соединение зашифровано и безопасно.",
              ],
            },
          ],
        },
        {
          title: "2. Конфиденциальность персональных данных",
          blocks: [
            { type: "p", text: "Для выполнения заказов и оказания услуг мы запрашиваем некоторые персональные данные (имя, фамилия, эл. почта, телефон и т. п.)." },
            {
              type: "list",
              items: [
                "Эти данные используются только для обработки заказа, отправки вам ссылок на фото/видео и, при необходимости, для связи с вами.",
                "За исключением требований закона (запросы государственных органов) и обеспечения безопасности платежей (ограниченная передача данных iyzico), ваши персональные данные **никогда не передаются третьим лицам или другим компаниям, не продаются и не используются в коммерческих целях.**",
              ],
            },
          ],
        },
        {
          title: "3. Безопасность эл. почты",
          blocks: [
            {
              type: "note",
              tone: "warning",
              text: "В переписке со службой поддержки или по вопросам заказа **никогда не указывайте номер банковской карты или пароли.** Информация в письмах может стать доступна третьим лицам. Мы не можем гарантировать безопасность данных, переданных по эл. почте, поэтому вводите финансовые данные только на защищённой странице оплаты нашего сайта.",
            },
          ],
        },
        {
          title: "4. Использование cookie",
          blocks: [
            { type: "p", text: "Наш сайт использует файлы cookie для улучшения работы и удобства пользователей. Они применяются не для сбора персональных данных, а для поддержания сеанса (например, чтобы запоминать товары в корзине). Вы можете в любой момент заблокировать cookie в настройках браузера." },
          ],
        },
        {
          title: "5. Контакты",
          blocks: [
            { type: "p", text: "По любым вопросам о нашей политике конфиденциальности и безопасности вы можете связаться с нами." },
            {
              type: "fields",
              rows: [
                { label: "Компания", value: COMPANY },
                { label: "Телефон", ...PHONE },
                { label: "Эл. почта", ...EMAIL },
                { label: "Адрес", value: ADDRESS },
              ],
            },
          ],
        },
      ],
      footer: ["Эта политика подготовлена для обеспечения безопасности наших клиентов.", "Последнее обновление: январь 2026"],
    },
    kvkk: {
      seoTitle: "Уведомление KVKK",
      seoDescription: "Уведомление о конфиденциальности и текст явного согласия RNG Sport в соответствии с турецким законом о защите персональных данных (KVKK).",
      title: "В соответствии с Законом Турции о защите персональных данных (KVKK)",
      subtitle: "Уведомление о конфиденциальности и явное согласие",
      sections: [
        {
          title: "1. Оператор и обработчик данных",
          blocks: [
            { type: "p", text: "Настоящий текст подготовлен в соответствии с Законом № 6698 о защите персональных данных («Закон»), чтобы проинформировать вас о персональных данных и видеоизображениях, которые будут обрабатываться в рамках турнира **International Ritmika Cup** его организатором **Ritmika Cimnastik** и уполномоченным партнёром по съёмке **Range Media (Hakan Köse)**, и получить ваше явное согласие." },
          ],
        },
        {
          title: "2. Обрабатываемые персональные данные и цели обработки",
          blocks: [
            { type: "p", text: "Во время турнира обрабатываются следующие данные спортсменок-участниц:" },
            {
              type: "list",
              title: "Обрабатываемые данные:",
              items: [
                "**Идентификационные данные:** имя, фамилия, дата рождения, клуб",
                "**Визуальные и аудиозаписи:** фото, видео, записи выступлений",
                "**Контактные данные:** эл. почта и телефон родителя",
              ],
            },
            {
              type: "list",
              title: "Цели обработки:",
              items: [
                "Проведение и архивирование соревнований",
                "Профессиональная съёмка выступлений спортсменок и предложение материалов к продаже родителям/спортсменкам, которые их запрашивают",
                "Использование в качестве новостей о мероприятии и маркетинговых материалов в соцсетях (Instagram, YouTube и др.), на сайтах и в рекламных роликах Ritmika Cimnastik и Range Media",
                "Создание на ваше имя клиентского аккаунта по эл. почте, указанной при бронировании/заказе, чтобы купленные фото и видео были доступны только соответствующему лицу, и хранение материалов в этой личной галерее",
              ],
            },
          ],
        },
        {
          title: "3. Передача персональных данных",
          blocks: [
            { type: "p", text: "Полученные визуальные и аудиозаписи могут публиковаться в соцсетях Ritmika Cimnastik и Range Media в целях продвижения мероприятия, популяризации спорта и оказания услуги, а также передаваться деловым партнёрам и компетентным органам в соответствии со **статьями 8 и 9** Закона." },
          ],
        },
        {
          title: "4. Ваши права",
          blocks: [
            { type: "p", text: "В соответствии со **статьёй 11** KVKK вы имеете право:" },
            {
              type: "list",
              items: [
                "Узнать, обрабатываются ли ваши данные",
                "Запросить информацию об обработке, если она ведётся",
                "Узнать, используются ли данные в соответствии с целью обработки",
                "Потребовать удаления или уничтожения изображений (с учётом установленных законом сроков хранения и технической невозможности отозвать уже опубликованные материалы)",
              ],
            },
          ],
        },
        {
          title: "5. Заявление о явном согласии",
          blocks: [
            {
              type: "note",
              tone: "success",
              text: "Я прочитал(а) и понял(а) приведённое выше уведомление. Без какого-либо давления **Я ДАЮ ЯВНОЕ СОГЛАСИЕ** на фото- и видеосъёмку спортсменки, родителем/опекуном которой я являюсь, компанией Range Media в рамках **International Ritmika Cup**, а также на использование, воспроизведение и публикацию этих изображений компаниями Ritmika Cimnastik и Range Media в соцсетях, на сайтах и в рекламных материалах в коммерческих и некоммерческих целях.",
            },
          ],
        },
      ],
      footer: [
        "Настоящий текст подготовлен в соответствии с Законом № 6698 о защите персональных данных.",
        "По вопросам звоните нам: +90 (539) 844 45 21.",
      ],
    },
    distanceSales: {
      seoTitle: "Договор дистанционной продажи",
      seoDescription: "Договор дистанционной продажи RNG Sport. Информация об онлайн-заказах и условиях продажи.",
      title: "Договор дистанционной продажи",
      subtitle: "В соответствии с Законом Турции № 6502 о защите прав потребителей и Положением о дистанционных договорах",
      sections: [
        {
          title: "СТАТЬЯ 1 – СТОРОНЫ",
          blocks: [
            {
              type: "fields",
              title: "1.1. ПРОДАВЕЦ (исполнитель услуги)",
              rows: [
                { label: "Наименование", value: COMPANY },
                { label: "Телефон", ...PHONE },
                { label: "Эл. почта", ...EMAIL },
                { label: "Адрес", value: ADDRESS },
              ],
              footnote: "(Далее — «ПРОДАВЕЦ»)",
            },
            {
              type: "list",
              title: "1.2. ПОКУПАТЕЛЬ (клиент)",
              items: [
                "В рамках настоящего договора — физическое или юридическое лицо, которое оформляет заказ, приобретает услугу и производит оплату на сайте www.rngsport.com. За основу принимаются имя, фамилия и контактные данные, указанные этим лицом при оплате. (Далее — «ПОКУПАТЕЛЬ»)",
              ],
            },
          ],
        },
        {
          title: "СТАТЬЯ 2 – ПРЕДМЕТ",
          blocks: [
            { type: "p", text: "Предметом настоящего договора является определение прав и обязанностей сторон в соответствии с **Законом № 6502 о защите прав потребителей** и **Положением о дистанционных договорах** в отношении продажи и оказания описанной ниже услуги, заказанной ПОКУПАТЕЛЕМ в электронной форме на сайте ПРОДАВЦА." },
          ],
        },
        {
          title: "СТАТЬЯ 3 – УСЛУГА ПО ДОГОВОРУ",
          blocks: [
            {
              type: "list",
              items: [
                "**Наименование услуги:** International Ritmika Cup — пакет цифрового фото- и видеоконтента",
                "**Характер услуги:** персональная фото- и видеосъёмка, монтаж и цифровая доставка в рамках спортивного мероприятия.",
                "**Способ доставки:** цифровая доставка (по эл. почте или по ссылке для скачивания)",
                "**Общая сумма:** сумма, указанная на странице оплаты и подтверждённая ПОКУПАТЕЛЕМ.",
                "**Способ оплаты:** наличные / кредитная карта / дебетовая карта (виртуальный POS)",
              ],
            },
          ],
        },
        {
          title: "СТАТЬЯ 4 – ОБЩИЕ ПОЛОЖЕНИЯ",
          blocks: [
            {
              type: "numbered",
              items: [
                { n: "4.1.", text: "ПОКУПАТЕЛЬ заявляет, что ознакомился с размещённой на сайте предварительной информацией об основных характеристиках услуги, цене, способе оплаты и порядке оказания и дал необходимое подтверждение в электронной форме." },
                { n: "4.2.", text: "Услуга будет передана в виде цифровой ссылки на адрес эл. почты или номер GSM, указанные ПОКУПАТЕЛЕМ. ПРОДАВЕЦ не несёт ответственности за проблемы, возникшие из-за неверных контактных данных, предоставленных ПОКУПАТЕЛЕМ." },
                { n: "4.3.", text: "Услуга считается оказанной после передачи цифровых материалов ПОКУПАТЕЛЮ по истечении разумного срока (монтаж/обработка) после окончания мероприятия, установленного ПРОДАВЦОМ." },
              ],
            },
          ],
        },
        {
          title: "СТАТЬЯ 5 – ПРАВО НА ОТКАЗ И ИСКЛЮЧЕНИЯ",
          blocks: [
            {
              type: "numbered",
              items: [
                { n: "5.1.", text: "Услуга по настоящему договору относится к «договорам на услуги, оказываемые мгновенно в электронной форме, или нематериальные товары, мгновенно передаваемые потребителю» согласно **подпункту (ğ) статьи 15** «Исключения из права на отказ» Положения о дистанционных договорах от 27.11.2014." },
                { n: "5.2.", text: "Поскольку приобретённые фото- и видеопакеты являются персональным контентом (относящимся к выступлению спортсменки), созданным и предоставленным в цифровом виде, **после оказания услуги (после отправки ссылки на материалы) ПОКУПАТЕЛЬ не имеет права на отказ и возврат.**" },
                { n: "5.3.", text: "При запросах на отмену до начала мероприятия действуют условия отмены, установленные ПРОДАВЦОМ. После проведения мероприятия или съёмки возврат средств не производится." },
              ],
            },
          ],
        },
        {
          title: "СТАТЬЯ 6 – ЗАЩИТА ПЕРСОНАЛЬНЫХ ДАННЫХ",
          blocks: [
            { type: "p", text: "ПОКУПАТЕЛЬ соглашается на запись и хранение ПРОДАВЦОМ персональных данных и видеоизображений, предоставленных по настоящему договору, в целях оказания услуги, выставления счёта и выполнения заказа, а также на их обработку на условиях, изложенных в [Уведомлении KVKK](/kvkk-aydinlatma-metni)." },
          ],
        },
        {
          title: "СТАТЬЯ 7 – КОМПЕТЕНТНЫЙ СУД",
          blocks: [
            { type: "p", text: "Споры, возникающие при исполнении настоящего договора, рассматривают Комиссии по потребительским спорам в пределах суммы, объявленной Министерством торговли, а также Потребительские суды и исполнительные органы по месту нахождения ПРОДАВЦА **(Стамбул/Малтепе)**." },
          ],
        },
        {
          title: "СТАТЬЯ 8 – ВСТУПЛЕНИЕ В СИЛУ",
          blocks: [
            { type: "p", text: "ПОКУПАТЕЛЬ считается принявшим все условия настоящего договора с момента оплаты заказа, оформленного на сайте." },
          ],
        },
      ],
      footer: ["ПРОДАВЕЦ: HAKAN KÖSE - RANGE MEDIA · ПОКУПАТЕЛЬ: потребитель, оформивший заказ", "ДАТА: дата операции"],
    },
    refund: {
      seoTitle: "Условия отмены и возврата",
      seoDescription: "Условия возврата RNG Sport и информация о праве на отказ.",
      title: "Условия отмены и возврата",
      subtitle: "В соответствии с Законом Турции № 6502 о защите прав потребителей и Положением о дистанционных договорах",
      sections: [
        {
          title: "1. Общие принципы",
          blocks: [
            { type: "p", text: "При покупке услуг на сайте www.rngsport.com Клиент (ПОКУПАТЕЛЬ) считается принявшим положения **Закона № 6502 о защите прав потребителей** и **Положения о дистанционных договорах**, а также изложенные ниже условия отмены и возврата." },
          ],
        },
        {
          title: "2. Исключения из права на отказ (случаи без возврата)",
          blocks: [
            { type: "p", text: "Приобретаемая услуга включает **«персональную фото- и видеосъёмку в рамках спортивного мероприятия и её цифровую доставку»**. Согласно **подпункту (ğ) статьи 15** Положения о дистанционных договорах, «услуги, оказываемые мгновенно в электронной форме, или нематериальные товары, мгновенно передаваемые потребителю» являются исключением из права на отказ." },
            {
              type: "list",
              tone: "danger",
              title: "Поэтому возврат не производится в следующих случаях:",
              items: [
                "После проведения соревнований и съёмки",
                "После отправки ПОКУПАТЕЛЮ ссылки на скачивание фото/видео",
                "По субъективным причинам, таким как «не понравилось» или «не оправдало ожиданий»",
              ],
            },
            { type: "note", tone: "danger", text: "**Возврат стоимости услуги (право на отказ) не применяется.**" },
          ],
        },
        {
          title: "3. Случаи, когда отмена и возврат принимаются",
          blocks: [
            { type: "p", text: "ПОКУПАТЕЛЮ возвращаются средства в следующих случаях:" },
            {
              type: "list",
              items: [
                "**Отмена до соревнований:** если ПОКУПАТЕЛЬ письменно обратится к нам не позднее чем за **24 часа** до даты соревнований с просьбой отменить заказ, сумма возвращается полностью без удержаний.",
                "**Отмена мероприятия:** если мероприятие отменено организатором или государственными органами, полученные средства возвращаются, так как съёмка невозможна.",
                "**Технические сбои:** если по технической причине на стороне ПРОДАВЦА (поломка камеры, потеря данных и т. п.) выступление спортсменки не удалось записать или передать, сумма возвращается полностью.",
              ],
            },
          ],
        },
        {
          title: "4. Порядок возврата",
          blocks: [
            { type: "p", text: "В случаях, дающих право на возврат:" },
            {
              type: "list",
              items: [
                "Возврат производится на банковскую карту/счёт, использованные ПОКУПАТЕЛЕМ при покупке.",
                "После распоряжения ПРОДАВЦА о возврате зачисление средств на счёт ПОКУПАТЕЛЯ может занять **от 3 до 7 рабочих дней** в зависимости от процессов банка. ПРОДАВЕЦ не несёт ответственности за задержки на стороне банка.",
              ],
            },
          ],
        },
        {
          title: "5. Ошибочные или неполные материалы",
          blocks: [
            { type: "note", tone: "warning", text: "Если в переданных цифровых файлах есть техническая ошибка (файл не открывается, повреждён и т. п.), после сообщения ПОКУПАТЕЛЯ ПРОДАВЕЦ **в кратчайший срок исправит ошибку и отправит файлы повторно.**" },
          ],
        },
        {
          title: "Контакты",
          blocks: [
            {
              type: "fields",
              rows: [
                { label: "Компания", value: COMPANY },
                { label: "Эл. почта", ...EMAIL },
                { label: "Адрес", value: ADDRESS },
              ],
            },
          ],
        },
      ],
      footer: ["Запросы на отмену и возврат направляйте на hakankose5534@gmail.com.", "Последнее обновление: январь 2026"],
    },
  },
};
