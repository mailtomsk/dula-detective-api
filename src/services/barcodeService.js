
import { PrismaClient } from '@prisma/client';

const default_api = 'openfoodfact';
const prisma = new PrismaClient();



export class BarcodeService {

     static async fetchdetails(barcode) {

          let check_db = await prisma.barcodeDetails.findUnique({ where: { barcode } });
          var details;
          if (check_db) {
               const result = {
                    barcode: barcode,
                    name: check_db.product_name || 'N/A',
                    brand: check_db.brand || 'N/A',
                    ingredients: check_db.ingredients || 'N/A',
                    product_type: check_db.product_type ?? null,
                    image_url: check_db.image_url || null,
                    nutrition: check_db.nutrition || null,
                    ai_reponse: check_db.aiResponse || null
               };
               details = {
                    "success": true,
                    "message": 'Product data found from db',
                    "data": result,
               };
          } else {
               details = await this.openfoodfact(barcode);
          }

          if (details) {
               const { success, message, data } = details;
               if (success == true) {
                    await this.upsertBarcode(barcode, data);
                    return details;
               } else {
                    details = await this.barcodeLookUp(barcode);
                    if (details) {
                         const { success, message, data } = details;
                         if (success == true) {
                              await this.upsertBarcode(barcode, data);
                              return details;
                         }
                    }
                    return false;
               }
          } else {
               return false;
          }


     }
     static async upsertBarcode(barcode, data) {

          return await prisma.barcodeDetails.upsert({
               where: { barcode: barcode },
               update: {
                    'product_name': data.name,
                    'brand': data.brand,
                    'image_url': data.image_url,
                    'product_type': data.product_type,
                    'ingredients': data.ingredients,
                    'nutrition': data.nutrition,
               },
               create: {
                    'barcode': barcode,
                    'product_name': data.name,
                    'product_type': data.product_type,
                    'brand': data.brand,
                    'image_url': data.image_url,
                    'ingredients': data.ingredients,
                    'nutrition': data.nutrition,
                    'aiResponse': null,
               }
          });
     }

     static async updateAIResponse(barcode, data) {
          return await prisma.barcodeDetails.upsert({
               where: { barcode: barcode },
               update: {
                    'aiResponse': JSON.stringify(data),
               },
               create: {
                    'barcode': barcode,
                    'aiResponse': JSON.stringify(data),
               }
          });
     }




     /***
      * https://world.openfoodfacts.org/
      * # API Documentaion
      * https://openfoodfacts.github.io/openfoodfacts-server/api/
      *
      */
     static async openfoodfact(barcode) {

          const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}?product_type=all`);
          const data = await response.json();
          if (data.status === 0) {
               return {
                    "success": false,
                    "message": 'Data Not Found',
                    "data": null
               };
          }
          const product = data.product || false;
          if (!product) {
               return {
                    "success": false,
                    "message": 'Data Not Found',
                    "data": null
               };
          }

          const result = {
               barcode: barcode,
               name: product.product_name || 'N/A',
               brand: product.brands || 'N/A',
               product_type:product.product_type || null,
               ingredients: product.ingredients_text || 'N/A',
               image_url: product.image_url || null,
               nutrition: await this.readableNutrition(product.nutriments) || null,
          };

          return {
               "success": true,
               "message": 'Product data found',
               "data": result,
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

     /**
      *
      * Barcode Look up
      * barcodelookup.com
      * https://account.barcodelookup.com/
      *
      */
     static async barcodeLookUp(barcode) {
          const apiKey = process.env.BARCODELOOKUP_API_KEY;
          if (apiKey) {
               const url = `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=${apiKey}`;
               console.log(url)
               try {
                    const response = await fetch(url);
                    const data = await response.json();
                    console.log(data,"barcodeLookUp");
                    const product = data.products[0] ?? false;
                    if(product){
                         const result = {
                              barcode: barcode,
                              name: product.title ?? null,
                              brand: product.brand || null,
                              ingredients: product.ingredients || null,
                              image_url: product.image_url || null,
                              nutrition: product.nutrition_facts || null,
                         };
                         return {
                              "success": true,
                              "message": 'Product data found',
                              "data": result,
                         };

                    }

                    return {
                         "success": false,
                         "message": 'Data Not Found',
                         "data": null
                    };
               } catch (error) {
                    console.error('Error fetching barcode data:', error);

               }

               return {
                    "success": false,
                    "message": 'Data Not Found',
                    "data": null
               };
          }
     }


}