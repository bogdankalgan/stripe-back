import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).send('ok');
    }

    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    const {items, customItem} = req.body;

    try {
        let line_items = [];

        if (customItem) {
            line_items.push({
                price_data: {
                    currency: 'rub',
                    product_data: {
                        name: customItem.name,
                        description: customItem.description,
                    },
                    unit_amount: customItem.amount,
                },
                quantity: 1
            });
        } else if (items && Array.isArray(items)) {
            line_items = items.map(item => ({
                price: item.price_id,
                quantity: item.count,
            }));
        } else {
            return res.status(400).json({error: 'Invalid input'});
        }

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: 'https://react-macaroon-shop.vercel.app/success',
            cancel_url: 'https://react-macaroon-shop.vercel.app/cancel',
        });

        return res.status(200).json({url: session.url});
    } catch (e) {
        console.error(e);
        return res.status(500).json({error: e.message});
    }
}