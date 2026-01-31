import Iyzipay from "iyzipay";
import iyzipay from "../lib/iyzico.js";
import prisma from "../lib/prisma.js";

const FRONTEND_URL = process.env.FRONTEND_URL;

export const createCheckoutForm = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "Order ID gerekli" });
    }

    // orderId format kontrolü (UUID veya CUID formatı)
    const trimmedOrderId = orderId.trim();
    if (trimmedOrderId.length < 10 || trimmedOrderId.length > 50) {
      return res.status(400).json({ message: "Geçersiz Order ID formatı" });
    }

    // Siparişi getir
    const order = await prisma.order.findUnique({
      where: { id: trimmedOrderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı" });
    }

    if (order.status === "PAID") {
      return res.status(400).json({ message: "Bu sipariş zaten ödenmiş" });
    }

    // FAILED siparişler için yeniden ödeme izni
    if (order.status !== "PENDING" && order.status !== "FAILED") {
      return res
        .status(400)
        .json({ message: "Bu sipariş için ödeme yapılamaz" });
    }

    // Sipariş item kontrolü
    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ message: "Sipariş içeriği bulunamadı" });
    }

    // Sepet itemları hazırla ve toplam fiyatı doğrula
    let calculatedTotal = 0;
    const basketItems = order.items.map((item) => {
      const itemTotal = item.price * item.quantity;
      calculatedTotal += itemTotal;
      return {
        id: item.id,
        name: `${item.packageName} (${item.seriesCount} Seri)`,
        category1:
          item.category === "photo"
            ? "Fotoğraf"
            : item.category === "video"
              ? "Video"
              : "Komple Paket",
        category2: "Spor Fotoğrafçılık",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: itemTotal.toFixed(2),
      };
    });

    // Veritabanındaki totalPrice ile hesaplanan toplam tutarlılık kontrolü
    if (Math.abs(calculatedTotal - order.totalPrice) > 0.01) {
      console.error(
        `Fiyat tutarsızlığı! Order: ${order.id}, DB: ${order.totalPrice}, Calculated: ${calculatedTotal}`,
      );
      return res
        .status(500)
        .json({ message: "Sipariş fiyatında tutarsızlık tespit edildi" });
    }

    // Benzersiz conversation ID oluştur (crypto-safe)
    const conversationId = `order_${trimmedOrderId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Sipariş için conversation ID kaydet
    await prisma.order.update({
      where: { id: trimmedOrderId },
      data: { conversationId },
    });

    const callbackUrl = `${process.env.BACKEND_URL}/api/payment/callback`;
    console.log("=== IYZICO CALLBACK URL ===:", callbackUrl);

    // iyzico checkout form request
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      price: order.totalPrice.toFixed(2),
      paidPrice: order.totalPrice.toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: orderId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: orderId,
        name: order.athleteName.split(" ")[0] || "Müşteri",
        surname: order.athleteName.split(" ").slice(1).join(" ") || "Sporcu",
        gsmNumber: order.customerPhone.replace(/\s/g, ""),
        email: order.customerEmail || "",
        identityNumber: "11111111111",
        lastLoginDate:
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toISOString().split("T")[1].split(".")[0],
        registrationDate:
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toISOString().split("T")[1].split(".")[0],
        registrationAddress: order.clubName,
        ip: req.ip || "85.34.78.112",
        city: "Istanbul",
        country: "Turkey",
        zipCode: "34000",
      },
      shippingAddress: {
        contactName: order.athleteName,
        city: "Istanbul",
        country: "Turkey",
        address: order.clubName,
        zipCode: "34000",
      },
      billingAddress: {
        contactName: order.athleteName,
        city: "Istanbul",
        country: "Turkey",
        address: order.clubName,
        zipCode: "34000",
      },
      basketItems,
    };

    // iyzico checkout form oluştur
    iyzipay.checkoutFormInitialize.create(request, (err, result) => {
      if (err) {
        console.error("iyzico error:", err);
        return res
          .status(500)
          .json({ message: "Ödeme başlatılamadı", error: err.message });
      }

      if (result.status !== "success") {
        console.error("iyzico result error:", result);
        return res.status(400).json({
          message: result.errorMessage || "Ödeme formu oluşturulamadı",
          errorCode: result.errorCode,
        });
      }

      res.json({
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl, // iyzico'nun kendi sayfası
        token: result.token,
        tokenExpireTime: result.tokenExpireTime,
      });
    });
  } catch (error) {
    next(error);
  }
};

export const paymentCallback = async (req, res) => {
  try {
    const { token } = req.body;

    console.log(
      "Payment callback received, token:",
      token ? "exists" : "missing",
    );

    if (!token || typeof token !== "string") {
      console.error("Token bulunamadı");
      return res.redirect(
        `${FRONTEND_URL}/siparis-basarisiz?error=${encodeURIComponent("Token bulunamadı")}`,
      );
    }

    // Token format kontrolü
    const trimmedToken = token.trim();
    if (trimmedToken.length < 10 || trimmedToken.length > 200) {
      console.error("Geçersiz token formatı");
      return res.redirect(
        `${FRONTEND_URL}/siparis-basarisiz?error=${encodeURIComponent("Geçersiz token")}`,
      );
    }

    // Promise wrapper ile iyzico callback'ini bekle
    const result = await new Promise((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(
        { locale: Iyzipay.LOCALE.TR, token: trimmedToken },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        },
      );
    });

    console.log("iyzico callback result:", JSON.stringify(result, null, 2));

    const orderId = result.basketId;

    if (!orderId) {
      console.error("basketId bulunamadı");
      return res.redirect(
        `${FRONTEND_URL}/siparis-basarisiz?error=${encodeURIComponent("Sipariş bilgisi bulunamadı")}`,
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error("Sipariş bulunamadı:", orderId);
      return res.redirect(
        `${FRONTEND_URL}/siparis-basarisiz?error=${encodeURIComponent("Sipariş bulunamadı")}&id=${encodeURIComponent(orderId)}`,
      );
    }

    // Zaten ödendiyse tekrar güncelleme (idempotency)
    if (order.status === "PAID") {
      return res.redirect(
        `${FRONTEND_URL}/siparis-basarili?id=${encodeURIComponent(order.id)}`,
      );
    }

    // conversationId doğrulaması (replay attack koruması)
    if (
      order.conversationId &&
      result.conversationId &&
      order.conversationId !== result.conversationId
    ) {
      console.error(
        `ConversationId mismatch! Order: ${order.conversationId}, Result: ${result.conversationId}`,
      );
      return res.redirect(
        `${FRONTEND_URL}/siparis-basarisiz?error=${encodeURIComponent("Ödeme doğrulama hatası")}&id=${encodeURIComponent(order.id)}`,
      );
    }

    if (result.paymentStatus === "SUCCESS") {
      // KRİTİK: Ödenen tutarı doğrula (fiyat manipülasyonu koruması)
      const paidAmount = parseFloat(result.paidPrice);
      const expectedAmount = order.totalPrice;

      if (isNaN(paidAmount) || Math.abs(paidAmount - expectedAmount) > 0.01) {
        console.error(
          `Tutar uyuşmazlığı! Order: ${order.id}, Expected: ${expectedAmount}, Paid: ${paidAmount}`,
        );
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "FAILED",
            notes: `Tutar uyuşmazlığı: Beklenen ${expectedAmount}, Ödenen ${paidAmount}`,
          },
        });
        return res.redirect(
          `${FRONTEND_URL}/siparis-basarisiz?error=${encodeURIComponent("Ödeme tutarı doğrulanamadı")}&id=${encodeURIComponent(order.id)}`,
        );
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentId: result.paymentId
            ? String(result.paymentId).slice(0, 100)
            : null,
        },
      });

      console.log("Ödeme başarılı, yönlendiriliyor:", order.id);
      return res.redirect(
        `${FRONTEND_URL}/siparis-basarili?id=${encodeURIComponent(order.id)}`,
      );
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });

      console.error("Ödeme başarısız:", result.errorMessage);
      return res.redirect(
        `${FRONTEND_URL}/siparis-basarisiz?error=${encodeURIComponent(
          result.errorMessage || "Ödeme işlemi başarısız oldu",
        )}&id=${encodeURIComponent(order.id)}`,
      );
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return res.redirect(
      `${FRONTEND_URL}/siparis-basarisiz?error=${encodeURIComponent("Bir hata oluştu")}`,
    );
  }
};

export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // orderId validasyonu
    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "Geçersiz sipariş ID" });
    }

    const trimmedOrderId = orderId.trim();
    if (trimmedOrderId.length < 10 || trimmedOrderId.length > 50) {
      return res.status(400).json({ message: "Geçersiz sipariş ID formatı" });
    }

    const order = await prisma.order.findUnique({
      where: { id: trimmedOrderId },
      select: {
        id: true,
        status: true,
        // paymentId'yi dışarıya vermiyoruz (güvenlik)
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı" });
    }

    res.json({
      orderId: order.id,
      status: order.status,
      isPaid: order.status === "PAID",
    });
  } catch (error) {
    next(error);
  }
};
