import Iyzipay from "iyzipay";
import iyzipay from "../lib/iyzico.js";
import { normalizeLocale } from "./i18n.js";

// iyzico checkout formunun Promise sarmalayıcıları. Mağaza (shop.controller) kullanır;
// paket ödemesi (payment.controller) kendi callback'li kodunu kullanmaya devam ediyor.

// iyzico formu yalnızca TR/EN destekliyor; Rusça siparişte İngilizce form açılır
export const iyzicoLocale = (locale) =>
  normalizeLocale(locale) === "tr" ? Iyzipay.LOCALE.TR : Iyzipay.LOCALE.EN;

// iyzico'nun beklediği "YYYY-MM-DD HH:mm:ss"
export const iyzicoDate = (date = new Date()) => date.toISOString().replace("T", " ").slice(0, 19);

export const initializeCheckout = (request) =>
  new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(request, (err, result) => (err ? reject(err) : resolve(result)));
  });

export const retrieveCheckout = (token) =>
  new Promise((resolve, reject) => {
    iyzipay.checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, token }, (err, result) =>
      err ? reject(err) : resolve(result)
    );
  });

export { Iyzipay };
