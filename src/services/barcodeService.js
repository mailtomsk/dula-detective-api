
import { PrismaClient } from '@prisma/client';

const default_api = 'openfoodfact';
const prisma = new PrismaClient();

export class BarcodeService {

    static async fetchdetails(barcode) {

          let check_db = await prisma.barcodeDetails.findUnique({ where: { barcode } });
          var details;
          if(check_db){
                const result = {
                    barcode:barcode,
                    name: check_db.productName || 'N/A',
                    brand: check_db.brand || 'N/A',
                    ingredients: check_db.ingredients || 'N/A',
                    image_url: check_db.image_url || null,
                    nutrition: check_db.nutrition || null,
                    ai_reponse: check_db.aiResponse || null
                 };
                  details = {
                              "success":true,
                              "message":'Product data found from db',
                              "data":result,
                  };
          } else {
                details = await this.openfoodfact(barcode);
          }

          if(details){
               const {success,message,data} = details;
               await this.upsertBarcode(barcode,data);
               if(success == true) {
                    return details;
               } else {
                    return details;
               }
          } else {
               return false;
          }


    }
    static async upsertBarcode(barcode, data) {

        return await prisma.barcodeDetails.upsert({
               where: {barcode: barcode},
               update: {
                    'productName':data.name,
                    'brand':data.brand,
                    'image_url':data.image_url,
                    'ingredients':data.ingredients,
                    'nutrition': data.nutrition,
               },
               create:{
                    'barcode':barcode,
                    'productName':data.name,
                    'brand':data.brand,
                    'image_url':data.image_url,
                    'ingredients':data.ingredients,
                    'nutrition':data.nutrition,
                    'aiResponse':null,
               }
         });
    }

    static async updateAIResponse(barcode, data) {
       return await prisma.barcodeDetails.upsert({
               where: {barcode: barcode},
               update: {
                    'aiResponse': JSON.stringify(data),
               },
               create:{
                    'barcode':barcode,
                    'aiResponse': JSON.stringify(data),
               }
         });
    }





    static async openfoodfact(barcode) {

        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        if (data.status === 0) {
          return {
            "success":false,
            "message":'Data Not Found',
            "data":null
          };
        }

        const product = data.product || false;
        if(!product){
             return {
                "success":false,
                "message":'Data Not Found',
                "data":null
             };
        }

        const result = {
            barcode:barcode,
            name: product.product_name || 'N/A',
            brand: product.brands || 'N/A',
            ingredients: product.ingredients_text || 'N/A',
            image_url: product.image_url || null,
            nutrition: await this.readableNutrition(product.nutriments) || null,
        };

        return {
                "success":true,
                "message":'Product data found',
                "data":result,
          };


    }
     static async readableNutrition(obj) {

        return Object.entries(obj)
            .map(([key, value]) => {
                const label = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, char => char.toUpperCase());
                return `${label}: ${value}`;
            })
            .join('\n');
    }

}