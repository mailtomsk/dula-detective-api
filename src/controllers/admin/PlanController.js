import { PrismaClient } from '@prisma/client';
import { success,error } from '../../utils/apiResponse.js';
import slugify from 'slugify';

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
            orderBy: {
                id: 'asc' // 'asc' for ascending, 'desc' for descending
            }
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
                features: plan.features ?? '',
                isActive: plan.status,
                description: plan.short_description,
            };

        });
        return success(res, subscriptionPlans, "Plans Information");
    }

    static async changeStatus(req, res) {

        try {
            const plan = await prisma.plan.findUnique({
                where: { id: req.body.plan_id },
            });
            if(plan){
                var plan_status   = !plan.status;
                var updatestatus = await prisma.plan.update({
                     where: { id: req.user.userId },
                     data:{ status: plan_status}
                });
                if(updatestatus){
                    return success(res, {'status':plan_status}, "Plan Status Changed Successfully");
                }
            }

        } catch (e) {
            return error(res, "Error in change in Plan status. Try again", 500, [{ details: e.message }]);
        }
    }

    static async changeStatus(req, res) {

        try {
            const plan = await prisma.plan.findUnique({
                where: { id: req.body.plan_id },
            });
            if(plan){
                var plan_status   = !plan.status;
                var updatestatus = await prisma.plan.update({
                     where: { id: req.user.userId },
                     data:{ status: plan_status}
                });
                if(updatestatus){
                    return success(res, {'status':plan_status}, "Plan Status Changed Successfully");
                }
            }

        } catch (e) {
            return error(res, "Error in change in Plan status. Try again", 500, [{ details: e.message }]);
        }
    }
    static async createOrUpdatePlan(req, res) {
        try {

            const data = req.body;
            const plan_id = data.plan_id;
            const dbData = {
                'name':data.planData.name,
                'short_description':data.planData.short_description,
                'slug': slugify(data.planData.name),
                'monthy_price':data.planData.monthy_price,
                'yearly_discount':data.planData.yearly_discount,
                'scan_limit':data.planData.scan_limit,
                'features':data.planData.features,
                'status':data.planData.status,
                'createdAt':new Date()
            };

            var existing = false;
            if(plan_id){
                 existing = await prisma.plan.findFirst({
                        where: {
                            id: plan_id,
                        }
                 });
            }

            if(existing){
                await prisma.plan.update({
                    where: { id: existing.id }, // or another unique field
                    data: dbData,
                });
                return success(res, dbData, "New Plan Created Successfully");

            } else {
                await prisma.plan.create({
                    data: dbData,
                });

                return success(res, dbData, "Plan Updated Successfully");
            }

        } catch (e) {
            return error(res, "Error in saving plan. Try again", 500, [{ details: e.message }]);
        }
    }




}