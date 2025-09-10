export function validateImageUpload(file) {
    const errors = [];
  
    if (!file) {
      errors.push({ field: "image", message: "Image file is required" });
      return errors;
    }
  
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push({ field: "image", message: "Only JPG, JPEG, PNG, WEBP or SVG formats are allowed" });
    }
  
    if (file.size > 5 * 1024 * 1024) {
      errors.push({ field: "image", message: "Image must be less than 5MB" });
    }
  
    return errors;
  }
  