import Stripe from 'stripe';

export const config = {
    api: {
        bodyParser: true,
    },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
console.log(process.env.STRIPE_SECRET_KEY)

/*
export default async function handler(req, res) {
    console.log("🟡 create-checkout-session called:", req.method);
    console.log("📦 Получен запрос:", req.body);
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        return res.status(200).send('ok');
    }

    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: "Invalid JSON body" });
        }
    }

    const { line_items } = body;

    if (!Array.isArray(line_items) || line_items.length === 0) {
        return res.status(400).json({ error: "Invalid or missing line_items" });
    }

    try {
        console.log("🔥 Line items на сервере:", line_items);
        console.log("📦 Передаём в Stripe:", JSON.stringify({ line_items }, null, 2));
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            success_url: 'https://react-macaroon-shop.vercel.app/success',
            cancel_url: 'https://react-macaroon-shop.vercel.app/cancel',
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        console.log("✅ Сессия создана:", session.url);
        return res.status(200).json({ url: session.url });
    } catch (e) {
        console.error(e);
        res.status(500).json({error: e.message});
    }
}
*/

export default async function handler(req, res) {
    console.log("🟡 create-checkout-session called:", req.method);
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).send('ok');
    }

    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    let body = req.body;

    // 🧩 Парсим строку в JSON, если нужно
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: "Invalid JSON body" });
        }
    }

    const { line_items } = body;
    if (!Array.isArray(line_items) || line_items.length === 0) {
        return res.status(400).json({ error: "Invalid or missing line_items" });
    }

    // 🔥 Проверка: все объекты должны содержать string price и number quantity
    for (const item of line_items) {
        if (
            !item.price ||
            typeof item.price !== "string" ||
            typeof item.quantity !== "number"
        ) {
            return res.status(400).json({ error: "Invalid format in line_items" });
        }
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: 'https://react-macaroon-shop.vercel.app/success',
            cancel_url: 'https://react-macaroon-shop.vercel.app/cancel',
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ url: session.url });
    } catch (e) {
        console.error("❌ Stripe error:", e);
        return res.status(500).json({ error: e.message });
    }
}
