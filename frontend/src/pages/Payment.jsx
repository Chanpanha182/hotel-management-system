import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Banknote,
    CheckCircle,
    CreditCard,
    FlaskConical,
    Loader2,
    QrCode,
    ShieldCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../i18n/useLanguage";

// Customers scan this QR (frontend/public/aba-qr.jpg) and pay directly;
// staff then confirm the payment in Admin > Payments.
const KHQR_METHOD = "ABA KHQR";
const KHQR_IMAGE = "/aba-qr.jpg";

// Turn back on when new ABA PayWay keys are available.
const PAYWAY_ENABLED = false;

const Payment = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { t, formatDate } = useLanguage();

    const [payment, setPayment] = useState(null);
    const [booking, setBooking] = useState(null);

    const [paymentMethod, setPaymentMethod] =
        useState(KHQR_METHOD);

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    // =========================================================
    // GET PAYMENT + BOOKING
    // =========================================================

    const fetchPayment = async () => {
        try {
            setLoading(true);
            setError("");

            // Get payment
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/payments/booking/${bookingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || t("payment.loadError")
                );
                return;
            }

            setPayment(data.data);

            // Get booking
            const bookingResponse = await fetch(
                import.meta.env.VITE_API_URL + "/api/bookings/my-bookings",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const bookingData =
                await bookingResponse.json();

            if (bookingResponse.ok) {
                const selectedBooking =
                    bookingData.data.find(
                        (item) =>
                            item.id === Number(bookingId)
                    );

                setBooking(selectedBooking);
            }

        } catch (err) {
            console.error(err);
            setError(t("common.serverError"));
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // CHECK ABA TRANSACTION
    // =========================================================

    const checkABATransaction = async (tranId) => {
        if (!tranId) {
            return;
        }

        try {
            setCheckingPayment(true);
            setError("");

            console.log(
                "Checking ABA transaction:",
                tranId
            );

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/payway/${tranId}/check`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(
                "ABA transaction check result:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to check payment."
                );
            }

            const abaData = data?.data?.aba;

            const paymentStatus =
                abaData?.data?.payment_status;

            const paymentStatusCode =
                abaData?.data?.payment_status_code;

            console.log(
                "Payment status:",
                paymentStatus
            );

            console.log(
                "Payment status code:",
                paymentStatusCode
            );

            // =================================================
            // PAYMENT SUCCESS
            // =================================================

            if (
                paymentStatus === "APPROVED" &&
                Number(paymentStatusCode) === 0
            ) {
                console.log(
                    "ABA PAYMENT SUCCESSFUL"
                );

                alert(
                    t("payment.success")
                );

                // Go back to My Bookings
                navigate("/my-bookings", {
                    replace: true,
                });

                return;
            }

            // =================================================
            // PAYMENT NOT APPROVED
            // =================================================

            setError(
                t("payment.notCompleted", {
                    status: paymentStatus || "Unknown",
                })
            );

            // Refresh payment information
            await fetchPayment();

        } catch (err) {
            console.error(
                "ABA transaction check error:",
                err
            );

            setError(
                err.message ||
                    "Unable to check ABA payment."
            );
        } finally {
            setCheckingPayment(false);
        }
    };

    // =========================================================
    // INITIAL PAGE LOAD
    // =========================================================

    useEffect(() => {
        if (!token || !user) {
            navigate("/login");
            return;
        }

        const params = new URLSearchParams(
            window.location.search
        );

        const tranId = params.get("tranId");

        console.log(
            "Payment page loaded."
        );

        console.log(
            "Booking ID:",
            bookingId
        );

        console.log(
            "Transaction ID:",
            tranId
        );

        // -----------------------------------------------
        // First load booking/payment information
        // -----------------------------------------------

        const loadPaymentPage = async () => {
            await fetchPayment();

            // -------------------------------------------
            // If PayWay returned with tranId
            // automatically check transaction
            // -------------------------------------------

            if (tranId) {
                await checkABATransaction(tranId);
            }
        };

        loadPaymentPage();

    }, [bookingId]);

    // =========================================================
    // SUBMIT ABA PAYWAY FORM
    // =========================================================

    const submitPayWayForm = (payway) => {
        if (
            !payway ||
            !payway.action ||
            !payway.fields
        ) {
            setError(
                "Invalid ABA PayWay response from server."
            );
            return;
        }

        const form =
            document.createElement("form");

        form.method =
            payway.method || "POST";

        form.action = payway.action;

        form.target =
            payway.target || "_self";

        form.style.display = "none";

        Object.entries(payway.fields).forEach(
            ([key, value]) => {
                if (
                    value === undefined ||
                    value === null
                ) {
                    return;
                }

                const input =
                    document.createElement(
                        "input"
                    );

                input.type = "hidden";
                input.name = key;
                input.value = String(value);

                form.appendChild(input);
            }
        );

        document.body.appendChild(form);

        form.submit();
    };

    // =========================================================
    // ABA PAYWAY PAYMENT
    // =========================================================

    const handleABAPayment = async () => {
        try {
            setProcessing(true);
            setError("");

            const response = await fetch(
                import.meta.env.VITE_API_URL + "/api/payway/" +
                    bookingId,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        booking_id:
                            Number(bookingId),
                    }),
                }
            );

            const data =
                await response.json();

            console.log(
                "ABA PayWay response:",
                data
            );

            if (!response.ok) {
                setError(
                    data.message ||
                        "Unable to create ABA PayWay payment."
                );
                return;
            }

            const payway =
                data?.data?.payway;

            if (!payway) {
                setError(
                    "ABA PayWay information was not returned by the server."
                );
                return;
            }

            submitPayWayForm(payway);

        } catch (err) {
            console.error(
                "ABA PayWay error:",
                err
            );

            setError(
                "Unable to connect to ABA PayWay."
            );
        } finally {
            setProcessing(false);
        }
    };

    // =========================================================
    // NORMAL PAYMENT
    // =========================================================

    const handleNormalPayment = async () => {
        try {
            setProcessing(true);
            setError("");

            const response = await fetch(
                import.meta.env.VITE_API_URL + "/api/payments",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        booking_id:
                            Number(bookingId),
                        payment_method:
                            paymentMethod,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                        t("payment.failed")
                );
                return;
            }

            alert(
                paymentMethod === KHQR_METHOD
                    ? t("payment.thanksKhqr")
                    : t("payment.created")
            );

            navigate("/my-bookings");

        } catch (err) {
            console.error(err);

            setError(
                t("common.serverError")
            );

        } finally {
            setProcessing(false);
        }
    };

    // =========================================================
    // MAIN PAYMENT HANDLER
    // =========================================================

    const handlePayment = async () => {
        if (
            paymentMethod ===
            "ABA PayWay QR"
        ) {
            await handleABAPayment();
            return;
        }

        await handleNormalPayment();
    };

    // =========================================================
    // SIMPLE FULL-PAGE STATES
    // =========================================================

    const statePage = (children) => (
        <div className="min-h-screen">
            <Navbar />
            <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
                {children}
            </main>
            <Footer />
        </div>
    );

    if (loading) {
        return statePage(
            <>
                <Loader2 size={36} className="animate-spin text-gold-600" />
                <p className="mt-4 text-gray-500">{t("payment.loading")}</p>
            </>
        );
    }

    if (checkingPayment) {
        return statePage(
            <>
                <Loader2 size={40} className="animate-spin text-gold-600" />
                <h2 className="mt-5 text-2xl font-semibold text-ink">
                    {t("payment.checking")}
                </h2>
                <p className="mt-2 text-gray-500">{t("payment.checkingText")}</p>
            </>
        );
    }

    if (error && !booking) {
        return statePage(
            <>
                <div className="rounded-2xl bg-red-50 p-5 text-red-700 ring-1 ring-red-100">
                    {error}
                </div>
                <Link to="/my-bookings" className="btn-gold mt-6">
                    {t("payment.backToBookings")}
                </Link>
            </>
        );
    }

    if (!booking) {
        return statePage(
            <>
                <p className="text-gray-500">{t("payment.notFound")}</p>
                <Link to="/my-bookings" className="btn-gold mt-6">
                    {t("payment.backToBookings")}
                </Link>
            </>
        );
    }

    const totalAmount =
        Number(
            booking.total_amount
        ).toFixed(2);

    const isPaid = payment?.payment_status === "paid";

    // Values stay in English: they are saved as the payment method
    const methods = [
        {
            value: KHQR_METHOD,
            icon: QrCode,
            title: t("payment.khqr"),
            text: t("payment.khqrText"),
        },
        {
            value: "Cash at Hotel",
            icon: Banknote,
            title: t("payment.cash"),
            text: t("payment.cashText"),
        },
        ...(PAYWAY_ENABLED
            ? [
                  {
                      value: "ABA PayWay QR",
                      icon: QrCode,
                      title: t("payment.payway"),
                      text: t("payment.paywayText"),
                  },
              ]
            : []),
        {
            value: "Demo Payment",
            icon: FlaskConical,
            title: t("payment.demo"),
            text: t("payment.demoText"),
        },
    ];

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Header */}
            <section className="bg-ink text-white">
                <div className="mx-auto max-w-6xl px-6 py-12">
                    <Link
                        to="/my-bookings"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-gold-300"
                    >
                        <ArrowLeft size={16} />
                        {t("payment.backToBookings")}
                    </Link>

                    <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
                        {t("payment.title")}
                    </h1>

                    <p className="mt-3 flex items-center gap-2 text-gray-400">
                        <ShieldCheck size={16} className="text-gold-400" />
                        {t("payment.subtitle")}
                    </p>
                </div>
            </section>

            <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_380px]">

                {/* PAYMENT METHOD */}
                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
                    <h2 className="text-2xl font-semibold text-ink">
                        {t("payment.method")}
                    </h2>

                    {isPaid ? (
                        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-green-50 p-5 text-green-700 ring-1 ring-green-100">
                            <CheckCircle size={24} />
                            <p className="font-semibold">{t("payment.alreadyPaid")}</p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 space-y-3">
                                {methods.map(({ value, icon: Icon, title, text }) => {
                                    const selected = paymentMethod === value;

                                    return (
                                        <label
                                            key={value}
                                            className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition ${
                                                selected
                                                    ? "border-gold-500 bg-gold-50"
                                                    : "border-gray-100 hover:border-gray-200"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment"
                                                value={value}
                                                checked={selected}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="sr-only"
                                            />

                                            <span
                                                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                                                    selected ? "bg-gold-600 text-white" : "bg-gray-100 text-gray-500"
                                                }`}
                                            >
                                                <Icon size={22} />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block font-semibold text-ink">{title}</span>
                                                <span className="block text-sm text-gray-500">{text}</span>
                                            </span>

                                            <span
                                                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                                                    selected ? "border-gold-600 bg-gold-600" : "border-gray-300"
                                                }`}
                                            >
                                                {selected && <span className="h-2 w-2 rounded-full bg-white"></span>}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* KHQR INFORMATION */}
                            {paymentMethod === KHQR_METHOD && (
                                <div className="mt-6 grid gap-6 rounded-3xl bg-cream p-6 md:grid-cols-[220px_1fr] md:items-center">
                                    <img
                                        src={KHQR_IMAGE}
                                        alt={t("payment.qrAlt")}
                                        className="mx-auto w-full max-w-[220px] rounded-2xl bg-white p-2 shadow-sm"
                                    />

                                    <div>
                                        <p className="text-sm text-gray-500">{t("payment.amountToPay")}</p>
                                        <p className="font-display text-4xl font-semibold text-ink">
                                            ${totalAmount}
                                        </p>

                                        <ol className="mt-4 space-y-2 text-sm text-gray-600">
                                            {[
                                                <>{t("payment.step1")}</>,
                                                <>
                                                    {t("payment.step2")} <strong>${totalAmount}</strong>
                                                    {t("payment.step2b")}
                                                </>,
                                                <>
                                                    {t("payment.step3a")} <strong>Booking #{bookingId}</strong>{" "}
                                                    {t("payment.step3b")}
                                                </>,
                                                <>
                                                    {t("payment.step4a")} <strong>{t("payment.iHavePaid")}</strong>{" "}
                                                    {t("payment.step4b")}
                                                </>,
                                            ].map((step, index) => (
                                                <li key={index} className="flex gap-3">
                                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-600 text-xs font-semibold text-white">
                                                        {index + 1}
                                                    </span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ol>

                                        <p className="mt-4 text-xs text-gray-500">
                                            {t("payment.staffConfirm")}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ABA PAYWAY INFORMATION (only when PayWay is turned on) */}
                            {paymentMethod === "ABA PayWay QR" && (
                                <div className="mt-6 rounded-2xl bg-cream p-5 text-sm text-gray-600">
                                    Click the payment button to continue to the ABA PayWay payment page.
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* BOOKING SUMMARY */}
                <aside className="lg:sticky lg:top-28 lg:self-start">
                    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
                        {booking.image && (
                            <img
                                src={booking.image}
                                alt={booking.room_name}
                                className="h-40 w-full object-cover"
                            />
                        )}

                        <div className="p-6">
                            <p className="eyebrow">{t("payment.summary")}</p>

                            <h2 className="mt-2 text-2xl font-semibold text-ink">
                                {booking.room_name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {t("common.roomNumber", { number: booking.room_number })} ·{" "}
                                {t("common.bookingNumber", { id: booking.id })}
                            </p>

                            <dl className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-gray-500">{t("common.checkIn")}</dt>
                                    <dd className="font-semibold text-ink">{formatDate(booking.check_in)}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-gray-500">{t("common.checkOut")}</dt>
                                    <dd className="font-semibold text-ink">{formatDate(booking.check_out)}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-gray-500">{t("common.guests")}</dt>
                                    <dd className="font-semibold text-ink">{booking.guests}</dd>
                                </div>
                            </dl>

                            <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-5">
                                <span className="text-gray-500">{t("common.totalAmount")}</span>
                                <span className="font-display text-3xl font-semibold text-ink">
                                    ${totalAmount}
                                </span>
                            </div>

                            {error && (
                                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
                                    {error}
                                </p>
                            )}

                            {!isPaid && (
                                <button
                                    onClick={handlePayment}
                                    disabled={processing || checkingPayment}
                                    className="btn-gold mt-6 w-full py-4"
                                >
                                    {processing ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : paymentMethod === KHQR_METHOD || paymentMethod === "ABA PayWay QR" ? (
                                        <QrCode size={18} />
                                    ) : (
                                        <CreditCard size={18} />
                                    )}

                                    {processing
                                        ? t("payment.processing")
                                        : `${
                                              paymentMethod === "ABA PayWay QR"
                                                  ? t("payment.payWithPayway")
                                                  : paymentMethod === KHQR_METHOD
                                                  ? t("payment.iHavePaid")
                                                  : t("payment.continue")
                                          } - $${totalAmount}`}
                                </button>
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            <Footer />
        </div>
    );
};

export default Payment;
