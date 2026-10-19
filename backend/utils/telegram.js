async function sendTelegramMessage(message) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn("⚠️ Telegram is not configured.");
        return;
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.description || "Telegram message failed."
            );
        }

        console.log("✅ Telegram notification sent successfully.");

        return data;
    } catch (error) {
        console.error(
            "❌ Telegram notification error:",
            error.message
        );
    }
}

module.exports = {
    sendTelegramMessage
};