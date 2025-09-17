import { PrismaClient } from '@prisma/client';
import { success,error } from '../utils/apiResponse.js';

const prisma = new PrismaClient();

export class PlanContoller {

    /**
     * @param {*} req
     * @param {*} res
     * @returns $Plans
     */
    static async getPlans(req, res) {
        const plans_array = [];
        const plan_count = await prisma.plan.count();
        if (!plan_count) {
            return error(res, "No Plans Found");
        }
        const plans = await prisma.plan.findMany({
            where: {
                 status: true,
            },
        });
        const subscriptionPlans = plans.map(plan => {
            const monthlyprice = plan.monthy_price;
            const yearly_discount = plan.monthy_price * (plan.yearly_discount / 100);
            const yearlyprice = yearly_discount > 0 ? (monthlyprice * 12) - yearly_discount : (monthlyprice * 12);
            return {
                id: plan.id,
                name: plan.name,
                price: {
                    monthly: monthlyprice,
                    yearly: yearlyprice.toFixed(2), // using the calculated value
                    percentage_saved:plan.yearly_discount
                },
                scanLimit: plan.scan_limit,   // using the calculated value
                features:  [...plan.features.matchAll(/<li[^>]*>(?:.|\n)*?<\/svg>(.*?)<\/li>/g)]
  .map(match => match[1].trim()),
                isActive: plan.status,
                description: plan.short_description,
            };

        });
        return success(res, subscriptionPlans, "Plans Information");
    }


}