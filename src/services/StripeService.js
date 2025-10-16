import Stripe from 'stripe';
const stripeSecrect = process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecrect);

export class StripeService {

    /**
     *  Create a checkout Session
     */
    static async createCheckoutSession(data) {
        try {
            data = { ...data, 'mode': 'subscription' };
            const session = await stripe.checkout.sessions.create(data);
            return session;
        } catch (error) {
            console.log("Error Creating checkout session");
            console.log(error);
            return false;
        }
    }

    /**
     *  Retrive the session id
     *
     */
    static async retrieveCheckoutSession(session_id) {
        try {
            const session = await stripe.checkout.sessions.retrieve(session_id);
            return session;
        } catch (error) {
            console.log("Error Creating Customer");
            console.log(error);
            return false;
        }
    }

    /**  Create Customer*/
    static async createCustomer(data) {
        try {
            const customer = await stripe.customers.create({
                name: data.name,
                email: data.email,
            });
            return customer;
        } catch (error) {
            console.log("Error Creating Customer");
            console.log(error);
            return false;
        }
    }

}