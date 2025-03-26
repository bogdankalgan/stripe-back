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

    const {items} = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            line_items: items.map(item => ({
                price: item.price_id,
                quantity: item.count,
            })),
            mode: 'payment',
            success_url: 'https://react-macaroon-shop.vercel.app/success',
            cancel_url: 'https://react-macaroon-shop.vercel.app/cancel',
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({url: session.url});
    } catch (e) {
        console.error(e);
        res.status(500).json({error: e.message});
    }
}