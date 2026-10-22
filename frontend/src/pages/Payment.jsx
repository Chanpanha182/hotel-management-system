import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, CreditCard, QrCode } from "lucide-react";

// Customers scan this QR (frontend/public/aba-qr.jpg) and pay directly;
// staff then confirm the payment in Admin > Payments.
const KHQR_METHOD = "ABA KHQR";
const KHQR_IMAGE = "/aba-qr.jpg";

// Turn back on when new ABA PayWay keys are available.
const PAYWAY_ENABLED = false;

const Payment = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [payment, setPayment] = useState(null);
    const [booking, setBooking] = useState(null);

    const [paymentMethod, setPaymentMethod] =
        useState("Cash at Hotel");

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
                    data.message || "Failed to load payment."
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
            setError("Unable to connect to server.");
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
                    "Payment successful! Your booking has been confirmed."
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
                `Payment is not completed yet. Status: ${
                    paymentStatus || "Unknown"
                }`
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
                        "Payment failed."
                );
                return;
            }

            alert(
                paymentMethod === KHQR_METHOD
                    ? "Thank you! We will confirm your payment shortly."
                    : "Payment request created successfully!"
            );

            navigate("/my-bookings");

        } catch (err) {
            console.error(err);

            setError(
                "Unable to connect to server."
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
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">
                    Loading payment...
                </p>
            </div>
        );
    }

    // =========================================================
    // CHECKING PAYMENT
    // =========================================================

    if (checkingPayment) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">

                    <div className="mb-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800">
                        Checking Payment
                    </h2>

                    <p className="text-gray-500 mt-2">
                        Please wait while we confirm your ABA PayWay payment...
                    </p>

                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error && !booking) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">

                    <p className="text-red-500 mb-4">
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                "/my-bookings"
                            )
                        }
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg"
                    >
                        Back to My Bookings
                    </button>

                </div>
            </div>
        );
    }

    // =========================================================
    // BOOKING NOT FOUND
    // =========================================================

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">
                    Booking not found.
                </p>
            </div>
        );
    }

    const totalAmount =
        Number(
            booking.total_amount
        ).toFixed(2);

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">

            <div className="max-w-4xl mx-auto">

                {/* HEADER */}

                <div className="mb-8">

                    <button
                        onClick={() =>
                            navigate(
                                "/my-bookings"
                            )
                        }
                        className="text-blue-600 hover:underline mb-3"
                    >
                        ← Back to My Bookings
                    </button>

                    <h1 className="text-3xl font-bold text-gray-800">
                        Checkout
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Complete your booking payment
                    </p>

                </div>

                <div className="grid md:grid-cols-2 gap-6">

                    {/* BOOKING SUMMARY */}

                    <div className="bg-white rounded-2xl shadow p-6">

                        <h2 className="text-xl font-semibold mb-5">
                            Booking Summary
                        </h2>

                        <div className="space-y-4">

                            <div>
                                <p className="text-sm text-gray-500">
                                    Room
                                </p>

                                <p className="font-semibold">
                                    {booking.room_name}
                                </p>

                                <p className="text-sm text-gray-500">
                                    Room{" "}
                                    {booking.room_number}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Check-in
                                </p>

                                <p className="font-medium">
                                    {booking.check_in}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Check-out
                                </p>

                                <p className="font-medium">
                                    {booking.check_out}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">
                                    Guests
                                </p>

                                <p className="font-medium">
                                    {booking.guests}
                                </p>
                            </div>

                            <div className="border-t pt-4">

                                <p className="text-sm text-gray-500">
                                    Total Amount
                                </p>

                                <p className="text-3xl font-bold text-blue-600">
                                    ${totalAmount}
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* PAYMENT */}

                    <div className="bg-white rounded-2xl shadow p-6">

                        <h2 className="text-xl font-semibold mb-5">
                            Payment Method
                        </h2>

                        {payment?.payment_status ===
                        "paid" ? (

                            <div className="bg-green-50 border border-green-200 rounded-xl p-5">

                                <div className="flex items-center gap-3">

                                    <CheckCircle
                                        className="text-green-600"
                                        size={24}
                                    />

                                    <p className="text-green-700 font-semibold">
                                        This booking has already been paid.
                                    </p>

                                </div>

                            </div>

                        ) : (

                            <>

                                {/* PAYMENT METHODS */}

                                <div className="space-y-3">

                                    {/* CASH */}

                                    <label
                                        className={`block border rounded-xl p-4 cursor-pointer transition ${
                                            paymentMethod ===
                                            "Cash at Hotel"
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >

                                        <input
                                            type="radio"
                                            name="payment"
                                            value="Cash at Hotel"
                                            checked={
                                                paymentMethod ===
                                                "Cash at Hotel"
                                            }
                                            onChange={(e) =>
                                                setPaymentMethod(
                                                    e.target.value
                                                )
                                            }
                                            className="mr-3"
                                        />

                                        <span className="font-medium">
                                            Cash at Hotel
                                        </span>

                                        <p className="text-sm text-gray-500 ml-6 mt-1">
                                            Pay when you arrive at the hotel.
                                        </p>

                                    </label>

                                    {/* ABA KHQR */}

                                    <label
                                        className={`block border rounded-xl p-4 cursor-pointer transition ${
                                            paymentMethod ===
                                            KHQR_METHOD
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >

                                        <input
                                            type="radio"
                                            name="payment"
                                            value={KHQR_METHOD}
                                            checked={
                                                paymentMethod ===
                                                KHQR_METHOD
                                            }
                                            onChange={(e) =>
                                                setPaymentMethod(
                                                    e.target.value
                                                )
                                            }
                                            className="mr-3"
                                        />

                                        <span className="font-medium">
                                            ABA KHQR
                                        </span>

                                        <p className="text-sm text-gray-500 ml-6 mt-1">
                                            Scan the QR code with ABA or any Bakong bank app.
                                        </p>

                                    </label>

                                    {/* ABA PAYWAY */}

                                    {PAYWAY_ENABLED && (
                                    <label
                                        className={`block border rounded-xl p-4 cursor-pointer transition ${
                                            paymentMethod ===
                                            "ABA PayWay QR"
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >

                                        <input
                                            type="radio"
                                            name="payment"
                                            value="ABA PayWay QR"
                                            checked={
                                                paymentMethod ===
                                                "ABA PayWay QR"
                                            }
                                            onChange={(e) =>
                                                setPaymentMethod(
                                                    e.target.value
                                                )
                                            }
                                            className="mr-3"
                                        />

                                        <span className="font-medium">
                                            ABA PayWay QR
                                        </span>

                                        <p className="text-sm text-gray-500 ml-6 mt-1">
                                            Pay securely using ABA PayWay.
                                        </p>

                                    </label>
                                    )}

                                    {/* DEMO */}

                                    <label
                                        className={`block border rounded-xl p-4 cursor-pointer transition ${
                                            paymentMethod ===
                                            "Demo Payment"
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >

                                        <input
                                            type="radio"
                                            name="payment"
                                            value="Demo Payment"
                                            checked={
                                                paymentMethod ===
                                                "Demo Payment"
                                            }
                                            onChange={(e) =>
                                                setPaymentMethod(
                                                    e.target.value
                                                )
                                            }
                                            className="mr-3"
                                        />

                                        <span className="font-medium">
                                            Demo Payment
                                        </span>

                                        <p className="text-sm text-gray-500 ml-6 mt-1">
                                            For testing the payment system only.
                                        </p>

                                    </label>

                                </div>

                                {/* KHQR INFORMATION */}

                                {paymentMethod ===
                                    KHQR_METHOD && (

                                    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center">

                                        <img
                                            src={KHQR_IMAGE}
                                            alt="ABA KHQR code"
                                            className="mx-auto w-full max-w-[260px] rounded-xl bg-white p-2 shadow-sm"
                                        />

                                        <p className="mt-4 text-sm text-gray-600">
                                            Amount to pay
                                        </p>

                                        <p className="text-3xl font-bold text-blue-600">
                                            ${totalAmount}
                                        </p>

                                        <ol className="mt-4 space-y-1 text-left text-sm text-gray-600 list-decimal list-inside">
                                            <li>Open your ABA or Bakong bank app and scan the QR code.</li>
                                            <li>Enter the amount <strong>${totalAmount}</strong>.</li>
                                            <li>Write <strong>Booking #{bookingId}</strong> in the remark.</li>
                                            <li>After paying, click <strong>I Have Paid</strong> below.</li>
                                        </ol>

                                        <p className="mt-4 text-xs text-gray-500">
                                            Our staff will confirm your payment shortly.
                                        </p>

                                    </div>
                                )}

                                {/* ABA INFORMATION */}

                                {paymentMethod ===
                                    "ABA PayWay QR" && (

                                    <div className="mt-5 border border-blue-200 bg-blue-50 rounded-2xl p-5">

                                        <div className="flex items-center gap-2 mb-4">

                                            <QrCode
                                                size={22}
                                                className="text-blue-600"
                                            />

                                            <h3 className="font-semibold text-gray-800">
                                                ABA PayWay
                                            </h3>

                                        </div>

                                        <div className="bg-white rounded-xl p-4">

                                            <p className="text-sm text-gray-600">
                                                Click the payment button below to continue to the ABA PayWay Sandbox payment page.
                                            </p>

                                            <div className="mt-4 bg-blue-50 rounded-lg p-4">

                                                <p className="text-sm font-medium text-gray-700">
                                                    Payment Amount
                                                </p>

                                                <p className="text-2xl font-bold text-blue-600 mt-1">
                                                    ${totalAmount}
                                                </p>

                                            </div>

                                            <p className="text-xs text-gray-500 mt-4">
                                                This project is using the ABA PayWay Sandbox environment for testing.
                                            </p>

                                        </div>

                                    </div>
                                )}

                                {/* ERROR */}

                                {error && (
                                    <p className="text-red-500 text-sm mt-4">
                                        {error}
                                    </p>
                                )}

                                {/* PAYMENT BUTTON */}

                                <button
                                    onClick={handlePayment}
                                    disabled={
                                        processing ||
                                        checkingPayment
                                    }
                                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                >

                                    {paymentMethod ===
                                    "ABA PayWay QR" ||
                                    paymentMethod ===
                                    KHQR_METHOD ? (
                                        <QrCode
                                            size={20}
                                        />
                                    ) : (
                                        <CreditCard
                                            size={20}
                                        />
                                    )}

                                    {processing
                                        ? "Processing..."
                                        : paymentMethod ===
                                          "ABA PayWay QR"
                                        ? `Pay with ABA PayWay - ${totalAmount}`
                                        : paymentMethod ===
                                          KHQR_METHOD
                                        ? `I Have Paid - ${totalAmount}`
                                        : `Continue Payment - $${totalAmount}`}

                                </button>

                            </>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Payment;