import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { getFullImageUrl } from '../utils/helpers.js';
import { success, error } from '../utils/apiResponse.js';
import { validateImageUpload } from '../validators/profiileImageValidation.js';
import { formatUserProfileResponse } from '../utils/userFormatResponse.js';

const prisma = new PrismaClient();

export class UserProfileController {

    static async getProfile(req, res) {
        try {

            const user = await prisma.user.findUnique({
                where: { id: req.user.userId },
            });

            if (!user) {
                return error(res, "User not found", 404);
            }

            const data = await formatUserProfileResponse(user);
            return success(res, data);

        } catch (e) {
            return error(res, "Failed to retrieve profile", 500, [{ details: e.message }]);
        }
    }

    static async updateProfile(req, res) {

        const { name, preferences } = req.body;
        const preferenceData = preferences
            ? {
                ...(preferences.notifications !== undefined && { notifications: preferences.notifications }),
                ...(preferences.darkMode !== undefined && { dark_mode: preferences.darkMode }),
                ...(preferences.defaultAnalysisType && { default_analysis_type: preferences.defaultAnalysisType })
            }
            : {};


        try {
            const updatedUser = await prisma.user.update({
                where: { id: req.user.userId },
                data: {
                    ...(name && { name }),
                    ...preferenceData
                }
            });

            const data = await formatUserProfileResponse(updatedUser);
            return success(res, data);
        } catch (e) {
            return error(res, "Failed to update profile", 500, [{ details: e.message }]);
        }

    }

    static async uploadProfileImage(req, res) {

        const validationErrors = validateImageUpload(req.file);
        if (validationErrors.length > 0) {
            return error(res, "Validation failed", 400, validationErrors);
        }

        try {
            const uploadType = 'avatar';
            const filename = `user_${req.user.userId}_${Date.now()}.jpg`;
            const uploadDir = path.join(`./public/uploads/${uploadType}`);
            const filePath = path.join(uploadDir, filename);
            const imageUrl = `${process.env.BACKEND_URL}/uploads/${uploadType}/${filename}`;

            // Ensure uploads directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Save the file to disk
            fs.writeFileSync(filePath, req.file.buffer);

            // Update the user in DB
            const updatedUser = await prisma.user.update({
                where: { id: req.user.userId },
                data: { profile_image: filename }
            });

            const data = await formatUserProfileResponse(updatedUser);
            return success(res, data);

        } catch (e) {
            return error(res, "Failed to upload image", 500, [{ details: e.message }]);
        }
    }

    static async deleteProfile(req, res) {
        try {
            const deleteUser = await prisma.user.delete({
                where: {
                    id: req.user.userId,
                },
            });
            if(deleteUser){
                return success(res, [], 'Account Deleted Succesfully',204);
            }
            return error(res, [], 'Error in Deleting Account. Try again later',410);
        } catch (e) {
            return error(res, "Failed to Delete Profile", 500, [{ details: e.message }]);
        }
    }

}