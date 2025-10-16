import { success, error, openaiError } from '../utils/apiResponse.js';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../services/StripeService.js';
import { id } from 'date-fns/locale';


const prisma = new PrismaClient();


export class StripController {

    static async createSession(req, res) {
        const user = req.user;
        const plan_id = req.body.plan_id;
        try {
            var customer_id = user.stripe_customer_id;
            var customer = null;
            if (!customer_id) {
                customer = await StripeService.createCustomer(user);
                customer_id = customer.id ?? null;
                if (customer_id) {
                    await prisma.user.update({
                        where: { id: user.userId }, // or another unique field
                        data: { stripe_customer_id: customer_id },
                    });
                }
            }
            if (customer_id) {
                const planDetails = await prisma.plan.findFirst({
                    where: {
                        id: parseInt(plan_id)
                    }
                });
                var data = {
                    success_url: 'https://duladetectiveapi.oclocksoftware.info/api/auth/plans/payment-sucess?session_id={CHECKOUT_SESSION_ID}',
                    client_reference_id: customer_id,
                    customer: customer_id,
                    line_items: [{
                        price_data: {
                            currency: 'USD',
                            product_data: {
                                name: planDetails.name,
                                description: planDetails.short_description,
                            },
                            recurring: {
                                interval: 'month',
                            },
                            unit_amount: planDetails.monthy_price * 100,
                        },
                        quantity: 1
                    }],
                    mode: 'subscription',
                    metadata: {
                        plan_id: planDetails.id,
                        plan_name: planDetails.name,
                        customer_id: user.userId
                    }
                }
                const subscription = await StripeService.createCheckoutSession(data);
                console.log(subscription, "payment status in controller");

                return success(res, subscription, 200);
            }

            return error(res, "Error in Creating Payment link", 500);

        } catch (errors) {
            console.log("Error Creating Customer");
            console.log(errors);
            return error(res, "Error in Creating Payment link", 500);
        }

    }


    static async paymentSucess(req, res) {
        try {
            const session_id = req.query.session_id;
            const session = await StripeService.retrieveCheckoutSession(session_id);

            if (session) {

                var userSubscription = await prisma.userSubscription.create({
                    data: {
                        user_id: parseInt(session.metadata.customer_id),
                        plan_id: parseInt(session.metadata.plan_id),
                        subscription_id: session.subscription
                    }
                });
                if(userSubscription){
                    await prisma.user.update({
                        where:{ id:parseInt(session.metadata.customer_id) },
                        data:{ plan_id:parseInt(session.metadata.plan_id) }
                    })
                }
                 return success(res, userSubscription, 200);
            }
            return error(res, "Error in handling Payment", 500);

        } catch (errors) {
            console.log("Error in handling Payment");
            console.log(errors);
            return error(res, "Error in handling Payment", 500);
        }

    }


    static async upldateUserPlan(req, res) {
        const user = req.user;
        const plan_id = req.body.plan_id;
        try {

            const planDetails = await prisma.plan.findFirst({
                where: {
                    id: parseInt(plan_id)
                }
            });
            console.log(planDetails);
            const updatedUser = await prisma.user.update({
                where: { id: req.user.userId },
                data: { plan_id: planDetails.id,plan:planDetails.name }
            });

           const users = await prisma.user.findFirst({ where: { id:user.id } });

            return success(res, {
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                emailVerified: updatedUser.emailVerified,
                createdAt: updatedUser.created_at,
                plan: updatedUser.plan,
              },
           }, "Upgraded Successfully", 200);


        }  catch (errors) {
            console.log("Error Creating Customer");
            console.log(errors);
            return error(res, "Error in Updating Plan", 500);
        }
    }




}