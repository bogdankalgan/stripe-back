import Stripe from 'stripe';

export const config = {
    api: {
        bodyParser: true,
    },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
console.log(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://react-macaroon-shop.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
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
    console.log("📦 Получены line_items:", JSON.stringify(line_items, null, 2));
    if (!Array.isArray(line_items) || line_items.length === 0) {
        return res.status(400).json({ error: "Invalid or missing line_items" });
    }

    for (const item of line_items) {
        const isPriceId = typeof item.price === "string";
        const isPriceData = typeof item.price_data === "object";
        const hasQuantity = typeof item.quantity === "number";

        if (!(hasQuantity && (isPriceId || isPriceData))) {
            return res.status(400).json({ error: "Invalid format in line_items (supports price or price_data)" });
        }
    }

    try {
        const convertedLineItems = line_items.map(item => {
            if (item.price_data) {
                const amountRub = item.price_data.unit_amount || 0;
                const amountUsd = Math.max(1500, Math.round(amountRub / 90));
                const product_data = {...item.price_data.product_data};

                if (!product_data.description || product_data.description.trim() === "") {
                    delete product_data.description;
                }

                return {
                    price_data: {
                        currency: "usd",
                        unit_amount: amountUsd,
                        product_data
                    },
                    quantity: item.quantity || 1
                };
            }
            return {
                price: item.price,
                quantity: item.quantity || 1
            }
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: convertedLineItems,
            mode: 'payment',
            success_url: 'https://react-macaroon-shop.vercel.app/success',
            cancel_url: 'https://react-macaroon-shop.vercel.app/cancel',
        });

        res.setHeader('Access-Control-Allow-Origin', 'https://react-macaroon-shop.vercel.app');
        return res.status(200).json({ url: session.url });
    } catch (e) {
        console.error("❌ Stripe error:", e);
        return res.status(500).json({ error: e.message });
    }
}
